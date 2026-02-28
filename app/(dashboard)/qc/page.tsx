import { getQCDashboardData } from "@/app/actions/qc";
import { QCDashboardClient } from "@/components/qc/QCDashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Control de Calidad - RMA Señal Digital",
};

export default async function QCDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "admin" && session.user.role !== "control_calidad")) {
        redirect("/login");
    }

    const dashboardData = await getQCDashboardData();

    if (!dashboardData) {
        return <div className="p-8 text-center text-red-500">Error al cargar datos del dashboard de calidad.</div>;
    }

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <QCDashboardClient
                initialData={dashboardData}
                currentUser={session.user}
            />
        </div>
    );
}
