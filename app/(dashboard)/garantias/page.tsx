import { getGarantias, getGarantiasStats, getTecnicosGarantias, getTrabajosPendientesAprobacion } from "@/app/actions/garantias";
import { GarantiasDashboardClient } from "@/components/garantias/GarantiasDashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Sistema de Garantías - RMA Señal Digital",
};

export default async function GarantiasPage({ searchParams }: { searchParams: { estado?: string; tecnico_id?: string } }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const isTecnico = session.user.role === 'tecnico_garantias';
    const isAdmin = session.user.role === 'admin';
    const stats = await getGarantiasStats(isTecnico ? Number(session.user.id) : undefined);
    const tecnicos = await getTecnicosGarantias();
    const filters = {
        estado: searchParams.estado,
        tecnicoId: searchParams.tecnico_id ? Number(searchParams.tecnico_id) : undefined
    };
    const [garantias, trabajosPendientes] = await Promise.all([
        getGarantias(filters),
        isAdmin ? getTrabajosPendientesAprobacion() : Promise.resolve([])
    ]);

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <GarantiasDashboardClient
                initialGarantias={garantias}
                stats={stats}
                tecnicos={tecnicos}
                currentUser={session.user}
                trabajosPendientes={trabajosPendientes}
            />
        </div>
    );
}
