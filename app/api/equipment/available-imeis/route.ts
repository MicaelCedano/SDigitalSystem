import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'admin' && session.user.role !== 'control_calidad')) {
            return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search")?.trim() || "";
        const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

        const filter: any = { estado: "En Inventario" };

        if (search) {
            filter.OR = [
                { imei: { contains: search } },
                { marca: { contains: search } },
                { modelo: { contains: search } },
            ];
        }

        const equipos = await prisma.equipo.findMany({
            where: filter,
            select: {
                id: true,
                imei: true,
                marca: true,
                modelo: true,
                storageGb: true,
                deviceModel: {
                    select: {
                        brand: true,
                        modelName: true,
                        storageGb: true
                    }
                }
            },
            take: limit,
        });

        const imeisData = equipos.map(eq => ({
            imei: eq.imei,
            marca: eq.marca || eq.deviceModel?.brand || '-',
            modelo: eq.modelo || eq.deviceModel?.modelName || '-',
            storage: eq.storageGb || eq.deviceModel?.storageGb ? `${eq.storageGb || eq.deviceModel?.storageGb}GB` : '-',
        }));

        return NextResponse.json({
            imeis: imeisData,
            total: imeisData.length,
            has_more: imeisData.length === limit,
        });

    } catch (error) {
        console.error("Error fetching available IMEIs:", error);
        return NextResponse.json({ success: false, error: "Error interno del servidor." }, { status: 500 });
    }
}
