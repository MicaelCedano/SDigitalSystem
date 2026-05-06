import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTelegramMessage, answerCallbackQuery, editTelegramMessage, escapeHTML } from "@/lib/telegram";

async function getFirstAdmin() {
    return prisma.user.findFirst({ where: { role: "admin", isActive: true } });
}

async function handleApproveSolicitud(solicitudId: number, callbackQueryId: string, messageId: number, chatId?: string | number) {
    const solicitud = await prisma.solicitudImei.findUnique({ where: { id: solicitudId } });
    if (!solicitud) {
        await answerCallbackQuery(callbackQueryId, "❌ Solicitud no encontrada.");
        return;
    }
    if (solicitud.estado !== "Pendiente") {
        await answerCallbackQuery(callbackQueryId, "⚠️ Esta solicitud ya fue procesada.");
        return;
    }

    const admin = await getFirstAdmin();
    if (!admin) {
        await answerCallbackQuery(callbackQueryId, "❌ No se encontró usuario admin.");
        return;
    }

    const qcUser = await prisma.user.findUnique({ where: { id: solicitud.qcId } });
    if (!qcUser) {
        await answerCallbackQuery(callbackQueryId, "❌ Usuario QC no encontrado.");
        return;
    }

    const imeis = solicitud.imeis as string[];
    const equipos = await prisma.equipo.findMany({
        where: { imei: { in: imeis }, estado: "En Inventario" }
    });

    if (equipos.length === 0) {
        await answerCallbackQuery(callbackQueryId, "❌ Ningún equipo disponible en inventario.");
        await prisma.solicitudImei.update({
            where: { id: solicitudId },
            data: { estado: "Rechazado", adminId: admin.id, fechaResolucion: new Date(), observacion: "Sin equipos disponibles al momento de aprobar." }
        });
        return;
    }

    const equipoIds = equipos.map(e => e.id);
    const qcName = qcUser.name || qcUser.username;
    const adminName = admin.name || admin.username;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const baseCode = `LOTE-${qcName}-${dateStr}`;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const lastLote = await prisma.lote.findFirst({
        where: { tecnicoId: qcUser.id, fecha: { gte: todayStart, lte: todayEnd }, codigo: { startsWith: baseCode } },
        orderBy: { id: "desc" }
    });

    let suffix = 1;
    if (lastLote) {
        const parts = lastLote.codigo.split("-");
        const n = parseInt(parts[parts.length - 1]);
        if (!isNaN(n)) suffix = n + 1;
    }
    const codigoLote = `${baseCode}-${suffix}`;

    await prisma.$transaction(async (tx) => {
        const lote = await tx.lote.create({
            data: { codigo: codigoLote, fecha: new Date(), tecnicoId: qcUser.id, estado: "Abierto" }
        });
        await tx.equipo.updateMany({
            where: { id: { in: equipoIds } },
            data: { userId: qcUser.id, loteId: lote.id, estado: "En Revisión" }
        });
        await tx.equipoHistorial.createMany({
            data: equipoIds.map(id => ({
                equipoId: id, userId: admin.id, estado: "En Revisión", fecha: new Date(),
                observacion: `Solicitud aprobada por ${adminName} vía Telegram. Lote: ${codigoLote}`
            }))
        });
        await tx.solicitudImei.update({
            where: { id: solicitudId },
            data: { estado: "Aprobado", adminId: admin.id, fechaResolucion: new Date() }
        });
        await tx.notification.create({
            data: {
                tecnicoId: qcUser.id, tipo: "solicitud_imei_aprobada", titulo: "¡Solicitud Aprobada!",
                mensaje: `Tu solicitud fue aprobada. Lote ${codigoLote} creado con ${equipos.length} equipo(s).`,
                loteCodigo: codigoLote, leida: false, fecha: new Date(),
                fromUserId: admin.id, redirectUrl: "/qc"
            }
        });
    });

    await answerCallbackQuery(callbackQueryId, `✅ Aprobado. Lote ${codigoLote} creado.`);
    await editTelegramMessage(
        messageId,
        `✅ <b>Solicitud #${solicitudId} APROBADA</b>\n👤 QC: ${escapeHTML(String(qcName))}\n📦 Lote: <code>${escapeHTML(codigoLote)}</code> (${equipos.length} equipos)`,
        undefined,
        chatId
    );
}

