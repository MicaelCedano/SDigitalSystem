"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getSantoDomingoDateStr } from "@/lib/utils";
import { sendTelegramMessage, escapeHTML } from "@/lib/telegram";

const MONTO_POR_DESBLOQUEO = 25;

/**
 * Crea una nueva solicitud de desbloqueo.
 * Accesible para: técnicos y QC.
 * Validaciones:
 *  - Lista no vacía
 *  - Sin IMEIs vacíos / duplicados dentro de la misma lista
 *  - IMEIs existen en la tabla equipo
 *  - IMEIs no están ya en otra solicitud Pendiente QC / Pendiente Admin
 *  - IMEIs no están ya desbloqueados (campo desbloqueadoPorId no nulo)
 */
export async function crearSolicitudDesbloqueo(imeis: string[], observacion?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { success: false, error: "No autenticado" };
    }

    const userId = Number(session.user.id);
    const role = session.user.role;
    const rolesPermitidos = ["tecnico", "tecnico_garantias", "control_calidad", "admin"];
    if (!rolesPermitidos.includes(role)) {
        return { success: false, error: "No autorizado para crear solicitudes de desbloqueo" };
    }

    // 1. Sanitizar lista
    const imeisLimpios = (imeis || [])
        .map(i => (i || "").toString().trim())
        .filter(i => i.length > 0);

    if (imeisLimpios.length === 0) {
        return { success: false, error: "Debes enviar al menos un IMEI" };
    }

    // 2. Duplicados dentro de la misma lista
    const setImeis = new Set(imeisLimpios);
    if (setImeis.size !== imeisLimpios.length) {
        const counts = new Map<string, number>();
        for (const i of imeisLimpios) counts.set(i, (counts.get(i) || 0) + 1);
        const duplicados: string[] = [];
        for (const [imei, c] of Array.from(counts.entries())) {
            if (c > 1) duplicados.push(imei);
        }
        return { success: false, error: `Hay IMEIs repetidos en la lista: ${duplicados.join(", ")}` };
    }

    try {
        // 3. IMEIs existen en tabla equipo
        const equipos = await prisma.equipo.findMany({
            where: { imei: { in: imeisLimpios } },
            select: { id: true, imei: true, desbloqueadoPorId: true }
        });

        const imeisEncontrados = new Set(equipos.map(e => e.imei));
        const imeisNoEncontrados = imeisLimpios.filter(i => !imeisEncontrados.has(i));
        if (imeisNoEncontrados.length > 0) {
            return {
                success: false,
                error: `Estos IMEIs no existen en el sistema: ${imeisNoEncontrados.join(", ")}`
            };
        }

        // 4. IMEIs ya desbloqueados
        const yaDesbloqueados = equipos.filter(e => e.desbloqueadoPorId != null).map(e => e.imei);
        if (yaDesbloqueados.length > 0) {
            return {
                success: false,
                error: `Estos IMEIs ya fueron desbloqueados: ${yaDesbloqueados.join(", ")}`
            };
        }

        // 5. IMEIs en otra solicitud pendiente
        const solicitudesAbiertas = await prisma.solicitudDesbloqueo.findMany({
            where: { estado: { in: ["Pendiente QC", "Pendiente Admin"] } },
            select: { imeis: true }
        });

        const enProceso = new Set<string>();
        for (const sol of solicitudesAbiertas) {
            const lista = (sol.imeis as any[]) || [];
            for (const item of lista) {
                const v = typeof item === "string" ? item : item?.imei;
                if (v) enProceso.add(v);
            }
        }
        const conflicto = imeisLimpios.filter(i => enProceso.has(i));
        if (conflicto.length > 0) {
            return {
                success: false,
                error: `Estos IMEIs ya están en otra solicitud pendiente: ${conflicto.join(", ")}`
            };
        }

        // 6. Generar código único: DESB-{username}-{fecha}-#
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, name: true } });
        const userTag = (user?.username || user?.name || "user").replace(/[^a-zA-Z0-9]/g, "");
        const dateStr = getSantoDomingoDateStr();
        const baseCode = `DESB-${userTag}-${dateStr}`;

        const lastSol = await prisma.solicitudDesbloqueo.findFirst({
            where: { codigo: { startsWith: baseCode } },
            orderBy: { id: "desc" }
        });

        let suffix = 1;
        if (lastSol) {
            const parts = lastSol.codigo.split("-");
            const lastSuffix = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSuffix)) suffix = lastSuffix + 1;
        }
        const codigo = `${baseCode}-${suffix}`;

        // 7. Guardar IMEIs como Json (lista de {imei, estado})
        const imeisJson = imeisLimpios.map(i => ({ imei: i, estado: "Pendiente", motivo: null as string | null }));

        const solicitud = await prisma.solicitudDesbloqueo.create({
            data: {
                codigo,
                tecnicoId: userId,
                imeis: imeisJson as any,
                estado: "Pendiente QC",
                observacion: observacion || null,
                totalEquipos: imeisLimpios.length,
                equiposAprobados: 0,
                equiposRechazados: 0,
                montoPorEquipo: MONTO_POR_DESBLOQUEO,
                montoTotalPagado: 0
            }
        });

        revalidatePath("/desbloqueos");
        revalidatePath("/qc/desbloqueos");
        revalidatePath("/admin/desbloqueos");

        return {
            success: true,
            solicitudId: solicitud.id,
            codigo: solicitud.codigo,
            message: `Solicitud ${codigo} creada con ${imeisLimpios.length} equipo(s). Pendiente de revisión QC.`
        };
    } catch (error: any) {
        console.error("Error creando solicitud de desbloqueo:", error);
        return { success: false, error: error.message || "Error al crear la solicitud" };
    }
}

