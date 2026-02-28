import { getQCDashboardData } from "@/app/actions/qc";
import { RankingClient } from "@/components/qc/RankingClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Ranking de Control de Calidad - RMA Señal Digital",
};

export default async function RankingPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "admin" && session.user.role !== "control_calidad")) {
        redirect("/login");
    }

    const dashboardData = await getQCDashboardData();

    if (!dashboardData) {
        return <div className="p-8 text-center text-red-500">Error al cargar datos de ranking.</div>;
    }

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <RankingClient
                topDia={dashboardData.topDia}
                topMes={dashboardData.topMes}
                topGlobal={dashboardData.topGlobal}
                currentUser={session.user}
            />
        </div>
    );
}
