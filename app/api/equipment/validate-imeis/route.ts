import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || (role !== "admin" && role !== "control_calidad")) {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const { imeis } = await req.json();

        if (!imeis || !Array.isArray(imeis) || imeis.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // Fetch all equipments matching these IMEIs in one query
        const equipments = await prisma.equipo.findMany({
            where: { imei: { in: imeis } },
            select: {
                id: true,
                imei: true,
                estado: true,
                marca: true,
                modelo: true,
                deviceModel: {
                    select: { brand: true, modelName: true }
                }
            }
        });

        const results = imeis.map(imei => {
            const equipo = equipments.find(e => e.imei === imei);

            if (!equipo) {
                return { imei, status: "not_found" };
            }

            if (equipo.estado !== "En Inventario") {
                return {
                    imei,
                    status: "not_available",
                    label: `Estado: ${equipo.estado}`
                };
            }

            const brand = equipo.deviceModel?.brand || equipo.marca || "";
            const model = equipo.deviceModel?.modelName || equipo.modelo || "";
            const label = [brand, model].filter(Boolean).join(" ") || "Equipo encontrado";

            return {
                imei,
                status: "ok",
                equipoId: equipo.id,
                label
            };
        });

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("Error validating IMEIs:", error);
        return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
    }
}
