import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CrearSolicitudClient } from "@/components/desbloqueos/CrearSolicitudClient";

export const metadata = {
    title: "Nueva Solicitud de Desbloqueo - RMA SDigital",
};

export default async function NuevoDesbloqueoPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role;
    const rolesPermitidos = ["tecnico", "tecnico_garantias", "control_calidad", "admin"];
    if (!rolesPermitidos.includes(role)) {
        redirect("/");
    }

    return (
        <div className="pt-4 max-w-[900px] mx-auto w-full">
            <CrearSolicitudClient
                currentUser={{
                    id: Number(session.user.id),
                    name: session.user.name || session.user.username,
                    role
                }}
            />
        </div>
    );
}
