import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'admin' && session.user.role !== 'control_calidad')) {
            return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { imeis, qcId } = body;

        if (!imeis || !Array.isArray(imeis) || imeis.length === 0) {
            return NextResponse.json({ success: false, error: "No se enviaron IMEIs válidos." }, { status: 400 });
        }

        if (!qcId) {
            return NextResponse.json({ success: false, error: "Usuario Control de Calidad inválido." }, { status: 400 });
        }

        const adminId = Number(session.user.id);
        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
        const adminName = adminUser?.name || adminUser?.username || "Admin";

        const qcUser = await prisma.user.findUnique({ where: { id: qcId } });
        if (!qcUser || qcUser.role !== 'control_calidad') {
            return NextResponse.json({ success: false, error: "Control de Calidad no encontrado o inválido." }, { status: 404 });
        }

        // Buscar equipos
        const equipos = await prisma.equipo.findMany({
            where: {
                imei: { in: imeis },
                estado: "En Inventario"
            }
        });

        if (equipos.length === 0) {
            return NextResponse.json({ success: false, error: "Ningún IMEI se encontró 'En Inventario'." }, { status: 404 });
        }

        // Crear código de Lote
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const qcName = qcUser.name || qcUser.username;
        const baseCode = `LOTE-${qcName}-${dateStr}`;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const lastLote = await prisma.lote.findFirst({
            where: {
                tecnicoId: qcUser.id,
                fecha: { gte: todayStart, lte: todayEnd },
                codigo: { startsWith: baseCode }
            },
            orderBy: { id: 'desc' }
        });

        let suffix = 1;
        if (lastLote) {
            const parts = lastLote.codigo.split('-');
            const lastSuffix = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSuffix)) suffix = lastSuffix + 1;
        }

        const codigoLote = `${baseCode}-${suffix}`;
        const equipoIds = equipos.map(e => e.id);

        await prisma.$transaction(async (tx) => {
            const lote = await tx.lote.create({
                data: {
                    codigo: codigoLote,
                    fecha: new Date(),
                    tecnicoId: qcUser.id,
                    estado: 'Abierto'
                }
            });

            await tx.equipo.updateMany({
                where: { id: { in: equipoIds } },
                data: {
                    userId: qcUser.id,
                    loteId: lote.id,
                    estado: 'En Revisión'
                }
            });

            const historiales = equipoIds.map(id => ({
                equipoId: id,
                userId: adminId,
                estado: 'En Revisión',
                fecha: new Date(),
                observacion: `Asignado a Control de Calidad: ${qcName} - Lote: ${codigoLote} (Por IMEI)`
            }));

            await tx.equipoHistorial.createMany({
                data: historiales
            });

            await tx.notification.create({
                data: {
                    tecnicoId: qcUser.id,
                    tipo: 'lote_asignado',
                    titulo: 'Nuevo Lote Asignado',
                    mensaje: `Se te ha asignado el lote ${codigoLote} con ${equipoIds.length} equipos por IMEI.`,
                    loteCodigo: codigoLote,
                    leida: false,
                    fecha: new Date()
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: `¡Asignación exitosa! ${equipoIds.length} equipo(s) al lote ${codigoLote}.`
        });

    } catch (error) {
        console.error("Error validando IMEIs API:", error);
        return NextResponse.json({ success: false, error: "Error en el servidor al intentar asignar IMEIs." }, { status: 500 });
    }
}