async function handleRejectSolicitud(solicitudId: number, callbackQueryId: string, messageId: number, chatId?: string | number) {
    const solicitud = await prisma.solicitudImei.findUnique({ where: { id: solicitudId } });
    if (!solicitud) {
        await answerCallbackQuery(callbackQueryId, "❌ Solicitud no encontrada.");
        return;
    }
    if (solicitud.estado !== "Pendiente") {
        await answerCallbackQuery(callbackQueryId, "⚠️ Esta solicitud ya fue procesada.");
        return;
    }

    const admin = await getFirstAdmin();
    if (!admin) {
        await answerCallbackQuery(callbackQueryId, "❌ No se encontró usuario admin.");
        return;
    }

    const qcUser = await prisma.user.findUnique({ where: { id: solicitud.qcId } });

    await prisma.solicitudImei.update({
        where: { id: solicitudId },
        data: { estado: "Rechazado", adminId: admin.id, fechaResolucion: new Date() }
    });
    await prisma.notification.create({
        data: {
            tecnicoId: solicitud.qcId, tipo: "solicitud_imei_rechazada", titulo: "Solicitud de IMEIs Rechazada",
            mensaje: "Tu solicitud de IMEIs fue rechazada por el administrador.",
            leida: false, fecha: new Date(), fromUserId: admin.id, redirectUrl: "/qc"
        }
    });

    const qcName = qcUser?.name || qcUser?.username || `#${solicitud.qcId}`;
    await answerCallbackQuery(callbackQueryId, "❌ Solicitud rechazada.");
    await editTelegramMessage(
        messageId,
        `❌ <b>Solicitud #${solicitudId} RECHAZADA</b>\n👤 QC: ${escapeHTML(String(qcName))}`,
        undefined,
        chatId
    );
}

async function handleApproveLote(loteId: number, callbackQueryId: string, messageId: number, chatId?: string | number) {
    const lote = await prisma.lote.findUnique({
        where: { id: loteId },
        include: { equipos: { select: { id: true, purchaseId: true } }, tecnico: true }
    });
    if (!lote) {
        await answerCallbackQuery(callbackQueryId, "❌ Lote no encontrado.");
        return;
    }
    if (lote.estado !== "Pendiente") {
        await answerCallbackQuery(callbackQueryId, "⚠️ Este lote ya fue procesado.");
        return;
    }

    const admin = await getFirstAdmin();
    if (!admin) {
        await answerCallbackQuery(callbackQueryId, "❌ No se encontró usuario admin.");
        return;
    }

    const totalCount = lote.equipos.length;
    const paymentAmount = totalCount * 50;
    const tecnicoName = lote.tecnico.name || lote.tecnico.username;

    await prisma.$transaction(async (tx) => {
        await tx.lote.update({ where: { id: loteId }, data: { estado: "Entregado" } });
        await tx.equipo.updateMany({ where: { loteId }, data: { estado: "Revisado", userId: null } });

        const equipoIds = lote.equipos.map(e => e.id);
        if (equipoIds.length > 0) {
            await tx.equipoHistorial.createMany({
                data: equipoIds.map(id => ({
                    equipoId: id, fecha: new Date(), estado: "Revisado", userId: admin.id,
                    observacion: `Lote ${lote.codigo} aprobado vía Telegram.`, loteId
                }))
            });
        }

        if (paymentAmount > 0) {
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: lote.tecnicoId },
                include: { accounts: { where: { nombre: "Principal" } } }
            });
            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { tecnicoId: lote.tecnicoId, saldo: 0 },
                    include: { accounts: { where: { nombre: "Principal" } } }
                });
            }
            let principalAcc = wallet.accounts[0];
            if (!principalAcc) {
                principalAcc = await tx.walletAccount.create({
                    data: { walletId: wallet.id, nombre: "Principal", tipo: "corriente", saldo: 0, fechaCreacion: new Date() }
                });
            }
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: lote.tecnicoId, loteId, monto: paymentAmount,
                    tipo: "ingreso", estado: "Aprobado", fecha: new Date(),
                    descripcion: `Pago por Lote QC: ${lote.codigo} (${totalCount} equipos)`
                }
            });
            await tx.walletAccount.update({ where: { id: principalAcc.id }, data: { saldo: { increment: paymentAmount } } });
            await tx.wallet.update({ where: { id: wallet.id }, data: { saldo: { increment: paymentAmount } } });
        }

        await tx.notification.create({
            data: {
                tecnicoId: lote.tecnicoId, tipo: "lote_aprobado", titulo: "Lote Aprobado",
                mensaje: `Tu lote ${lote.codigo} fue aprobado. Se acreditaron RD$ ${paymentAmount.toLocaleString()} a tu cuenta.`,
                monto: paymentAmount, loteCodigo: lote.codigo, fromUserId: admin.id,
                redirectUrl: `/qc?lote=${lote.codigo}`, leida: false, fecha: new Date()
            }
        });
    });

    await answerCallbackQuery(callbackQueryId, `✅ Lote ${lote.codigo} aprobado. RD$ ${paymentAmount} acreditados.`);
    await editTelegramMessage(
        messageId,
        `✅ <b>Lote ${escapeHTML(lote.codigo)} APROBADO</b>\n👤 Técnico: ${escapeHTML(String(tecnicoName))}\n📱 Equipos: ${totalCount}\n💰 Pago: RD$ ${paymentAmount.toLocaleString()}`,
        undefined,
        chatId
    );
}

