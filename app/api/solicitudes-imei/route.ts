import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST - QC crea una solicitud de IMEIs
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'control_calidad') {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const { imeis, observacion } = await req.json();

        if (!imeis || !Array.isArray(imeis) || imeis.length === 0) {
            return NextResponse.json({ success: false, error: "No se enviaron IMEIs válidos." }, { status: 400 });
        }

        // Validar que todos los IMEIs existen y están en inventario
        const equipos = await prisma.equipo.findMany({
            where: { imei: { in: imeis }, estado: "En Inventario" },
            select: { imei: true }
        });

        const imeisValidos = equipos.map(e => e.imei);
        const imeisInvalidos = imeis.filter((i: string) => !imeisValidos.includes(i));

        if (imeisValidos.length === 0) {
            return NextResponse.json({ success: false, error: "Ningún IMEI está disponible en inventario." }, { status: 400 });
        }

        const solicitud = await prisma.solicitudImei.create({
            data: {
                qcId: Number(session.user.id),
                imeis: imeisValidos,
                observacion: observacion || null,
                estado: "Pendiente",
            }
        });

        // Notificar a admins
        const admins = await prisma.user.findMany({ where: { role: "admin", isActive: true }, select: { id: true } });
        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map(a => ({
                    tecnicoId: a.id,
                    tipo: "solicitud_imei",
                    titulo: "Nueva Solicitud de IMEIs",
                    mensaje: `${session.user.name || session.user.username} solicitó ${imeisValidos.length} equipo(s) para revisar.`,
                    leida: false,
                    fecha: new Date(),
                    fromUserId: Number(session.user.id),
                    redirectUrl: "/"
                }))
            });
        }

        return NextResponse.json({
            success: true,
            solicitudId: solicitud.id,
            imeisAceptados: imeisValidos.length,
            imeisRechazados: imeisInvalidos,
            message: `Solicitud creada con ${imeisValidos.length} equipo(s). Esperando aprobación del admin.`
        });

    } catch (error) {
        console.error("Error creando solicitud de IMEIs:", error);
        return NextResponse.json({ success: false, error: "Error en el servidor." }, { status: 500 });
    }
}

// GET - Admin obtiene solicitudes pendientes
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const estado = searchParams.get("estado") || "Pendiente";

        const solicitudes = await prisma.solicitudImei.findMany({
            where: { estado },
            include: {
                qc: {
                    select: { id: true, name: true, username: true, profileImage: true }
                }
            },
            orderBy: { fechaCreacion: "desc" }
        });

        return NextResponse.json({ success: true, solicitudes });
    } catch (error) {
        console.error("Error obteniendo solicitudes:", error);
        return NextResponse.json({ success: false, error: "Error en el servidor." }, { status: 500 });
    }
}
