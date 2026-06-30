import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HistorialDesbloqueosClient } from "@/components/desbloqueos/HistorialDesbloqueosClient";

export const metadata = {
    title: "Admin - Historial de Desbloqueos por IMEI",
};

export default async function HistorialDesbloqueosPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    if (session.user.role !== "admin") redirect("/");

    return (
        <div className="pt-4 max-w-[1100px] mx-auto w-full">
            <HistorialDesbloqueosClient />
        </div>
    );
}