async function handleRejectLote(loteId: number, callbackQueryId: string, messageId: number, chatId?: string | number) {
    const lote = await prisma.lote.findUnique({ where: { id: loteId }, include: { tecnico: true } });
    if (!lote) {
        await answerCallbackQuery(callbackQueryId, "❌ Lote no encontrado.");
        return;
    }
    if (lote.estado !== "Pendiente") {
        await answerCallbackQuery(callbackQueryId, "⚠️ Este lote ya fue procesado.");
        return;
    }

    const admin = await getFirstAdmin();
    if (!admin) {
        await answerCallbackQuery(callbackQueryId, "❌ No se encontró usuario admin.");
        return;
    }

    const tecnicoName = lote.tecnico.name || lote.tecnico.username;

    await prisma.lote.update({ where: { id: loteId }, data: { estado: "Abierto" } });
    await prisma.notification.create({
        data: {
            tecnicoId: lote.tecnicoId, tipo: "lote_rechazado", titulo: "Lote Devuelto",
            mensaje: `Tu lote ${lote.codigo} fue devuelto para correcciones.`,
            loteCodigo: lote.codigo, fromUserId: admin.id,
            redirectUrl: `/qc?lote=${lote.codigo}`, leida: false, fecha: new Date()
        }
    });

    await answerCallbackQuery(callbackQueryId, `❌ Lote ${lote.codigo} devuelto.`);
    await editTelegramMessage(
        messageId,
        `❌ <b>Lote ${escapeHTML(lote.codigo)} RECHAZADO</b>\n👤 Técnico: ${escapeHTML(String(tecnicoName))}`,
        undefined,
        chatId
    );
}

