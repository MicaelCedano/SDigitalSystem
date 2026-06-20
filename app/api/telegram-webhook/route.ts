import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery, escapeHTML } from "@/lib/telegram";
import { checkAchievements } from "@/app/actions/achievements";
import { checkAndNotifyPurchaseComplete } from "@/app/actions/purchase";
import { calcularPagoLote } from "@/lib/pago-lote";

/**
 * Devuelve los chat_id autorizados para ejecutar acciones de admin
 * (aprobar/rechazar lotes, cambiar estado de pedidos) desde el bot.
 *
 * Prioridad:
 *  1. TELEGRAM_ADMIN_CHAT_ID (lista separada por comas si hay varios admins)
 *  2. TELEGRAM_CHAT_ID (legacy)
 *  3. empty → nadie autorizado (fail closed)
 */
function getAuthorizedAdminChatIds(): string[] {
    const raw = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";
    return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function isAuthorizedAdmin(chatId: number | string | undefined): boolean {
    if (chatId === undefined || chatId === null) return false;
    const authorized = getAuthorizedAdminChatIds();
    if (authorized.length === 0) return false;
    return authorized.includes(String(chatId));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Log update for debugging
        console.log("[Telegram Webhook] Recibido:", JSON.stringify(body, null, 2));

        if (body.message && body.message.text) {
            const { text, chat, from, message_id } = body.message;

            if (text.startsWith('/start') || text.startsWith('/ayuda')) {
                const helpMsg = `👋 <b>Asistente de SDigital</b>\n\n` +
                    `Usa el botón azul <b>"🛍️ CREAR PEDIDO"</b> que aparece abajo a la izquierda para gestionar tus pedidos de forma rápida y segura.`;

                const buttons = [
                    [
                        {
                            text: "📝 ABRIR FORMULARIO",
                            web_app: { url: "https://sdigitalsystem.vercel.app/pedidos/nuevo" }
                        }
                    ]
                ];

                await sendTelegramMessage(helpMsg, buttons);
                return NextResponse.json({ ok: true });
            }

            if (text.startsWith('/pedido ')) {
                const content = text.replace('/pedido ', '').trim();
                const parts = content.split('|');

                if (content.length === 0 || parts.length < 2) {
                    const helpMsg = `✨ <b>Usa nuestra Mini App para crear pedidos más rápido:</b>`;
                    const buttons = [
                        [
                            {
                                text: "📝 PONGA LA ORDEN",
                                web_app: { url: "https://sdigitalsystem.vercel.app/pedidos/nuevo" }
                            }
                        ]
                    ];
                    await sendTelegramMessage(helpMsg, buttons);
                    return NextResponse.json({ ok: true });
                }

                const clienteNombre = parts[0].trim();
                const detalle = parts[1].trim();

                try {
                    // Try to find a user to associate this with (using the first admin for now or linking by telegram)
                    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
                    if (!admin) throw new Error("No hay un administrador configurado para procesar este pedido.");

                    const result = await prisma.$transaction(async (tx) => {
                        const count = await (tx as any).order.count();
                        const year = new Date().getFullYear();
                        const codigo = `PED-${year}-${(count + 1).toString().padStart(4, '0')}`;

                        const order = await (tx as any).order.create({
                            data: {
                                codigo,
                                clienteNombre,
                                detalle,
                                usuarioId: admin.id,
                                status: 'PENDIENTE'
                            }
                        });

                        await (tx as any).orderHistory.create({
                            data: {
                                orderId: order.id,
                                estadoAnterior: null,
                                estadoNuevo: 'PENDIENTE',
                                usuarioId: admin.id
                            }
                        });

                        return order;
                    });

                    const successMsg = `✅ <b>PEDIDO CREADO: ${result.codigo}</b>\n\n` +
                        `👤 <b>Por:</b> ${from.first_name} (Telegram)\n` +
                        `🏢 <b>Cliente:</b> ${clienteNombre}\n` +
                        `📝 <b>Detalle:</b>\n${detalle}`;

                    const buttons = [
                        [{ text: "✅ ACEPTAR PEDIDO", callback_data: `update_status:${result.id}:PROCESO` }]
                    ];

                    await sendTelegramMessage(successMsg, buttons);
                } catch (e: any) {
                    await sendTelegramMessage(`❌ <b>Error al crear pedido:</b> ${e.message}`);
                }
                return NextResponse.json({ ok: true });
            }
        }

        if (body.callback_query) {
            const { id, data, message, from } = body.callback_query;

            // Gate de seguridad: solo Micael (o admins autorizados en el env)
            // pueden ejecutar acciones desde el bot. Cualquier otro chat_id
            // recibe una respuesta neutral y la acción se ignora silenciosamente.
            if (!isAuthorizedAdmin(from?.id)) {
                await answerCallbackQuery(
                    id,
                    "⛔ No autorizado. Esta acción solo la puede ejecutar el administrador."
                ).catch(() => {});
                console.warn(
                    `[Telegram Webhook] Callback rechazado: chat_id=${from?.id} username=${from?.username} data=${data}`
                );
                return NextResponse.json({ ok: true });
            }

            if (data && (data.startsWith("approve_lote:") || data.startsWith("reject_lote:"))) {
                const isApprove = data.startsWith("approve_lote:");
                const loteId = parseInt(data.split(":")[1]);

                if (isNaN(loteId)) {
                    await answerCallbackQuery(id, "Error: ID de lote inválido");
                    return NextResponse.json({ ok: true });
                }

                const lote = await prisma.lote.findUnique({
                    where: { id: loteId },
                    include: {
                        equipos: { select: { id: true, purchaseId: true } },
                        tecnico: { select: { id: true, name: true, username: true } }
                    }
                });

                if (!lote) {
                    await answerCallbackQuery(id, "Lote no encontrado");
                    return NextResponse.json({ ok: true });
                }

                if (lote.estado === "Entregado") {
                    await answerCallbackQuery(id, "Este lote ya fue aprobado");
                    return NextResponse.json({ ok: true });
                }

                if (lote.estado !== "Pendiente") {
                    await answerCallbackQuery(id, `Lote en estado: ${lote.estado}`);
                    return NextResponse.json({ ok: true });
                }

                const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
                const adminUserId = admin?.id || 1;
                const tecnicoName = lote.tecnico.name || lote.tecnico.username;
                const equiposCount = lote.equipos.length;

                // Fuente única de verdad: se usa para pago (approve) Y para
                // los mensajes del bot (approve y reject). Garantiza que el
                // número de equipos, buenos y malos mostrado sea el real.
                const pago = await calcularPagoLote(prisma, loteId);
                const paymentAmount = pago.total;

                if (isApprove) {

                    await prisma.$transaction(async (tx) => {
                        await tx.lote.update({ where: { id: loteId }, data: { estado: "Entregado" } });

                        await tx.equipo.updateMany({
                            where: { loteId },
                            data: { estado: "Revisado", userId: null }
                        });

                        if (equiposCount > 0) {
                            await tx.equipoHistorial.createMany({
                                data: lote.equipos.map(eq => ({
                                    equipoId: eq.id,
                                    fecha: new Date(),
                                    estado: "Revisado",
                                    userId: adminUserId,
                                    observacion: `Lote ${lote.codigo} aprobado vía Telegram.`,
                                    loteId
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
                                    data: {
                                        walletId: wallet.id,
                                        nombre: "Principal",
                                        tipo: "corriente",
                                        saldo: 0,
                                        fechaCreacion: new Date()
                                    }
                                });
                            }

                            await tx.walletTransaction.create({
                                data: {
                                    tecnicoId: lote.tecnicoId,
                                    loteId,
                                    monto: paymentAmount,
                                    tipo: "ingreso",
                                    estado: "Aprobado",
                                    fecha: new Date(),
                                    descripcion: `Pago por Lote QC: ${lote.codigo} (${pago.buenos}/${pago.totalEquipos} buenos × RD$${pago.tarifa}) [Telegram]`
                                }
                            });

                            await tx.walletAccount.update({
                                where: { id: principalAcc.id },
                                data: { saldo: { increment: paymentAmount } }
                            });

                            await tx.wallet.update({
                                where: { id: wallet.id },
                                data: { saldo: { increment: paymentAmount } }
                            });
                        }

                        await tx.notification.create({
                            data: {
                                tecnicoId: lote.tecnicoId,
                                tipo: "lote_aprobado",
                                titulo: "Lote Aprobado",
                                mensaje: `Tu lote ${lote.codigo} ha sido aprobado. Se han acreditado RD$ ${paymentAmount.toLocaleString()} a tu cuenta.`,
                                monto: paymentAmount,
                                loteCodigo: lote.codigo,
                                fromUserId: adminUserId,
                                redirectUrl: `/qc?lote=${lote.codigo}`,
                                leida: false,
                                fecha: new Date()
                            }
                        });
                    });

                    await checkAchievements(lote.tecnicoId);
                    const purchaseIds = [...new Set(lote.equipos.map(e => e.purchaseId).filter(Boolean))] as number[];
                    for (const purchaseId of purchaseIds) {
                        await checkAndNotifyPurchaseComplete(purchaseId);
                    }

                    const updatedMsg =
                        `🔔 <b>Lote para Revisión</b>\n\n` +
                        `👤 <b>Técnico:</b> ${escapeHTML(tecnicoName)}\n` +
                        `📦 <b>Lote:</b> <code>${escapeHTML(lote.codigo)}</code>\n` +
                        `📱 <b>Equipos:</b> ${pago.totalEquipos}  ✅ Buenos: ${pago.buenos}  ❌ Malos: ${pago.malos}\n` +
                        `💰 <b>Pago:</b> RD$ ${paymentAmount.toLocaleString()} (RD$ ${pago.tarifa.toLocaleString()}/bueno)\n\n` +
                        `✅ <b>APROBADO</b> por ${escapeHTML(from.first_name || 'Admin')}`;

                    await editTelegramMessage(message.message_id, updatedMsg, []);
                    await answerCallbackQuery(id, `✅ Lote ${lote.codigo} aprobado`);

                } else {
                    await prisma.lote.update({ where: { id: loteId }, data: { estado: "Abierto" } });

                    await prisma.notification.create({
                        data: {
                            tecnicoId: lote.tecnicoId,
                            tipo: "lote_rechazado",
                            titulo: "Lote Devuelto",
                            mensaje: `Tu lote ${lote.codigo} ha sido devuelto para correcciones.`,
                            loteCodigo: lote.codigo,
                            fromUserId: adminUserId,
                            redirectUrl: `/qc?lote=${lote.codigo}`,
                            leida: false,
                            fecha: new Date()
                        }
                    });

                    const updatedMsg =
                        `🔔 <b>Lote para Revisión</b>\n\n` +
                        `👤 <b>Técnico:</b> ${escapeHTML(tecnicoName)}\n` +
                        `📦 <b>Lote:</b> <code>${escapeHTML(lote.codigo)}</code>\n` +
                        `📱 <b>Equipos:</b> ${pago.totalEquipos}  ✅ Buenos: ${pago.buenos}  ❌ Malos: ${pago.malos}\n\n` +
                        `❌ <b>RECHAZADO</b> por ${escapeHTML(from.first_name || 'Admin')}`;

                    await editTelegramMessage(message.message_id, updatedMsg, []);
                    await answerCallbackQuery(id, `❌ Lote ${lote.codigo} rechazado`);
                }

                return NextResponse.json({ ok: true });
            }

            if (data && data.startsWith("update_status:")) {
                // El gate de admin ya se aplicó arriba (en el bloque de
                // callback_query), así que no hace falta duplicarlo aquí.
                const [_, orderIdStr, newStatus] = data.split(":");
                const orderId = parseInt(orderIdStr);

                if (isNaN(orderId)) {
                    await answerCallbackQuery(id, "Error: ID de pedido inválido");
                    return NextResponse.json({ ok: true });
                }

                // Get order to check current status and details
                const order = await (prisma as any).order.findUnique({
                    where: { id: orderId },
                    include: {
                        usuario: true,
                    }
                });

                if (!order) {
                    await answerCallbackQuery(id, "Error: Pedido no encontrado");
                    return NextResponse.json({ ok: true });
                }

                if (order.status === newStatus) {
                    await answerCallbackQuery(id, `El pedido ya está en estado ${newStatus}`);
                    return NextResponse.json({ ok: true });
                }

                // Get a system user ID to log the action (using the first admin found)
                const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
                const actionUserId = admin?.id || order.usuarioId;

                // Perform the update
                await prisma.$transaction(async (tx) => {
                    await (tx as any).order.update({
                        where: { id: orderId },
                        data: { status: newStatus }
                    });

                    await (tx as any).orderHistory.create({
                        data: {
                            orderId: orderId,
                            estadoAnterior: order.status,
                            estadoNuevo: newStatus,
                            usuarioId: actionUserId
                        }
                    });
                });

                // Prepare next buttons
                let nextButtons: any[] = [];
                if (newStatus === 'PROCESO') {
                    nextButtons = [[{ text: "📦 MARCAR COMO LISTO", callback_data: `update_status:${orderId}:LISTO` }]];
                } else if (newStatus === 'LISTO') {
                    nextButtons = [[{ text: "🚚 ENTREGAR MERCANCIA", callback_data: `update_status:${orderId}:ENTREGADO` }]];
                }

                // Re-escape and format the original message text to include the update
                // We remove the old prompt if present or append new info
                const originalText = message.text || "";
                const cleanText = originalText.split('\n\n✅')[0]; // Remove previous update info if exists

                const statusLabels: Record<string, string> = {
                    'PROCESO': 'EN PROCESO 🔧',
                    'LISTO': 'LISTO PARA ENTREGA ✅',
                    'ENTREGADO': 'ENTREGADO 🚚'
                };

                const updatedText = `${originalText}\n\n📍 <b>Actualizado a:</b> ${statusLabels[newStatus] || newStatus}\n👤 <b>Por:</b> ${from.first_name || 'Usuario'} (Telegram)`;

                await editTelegramMessage(message.message_id, updatedText, nextButtons.length > 0 ? nextButtons : null);
                await answerCallbackQuery(id, `Pedido ${order.codigo} actualizado a ${newStatus}`);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("[Telegram Webhook] Error crítico:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
