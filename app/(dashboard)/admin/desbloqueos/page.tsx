import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDesbloqueosClient } from "@/components/desbloqueos/AdminDesbloqueosClient";
import prisma from "@/lib/prisma";

export const metadata = {
    title: "Admin - Aprobar Desbloqueos",
};

export default async function AdminDesbloqueosPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    if (session.user.role !== "admin") redirect("/");

    const solicitudes = await prisma.solicitudDesbloqueo.findMany({
        where: { estado: "Pendiente Admin" },
        orderBy: { fechaCreacion: "asc" },
        include: {
            tecnico: { select: { id: true, name: true, username: true, profileImage: true } },
            qc: { select: { id: true, name: true, username: true } }
        }
    });

    // Cuantas estan atrapadas en "Pendiente QC" para el empty state contextual
    const pendientesQcCount = await prisma.solicitudDesbloqueo.count({
        where: { estado: "Pendiente QC" }
    });

    const recientes = await prisma.solicitudDesbloqueo.findMany({
        where: { estado: { in: ["Aprobado", "Rechazado"] } },
        orderBy: { fechaAdmin: "desc" },
        take: 10,
        include: {
            tecnico: { select: { id: true, name: true, username: true } },
            admin: { select: { id: true, name: true, username: true } }
        }
    });

    return (
        <div className="pt-4 max-w-[1300px] mx-auto w-full">
            <AdminDesbloqueosClient
                pendientes={solicitudes.map(s => ({
                    id: s.id,
                    codigo: s.codigo,
                    modelo: s.modelo,
                    observacion: s.observacion,
                    observacionQc: s.observacionQc,
                    imeis: s.imeis as any,
                    totalEquipos: s.totalEquipos,
                    equiposAprobados: s.equiposAprobados,
                    equiposRechazados: s.equiposRechazados,
                    montoPorEquipo: s.montoPorEquipo,
                    fechaCreacion: s.fechaCreacion.toISOString(),
                    fechaQc: s.fechaQc?.toISOString() || null,
                    tecnico: {
                        id: s.tecnico.id,
                        name: s.tecnico.name || s.tecnico.username,
                        username: s.tecnico.username,
                        profileImage: s.tecnico.profileImage
                    },
                    qc: s.qc ? { id: s.qc.id, name: s.qc.name || s.qc.username } : null
                }))}
                pendientesQcCount={pendientesQcCount}
                recientes={recientes.map(s => ({
                    id: s.id,
                    codigo: s.codigo,
                    estado: s.estado,
                    equiposAprobados: s.equiposAprobados,
                    montoTotalPagado: s.montoTotalPagado,
                    fechaAdmin: s.fechaAdmin?.toISOString() || null,
                    tecnicoName: s.tecnico.name || s.tecnico.username,
                    adminName: s.admin?.name || s.admin?.username || null
                }))}
            />
        </div>
    );
}
