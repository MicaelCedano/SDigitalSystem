import prisma from "@/lib/prisma";
import { getSantoDomingoDateStr, getSantoDomingoDayRange } from "@/lib/utils";

/**
 * Lógica de negocio para aprobar / rechazar una SolicitudImei.
 *
 * Se usa desde:
 *  - `app/api/solicitudes-imei/[id]/route.ts` (PATCH HTTP, ya validado)
 *  - `app/api/telegram-webhook/route.ts` (callback del bot, gate de admin
 *    aplicado ANTES de llamar aquí)
 *
 * NO valida el rol del usuario ni quién llama: eso es responsabilidad
 * del caller. Esta función es el "núcleo" transaccional.
 */

export interface AprobarSolicitudResult {
    success: boolean;
    message: string;
    codigoLote?: string;
    error?: string;
}

export interface RechazarSolicitudResult {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Aprueba una solicitud de IMEIs: marca como Aprobado, crea el lote
 * automático con los equipos que sigan en inventario, registra historial
 * y notifica al QC.
 */
export async function aprobarSolicitudImei(
    solicitudId: number,
    adminId: number,
    observacion?: string | null
): Promise<AprobarSolicitudResult> {
    const solicitud = await prisma.solicitudImei.findUnique({ where: { id: solicitudId } });
    if (!solicitud) {
        return { success: false, message: "Solicitud no encontrada", error: "Solicitud no encontrada" };
    }
    if (solicitud.estado !== "Pendiente") {
        return {
            success: false,
            message: "Esta solicitud ya fue procesada",
            error: `Estado actual: ${solicitud.estado}`
        };
    }

    const imeis = solicitud.imeis as string[];
    const qcUser = await prisma.user.findUnique({ where: { id: solicitud.qcId } });
    if (!qcUser) {
        return { success: false, message: "Usuario QC no encontrado", error: "QC no encontrado" };
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    const adminName = adminUser?.name || adminUser?.username || "Admin";

    // Filtrar solo los que siguen en inventario
    const equipos = await prisma.equipo.findMany({
        where: { imei: { in: imeis }, estado: "En Inventario" }
    });

    if (equipos.length === 0) {
        return {
            success: false,
            message: "Ningún equipo de la solicitud está disponible en inventario",
            error: "Sin equipos disponibles"
        };
    }

    const equipoIds = equipos.map(e => e.id);
    const qcName = qcUser.name || qcUser.username;
    const dateStr = getSantoDomingoDateStr();
    const baseCode = `LOTE-${qcName}-${dateStr}`;

    const { start: todayStart, end: todayEnd } = getSantoDomingoDayRange();

    const lastLote = await prisma.lote.findFirst({
        where: {
            tecnicoId: qcUser.id,
            fecha: { gte: todayStart, lte: todayEnd },
            codigo: { startsWith: baseCode }
        },
        orderBy: { id: "desc" }
    });

    let suffix = 1;
    if (lastLote) {
        const parts = lastLote.codigo.split("-");
        const lastSuffix = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSuffix)) suffix = lastSuffix + 1;
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
                equipoId: id,
                userId: adminId,
                estado: "En Revisión",
                fecha: new Date(),
                observacion: `Solicitud aprobada por ${adminName}. Lote: ${codigoLote}`
            }))
        });

        await tx.solicitudImei.update({
            where: { id: solicitudId },
            data: {
                estado: "Aprobado",
                adminId,
                observacion: observacion || null,
                fechaResolucion: new Date()
            }
        });

        await tx.notification.create({
            data: {
                tecnicoId: qcUser.id,
                tipo: "solicitud_imei_aprobada",
                titulo: "¡Solicitud Aprobada!",
                mensaje: `Tu solicitud fue aprobada. Se creó el lote ${codigoLote} con ${equipos.length} equipo(s).`,
                loteCodigo: codigoLote,
                leida: false,
                fecha: new Date(),
                fromUserId: adminId,
                redirectUrl: "/qc"
            }
        });
    });

    return {
        success: true,
        message: `Aprobado. Lote ${codigoLote} creado con ${equipos.length} equipo(s).`,
        codigoLote
    };
}

/**
 * Rechaza una solicitud de IMEIs y notifica al QC.
 */
export async function rechazarSolicitudImei(
    solicitudId: number,
    adminId: number,
    observacion?: string | null
): Promise<RechazarSolicitudResult> {
    const solicitud = await prisma.solicitudImei.findUnique({ where: { id: solicitudId } });
    if (!solicitud) {
        return { success: false, message: "Solicitud no encontrada", error: "Solicitud no encontrada" };
    }
    if (solicitud.estado !== "Pendiente") {
        return {
            success: false,
            message: "Esta solicitud ya fue procesada",
            error: `Estado actual: ${solicitud.estado}`
        };
    }

    await prisma.solicitudImei.update({
        where: { id: solicitudId },
        data: {
            estado: "Rechazado",
            adminId,
            observacion: observacion || null,
            fechaResolucion: new Date()
        }
    });

    await prisma.notification.create({
        data: {
            tecnicoId: solicitud.qcId,
            tipo: "solicitud_imei_rechazada",
            titulo: "Solicitud de IMEIs Rechazada",
            mensaje: observacion || "Tu solicitud de IMEIs fue rechazada por el administrador.",
            leida: false,
            fecha: new Date(),
            fromUserId: adminId,
            redirectUrl: "/qc"
        }
    });

    return { success: true, message: "Solicitud rechazada" };
}
