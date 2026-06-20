import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aprobarSolicitudImei, rechazarSolicitudImei } from "@/lib/solicitudes-imei";

// PATCH - Admin aprueba o rechaza una solicitud
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const solicitudId = Number(id);
        const { accion, observacion } = await req.json(); // accion: "aprobar" | "rechazar"

        if (!["aprobar", "rechazar"].includes(accion)) {
            return NextResponse.json({ success: false, error: "Acción inválida." }, { status: 400 });
        }

        const adminId = Number(session.user.id);

        if (accion === "rechazar") {
            const result = await rechazarSolicitudImei(solicitudId, adminId, observacion);
            if (!result.success) {
                const status = result.error === "Solicitud no encontrada" ? 404 : 400;
                return NextResponse.json({ success: false, error: result.message }, { status });
            }
            return NextResponse.json({ success: true, message: result.message });
        }

        // accion === "aprobar"
        const result = await aprobarSolicitudImei(solicitudId, adminId, observacion);
        if (!result.success) {
            const status = result.error === "Solicitud no encontrada" ? 404 : 400;
            return NextResponse.json({ success: false, error: result.message }, { status });
        }
        return NextResponse.json({
            success: true,
            message: result.message,
            codigoLote: result.codigoLote
        });
    } catch (error) {
        console.error("Error procesando solicitud de IMEIs:", error);
        return NextResponse.json({ success: false, error: "Error en el servidor." }, { status: 500 });
    }
}
