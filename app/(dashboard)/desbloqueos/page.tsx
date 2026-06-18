import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MisSolicitudesClient } from "@/components/desbloqueos/MisSolicitudesClient";
import prisma from "@/lib/prisma";

export const metadata = {
    title: "Mis Solicitudes de Desbloqueo - RMA SDigital",
};

export default async function MisDesbloqueosPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const userId = Number(session.user.id);
    const role = session.user.role;
    const rolesPermitidos = ["tecnico", "tecnico_garantias", "control_calidad", "admin"];
    if (!rolesPermitidos.includes(role)) redirect("/");

    const solicitudes = await prisma.solicitudDesbloqueo.findMany({
        where: { tecnicoId: userId },
        orderBy: { fechaCreacion: "desc" },
        include: {
            qc: { select: { name: true, username: true } },
            admin: { select: { name: true, username: true } }
        }
    });

    return (
        <div className="pt-4 max-w-[1100px] mx-auto w-full">
            <MisSolicitudesClient
                initialSolicitudes={solicitudes.map(s => ({
                    id: s.id,
                    codigo: s.codigo,
                    estado: s.estado,
                    totalEquipos: s.totalEquipos,
                    equiposAprobados: s.equiposAprobados,
                    equiposRechazados: s.equiposRechazados,
                    montoPorEquipo: s.montoPorEquipo,
                    montoTotalPagado: s.montoTotalPagado,
                    fechaCreacion: s.fechaCreacion.toISOString(),
                    fechaQc: s.fechaQc?.toISOString() || null,
                    fechaAdmin: s.fechaAdmin?.toISOString() || null,
                    qcName: s.qc?.name || s.qc?.username || null,
                    adminName: s.admin?.name || s.admin?.username || null
                }))}
                currentUser={{ id: userId, name: session.user.name || session.user.username, role }}
            />
        </div>
    );
}
