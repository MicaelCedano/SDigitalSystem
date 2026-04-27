import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH - Admin aprueba o rechaza una solicitud
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const solicitudId = Number(params.id);
        const { accion, observacion } = await req.json(); // accion: "aprobar" | "rechazar"

        if (!["aprobar", "rechazar"].includes(accion)) {
            return NextResponse.json({ success: false, error: "Acción inválida." }, { status: 400 });
        }

        const solicitud = await prisma.solicitudImei.findUnique({ where: { id: solicitudId } });
        if (!solicitud) {
            return NextResponse.json({ success: false, error: "Solicitud no encontrada." }, { status: 404 });
        }
        if (solicitud.estado !== "Pendiente") {
            return NextResponse.json({ success: false, error: "Esta solicitud ya fue procesada." }, { status: 400 });
        }

        const adminId = Number(session.user.id);

        if (accion === "rechazar") {
            await prisma.solicitudImei.update({
                where: { id: solicitudId },
                data: {
                    estado: "Rechazado",
                    adminId,
                    observacion: observacion || null,
                    fechaResolucion: new Date()
                }
            });

            // Notificar al QC
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

            return NextResponse.json({ success: true, message: "Solicitud rechazada." });
        }

        // APROBAR: correr el mismo flujo de assign-imeis
        const imeis = solicitud.imeis as string[];
        const qcUser = await prisma.user.findUnique({ where: { id: solicitud.qcId } });
        if (!qcUser) {
            return NextResponse.json({ success: false, error: "Usuario QC no encontrado." }, { status: 404 });
        }

        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
        const adminName = adminUser?.name || adminUser?.username || "Admin";

        // Filtrar solo los que siguen en inventario (por si cambiaron de estado)
        const equipos = await prisma.equipo.findMany({
            where: { imei: { in: imeis }, estado: "En Inventario" }
        });

        if (equipos.length === 0) {
            return NextResponse.json({ success: false, error: "Ningún equipo de la solicitud está disponible en inventario." }, { status: 400 });
        }

        const equipoIds = equipos.map(e => e.id);
        const qcName = qcUser.name || qcUser.username;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const baseCode = `LOTE-${qcName}-${dateStr}`;

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        const lastLote = await prisma.lote.findFirst({
            where: { tecnicoId: qcUser.id, fecha: { gte: todayStart, lte: todayEnd }, codigo: { startsWith: baseCode } },
            orderBy: { id: 'desc' }
        });

        let suffix = 1;
        if (lastLote) {
            const parts = lastLote.codigo.split('-');
            const lastSuffix = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSuffix)) suffix = lastSuffix + 1;
        }

        const codigoLote = `${baseCode}-${suffix}`;

        await prisma.$transaction(async (tx) => {
            const lote = await tx.lote.create({
                data: { codigo: codigoLote, fecha: new Date(), tecnicoId: qcUser.id, estado: 'Abierto' }
            });

            await tx.equipo.updateMany({
                where: { id: { in: equipoIds } },
                data: { userId: qcUser.id, loteId: lote.id, estado: 'En Revisión' }
            });

            await tx.equipoHistorial.createMany({
                data: equipoIds.map(id => ({
                    equipoId: id,
                    userId: adminId,
                    estado: 'En Revisión',
                    fecha: new Date(),
                    observacion: `Solicitud aprobada por ${adminName}. Lote: ${codigoLote}`
                }))
            });

            await tx.solicitudImei.update({
                where: { id: solicitudId },
                data: { estado: "Aprobado", adminId, observacion: observacion || null, fechaResolucion: new Date() }
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

        return NextResponse.json({
            success: true,
            message: `Aprobado. Lote ${codigoLote} creado con ${equipos.length} equipo(s).`,
            codigoLote
        });

    } catch (error) {
        console.error("Error procesando solicitud de IMEIs:", error);
        return NextResponse.json({ success: false, error: "Error en el servidor." }, { status: 500 });
    }
}
