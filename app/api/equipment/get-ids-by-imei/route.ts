import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const { imeis } = await req.json();

        if (!imeis || !Array.isArray(imeis)) {
            return NextResponse.json({ success: false, error: "Formato de IMEIs inválido" }, { status: 400 });
        }

        // Find existing equipments with these IMEIs that are "En Inventario"
        const equipments = await prisma.equipo.findMany({
            where: {
                imei: { in: imeis },
                estado: "En Inventario"
            },
            select: {
                id: true,
                imei: true
            }
        });

        const foundImeis = equipments.map(e => e.imei);
        const missingImeis = imeis.filter(imei => !foundImeis.includes(imei));

        if (missingImeis.length > 0) {
            return NextResponse.json({
                success: false,
                error: `Los siguientes IMEIs no existen o no están disponibles: ${missingImeis.join(', ')}`,
                missing: missingImeis
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            ids: equipments.map(e => e.id)
        });

    } catch (error) {
        console.error("Error in get-ids-by-imei:", error);
        return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
    }
}
