import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'control_calidad') {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const solicitudes = await prisma.solicitudImei.findMany({
            where: { qcId: Number(session.user.id) },
            orderBy: { fechaCreacion: "desc" },
            take: 20
        });

        return NextResponse.json({ success: true, solicitudes });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: "Error en el servidor." }, { status: 500 });
    }
}