/**
 * QC revisa una solicitud: aprueba o rechaza IMEIs individuales.
 * Cambia el estado a "Pendiente Admin" si hay al menos un IMEI aprobado.
 */
export async function qcRevisarSolicitud(
    solicitudId: number,
    decisiones: { imei: string; aprobado: boolean; motivo?: string }[],
    observacionQc?: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "control_calidad" && session.user.role !== "admin") {
        return { success: false, error: "No autorizado" };
    }

    const qcId = Number(session.user.id);

    try {
        const solicitud = await prisma.solicitudDesbloqueo.findUnique({ where: { id: solicitudId } });
        if (!solicitud) return { success: false, error: "Solicitud no encontrada" };
        if (solicitud.estado !== "Pendiente QC") {
            return { success: false, error: "Esta solicitud ya fue revisada por QC" };
        }

        const imeisActuales = (solicitud.imeis as any[]) || [];
        const map = new Map(imeisActuales.map((x: any) => [x.imei, x]));

        let aprobados = 0;
        let rechazados = 0;
        for (const d of decisiones) {
            if (map.has(d.imei)) {
                const item: any = map.get(d.imei);
                item.estado = d.aprobado ? "Aprobado" : "Rechazado";
                item.motivo = d.motivo || null;
                if (d.aprobado) aprobados++;
                else rechazados++;
            }
        }

        const nuevoEstado = aprobados > 0 ? "Pendiente Admin" : "Rechazado";

        await prisma.solicitudDesbloqueo.update({
            where: { id: solicitudId },
            data: {
                imeis: imeisActuales as any,
                qcId,
                fechaQc: new Date(),
                observacionQc: observacionQc || null,
                estado: nuevoEstado,
                equiposAprobados: aprobados,
                equiposRechazados: rechazados
            }
        });

        // Notificar a admins por Telegram
        if (aprobados > 0) {
            try {
                const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
                const msg =
                    `🔓 <b>Solicitud de Desbloqueo para tu aprobación</b>\n\n` +
                    `📋 <b>Código:</b> ${escapeHTML(solicitud.codigo)}\n` +
                    `✅ <b>Aprobados por QC:</b> ${aprobados}\n` +
                    (rechazados > 0 ? `❌ <b>Rechazados por QC:</b> ${rechazados}\n` : "") +
                    `💵 <b>Pago total al aprobar:</b> RD$${(aprobados * MONTO_POR_DESBLOQUEO * 2).toFixed(2)} (técnico + QC)\n\n` +
                    `👉 <a href="https://sdigitalsystem.vercel.app/admin/desbloqueos">Revisar y aceptar</a>`;
                await sendTelegramMessage(msg, undefined, adminChatId);
            } catch (tgErr) {
                console.warn("[Telegram] Error notificando admin desbloqueo:", tgErr);
            }
        }

        revalidatePath("/qc/desbloqueos");
        revalidatePath("/admin/desbloqueos");

        return {
            success: true,
            message: `Revisión QC guardada. ${aprobados} aprobado(s), ${rechazados} rechazado(s). Estado: ${nuevoEstado}.`
        };
    } catch (error: any) {
        console.error("Error revisando solicitud QC:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin (Micael) acepta o rechaza final.
 * Al aceptar, dispara los pagos a wallet del técnico y del QC que revisó.
 */
export async function adminAceptarSolicitud(
    solicitudId: number,
    accion: "aceptar" | "rechazar",
    observacionAdmin?: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "admin") {
        return { success: false, error: "Solo el administrador puede aceptar solicitudes finales" };
    }

    const adminId = Number(session.user.id);

    try {
        const solicitud = await prisma.solicitudDesbloqueo.findUnique({
            where: { id: solicitudId },
            include: { tecnico: true, qc: true }
        });
        if (!solicitud) return { success: false, error: "Solicitud no encontrada" };
        if (solicitud.estado !== "Pendiente Admin") {
            return { success: false, error: "Esta solicitud no está pendiente de aprobación admin" };
        }

        if (accion === "rechazar") {
            await prisma.solicitudDesbloqueo.update({
                where: { id: solicitudId },
                data: {
                    estado: "Rechazado",
                    adminId,
                    fechaAdmin: new Date(),
                    observacionAdmin: observacionAdmin || "Rechazado por administrador"
                }
            });

            // Notificar técnico y QC
            await prisma.notification.createMany({
                data: [
                    {
                        tecnicoId: solicitud.tecnicoId,
                        tipo: "desbloqueo_rechazado",
                        titulo: "Solicitud de Desbloqueo Rechazada",
                        mensaje: `Tu solicitud ${solicitud.codigo} fue rechazada por el administrador.`,
                        leida: false,
                        fecha: new Date(),
                        fromUserId: adminId,
                        redirectUrl: "/desbloqueos"
                    },
                    ...(solicitud.qcId
                        ? [{
                            tecnicoId: solicitud.qcId,
                            tipo: "desbloqueo_rechazado",
                            titulo: "Solicitud de Desbloqueo Rechazada",
                            mensaje: `La solicitud ${solicitud.codigo} que revisaste fue rechazada.`,
                            leida: false,
                            fecha: new Date(),
                            fromUserId: adminId,
                            redirectUrl: "/qc/desbloqueos"
                        }]
                        : [])
                ]
            });

            revalidatePath("/admin/desbloqueos");
            revalidatePath("/desbloqueos");
            return { success: true, message: "Solicitud rechazada." };
        }

        // ============ ACEPTAR: acreditar pagos a wallet ============
        const imeisActuales = (solicitud.imeis as any[]) || [];
        const imeisAprobados = imeisActuales.filter((x: any) => x.estado === "Aprobado");
        const cantidadAprobados = imeisAprobados.length;

        if (cantidadAprobados === 0) {
            return { success: false, error: "No hay IMEIs aprobados para pagar" };
        }

        const montoPorUnidad = MONTO_POR_DESBLOQUEO;
        const montoTotal = cantidadAprobados * montoPorUnidad;

        const qcId = solicitud.qcId;

        await prisma.$transaction(async (tx) => {
            // Acreditar al TÉCNICO que desbloqueó
            await acreditarWallet(
                tx,
                solicitud.tecnicoId,
                montoTotal,
                `Desbloqueo ${solicitud.codigo} - ${cantidadAprobados} equipo(s)`
            );

            // Acreditar al QC que revisó (si existe)
            if (qcId && qcId !== solicitud.tecnicoId) {
                await acreditarWallet(
                    tx,
                    qcId,
                    montoTotal,
                    `QC revisión desbloqueo ${solicitud.codigo} - ${cantidadAprobados} equipo(s)`
                );
            }

            // Marcar cada equipo como desbloqueado por el técnico
            const imeisStr = imeisAprobados.map((x: any) => x.imei);
            await tx.equipo.updateMany({
                where: { imei: { in: imeisStr } },
                data: {
                    desbloqueadoPorId: solicitud.tecnicoId,
                    fechaDesbloqueo: new Date()
                }
            });

            // Cerrar la solicitud
            await tx.solicitudDesbloqueo.update({
                where: { id: solicitudId },
                data: {
                    estado: "Aprobado",
                    adminId,
                    fechaAdmin: new Date(),
                    observacionAdmin: observacionAdmin || null,
                    montoTotalPagado: qcId && qcId !== solicitud.tecnicoId ? montoTotal * 2 : montoTotal
                }
            });
        });

        // Notificar a ambos
        await prisma.notification.createMany({
            data: [
                {
                    tecnicoId: solicitud.tecnicoId,
                    tipo: "desbloqueo_aprobado",
                    titulo: "¡Desbloqueo Aprobado!",
                    mensaje: `Tu solicitud ${solicitud.codigo} fue aprobada. +RD$${montoTotal.toFixed(2)} a tu wallet.`,
                    monto: montoTotal,
                    leida: false,
                    fecha: new Date(),
                    fromUserId: adminId,
                    redirectUrl: "/desbloqueos"
                },
                ...(qcId && qcId !== solicitud.tecnicoId
                    ? [{
                        tecnicoId: qcId,
                        tipo: "desbloqueo_aprobado",
                        titulo: "¡QC Desbloqueo Aprobado!",
                        mensaje: `La solicitud ${solicitud.codigo} que revisaste fue aprobada. +RD$${montoTotal.toFixed(2)} a tu wallet.`,
                        monto: montoTotal,
                        leida: false,
                        fecha: new Date(),
                        fromUserId: adminId,
                        redirectUrl: "/qc/desbloqueos"
                    }]
                    : [])
            ]
        });

        revalidatePath("/admin/desbloqueos");
        revalidatePath("/desbloqueos");
        revalidatePath("/qc/desbloqueos");
        revalidatePath("/wallet");

        return {
            success: true,
            message: `Aprobado. Pagados RD$${montoTotal.toFixed(2)} al técnico${qcId && qcId !== solicitud.tecnicoId ? " y al QC" : ""}.`
        };
    } catch (error: any) {
        console.error("Error aceptando solicitud admin:", error);
        return { success: false, error: error.message || "Error al aceptar" };
    }
}

/**
 * Acredita monto a la cuenta "Principal" del wallet del usuario.
 * Helper interno, recibe un cliente de transacción de Prisma.
 */
async function acreditarWallet(
    tx: any,
    userId: number,
    monto: number,
    descripcion: string
) {
    let wallet = await tx.wallet.findFirst({
        where: { tecnicoId: userId },
        include: { accounts: true }
    });

    if (!wallet) {
        wallet = await tx.wallet.create({
            data: { tecnicoId: userId, saldo: 0 },
            include: { accounts: true }
        });
    }

    let principalAcc = wallet.accounts.find((acc: any) => acc.nombre === "Principal");
    if (!principalAcc) {
        principalAcc = await tx.walletAccount.create({
            data: {
                walletId: wallet.id,
                nombre: "Principal",
                tipo: "corriente",
                saldo: 0,
                color: "blue",
                fechaCreacion: new Date()
            }
        });
    }

    await tx.walletTransaction.create({
        data: {
            tecnicoId: userId,
            monto,
            tipo: "ingreso",
            estado: "Completado",
            canjeado: true,
            fecha: new Date(),
            descripcion,
            secureToken: crypto.randomBytes(32).toString("hex")
        }
    });

    await tx.walletAccount.update({
        where: { id: principalAcc.id },
        data: { saldo: { increment: monto } }
    });

    await tx.wallet.update({
        where: { id: wallet.id },
        data: { saldo: { increment: monto } }
    });
}

/**
 * Lista solicitudes con filtro de estado y rol del usuario.
 */
export async function getSolicitudesDesbloqueo(estado?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const userId = Number(session.user.id);
    const role = session.user.role;

    try {
        const where: any = {};
        if (estado) where.estado = estado;
        // técnicos ven solo las suyas
        if (role === "tecnico") where.tecnicoId = userId;
        // QC ve las pendientes de revisión y las que ya revisó
        // admin ve todas

        const solicitudes = await prisma.solicitudDesbloqueo.findMany({
            where,
            orderBy: { fechaCreacion: "desc" },
            include: {
                tecnico: { select: { id: true, name: true, username: true, profileImage: true } },
                qc: { select: { id: true, name: true, username: true } },
                admin: { select: { id: true, name: true, username: true } }
            }
        });

        return { success: true, solicitudes };
    } catch (error: any) {
        console.error("Error listando solicitudes:", error);
        return { success: false, error: error.message };
    }
}