async function handleImeiQuery(imei: string, chatId: string) {
    const equipo = await prisma.equipo.findUnique({
        where: { imei },
        include: {
            user: { select: { name: true, username: true } },
            lote: { select: { codigo: true } },
            purchase: { select: { purchaseDate: true } },
            historial: {
                where: { user: { role: "control_calidad" } },
                orderBy: { fecha: "desc" },
                take: 1,
                include: { user: { select: { name: true, username: true } } }
            }
        }
    });

    if (!equipo) {
        await sendTelegramMessage(`❌ IMEI <code>${escapeHTML(imei)}</code> no encontrado en el sistema.`, undefined, chatId);
        return;
    }

    const lastQC = equipo.historial[0]?.user;
    const tecnico = lastQC
        ? (lastQC.name || lastQC.username)
        : equipo.user
            ? (equipo.user.name || equipo.user.username)
            : "Sin asignar";
    const lote = equipo.lote?.codigo || "Sin lote";
    const fecha = equipo.purchase?.purchaseDate
        ? new Date(equipo.purchase.purchaseDate).toLocaleDateString("es-DO")
        : "N/A";

    const msg =
        `📱 <b>IMEI: <code>${escapeHTML(imei)}</code></b>\n\n` +
        `🏷 <b>Marca:</b> ${escapeHTML(equipo.marca || "N/A")}\n` +
        `📲 <b>Modelo:</b> ${escapeHTML(equipo.modelo || "N/A")}\n` +
        `💾 <b>Storage:</b> ${equipo.storageGb ? `${equipo.storageGb}GB` : "N/A"}\n` +
        `🎨 <b>Color:</b> ${escapeHTML(equipo.color || "N/A")}\n` +
        `⭐ <b>Grado:</b> ${escapeHTML(equipo.grado || "N/A")}\n` +
        `🔧 <b>Funcionalidad:</b> ${escapeHTML(equipo.funcionalidad || "N/A")}\n` +
        `📊 <b>Estado:</b> ${escapeHTML(equipo.estado)}\n` +
        `👤 <b>Técnico:</b> ${escapeHTML(String(tecnico))}\n` +
        `📦 <b>Lote:</b> ${escapeHTML(lote)}\n` +
        `📅 <b>Ingresado:</b> ${fecha}` +
        (equipo.observacion ? `\n📝 <b>Obs:</b> ${escapeHTML(equipo.observacion)}` : "");

    await sendTelegramMessage(msg, undefined, chatId);
}

export async function POST(req: NextRequest) {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
        const incoming = req.headers.get("x-telegram-bot-api-secret-token");
        if (incoming !== secret) {
            return NextResponse.json({ ok: false }, { status: 403 });
        }
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    try {
        if (body.callback_query) {
            const cq = body.callback_query;
            const messageChatId = cq.message?.chat?.id != null ? String(cq.message.chat.id) : "";

            if (adminChatId && messageChatId && messageChatId !== String(adminChatId)) {
                await answerCallbackQuery(cq.id, "⛔ No tienes permiso para esta acción.");
                return NextResponse.json({ ok: true });
            }

            const data: string = cq.data || "";
            const messageId: number = cq.message?.message_id;
            const callbackChatId = cq.message?.chat?.id;

            if (data.startsWith("approve_solicitud:")) {
                const id = parseInt(data.split(":")[1]);
                await handleApproveSolicitud(id, cq.id, messageId, callbackChatId);
            } else if (data.startsWith("reject_solicitud:")) {
                const id = parseInt(data.split(":")[1]);
                await handleRejectSolicitud(id, cq.id, messageId, callbackChatId);
            } else if (data.startsWith("approve_lote:")) {
                const id = parseInt(data.split(":")[1]);
                await handleApproveLote(id, cq.id, messageId, callbackChatId);
            } else if (data.startsWith("reject_lote:")) {
                const id = parseInt(data.split(":")[1]);
                await handleRejectLote(id, cq.id, messageId, callbackChatId);
            } else {
                await answerCallbackQuery(cq.id);
            }
        } else if (body.message?.text) {
            const chatId = String(body.message.chat?.id || "");
            const text: string = body.message.text.trim();

            if (adminChatId && chatId !== String(adminChatId)) {
                return NextResponse.json({ ok: true });
            }

            // Extract IMEIs: 15-digit numbers, one per line or space-separated
            const imeis = text.match(/\b\d{15}\b/g);
            if (imeis && imeis.length > 0) {
                for (const imei of imeis) {
                    await handleImeiQuery(imei, chatId);
                }
            } else if (text === "/start" || text.startsWith("/start")) {
                await sendTelegramMessage(
                    "👋 <b>SDigital Bot activo</b>\n\nEnvía un IMEI (15 dígitos) para consultar info de un equipo.",
                    undefined, chatId
                );
            }
        }
    } catch (err) {
        console.error("[Telegram Webhook] Error:", err);
    }

    return NextResponse.json({ ok: true });
}
