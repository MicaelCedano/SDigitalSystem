import { getAdminPaymentsDashboardData } from "@/app/actions/admin-payments";
import { PaymentsDashboardClient } from "@/components/admin/PaymentsDashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Gestión de Pagos - RMA Señal Digital",
};

export default async function AdminPagosPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/login");
    }

    const dashboardData = await getAdminPaymentsDashboardData();

    if (!dashboardData) {
        return (
            <div className="p-10 text-center">
                <p className="text-rose-500 font-bold">Error al cargar el panel de pagos. Por favor intenta de nuevo.</p>
            </div>
        );
    }

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <PaymentsDashboardClient data={dashboardData} />
        </div>
    );
}
