import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QCDesbloqueosClient } from "@/components/desbloqueos/QCDesbloqueosClient";
import prisma from "@/lib/prisma";

export const metadata = {
    title: "QC - Solicitudes de Desbloqueo",
};

export default async function QCDesbloqueosPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    if (session.user.role !== "control_calidad" && session.user.role !== "admin") {
        redirect("/");
    }

    const solicitudes = await prisma.solicitudDesbloqueo.findMany({
        where: { estado: "Pendiente QC" },
        orderBy: { fechaCreacion: "asc" },
        include: {
            tecnico: { select: { id: true, name: true, username: true, profileImage: true } }
        }
    });

    return (
        <div className="pt-4 max-w-[1200px] mx-auto w-full">
            <QCDesbloqueosClient
                initialSolicitudes={solicitudes.map(s => ({
                    id: s.id,
                    codigo: s.codigo,
                    observacion: s.observacion,
                    imeis: s.imeis as any,
                    estado: s.estado,
                    totalEquipos: s.totalEquipos,
                    fechaCreacion: s.fechaCreacion.toISOString(),
                    tecnico: {
                        id: s.tecnico.id,
                        name: s.tecnico.name || s.tecnico.username,
                        username: s.tecnico.username,
                        profileImage: s.tecnico.profileImage
                    }
                }))}
            />
        </div>
    );
}
