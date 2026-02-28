import { getGarantias, getGarantiasStats, getTecnicosGarantias } from "@/app/actions/garantias";
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

    const stats = await getGarantiasStats();
    const tecnicos = await getTecnicosGarantias();
    const filters = {
        estado: searchParams.estado,
        tecnicoId: searchParams.tecnico_id ? Number(searchParams.tecnico_id) : undefined
    };
    const garantias = await getGarantias(filters);

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <GarantiasDashboardClient
                initialGarantias={garantias}
                stats={stats}
                tecnicos={tecnicos}
                currentUser={session.user}
            />
        </div>
    );
}
