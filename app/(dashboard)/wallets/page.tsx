import { getAdminWalletsData } from "@/app/actions/wallets";
import { AdminWalletsClient } from "@/components/wallets/AdminWalletsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Gestión de Wallets - RMA Señal Digital",
};

export default async function WalletsAdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/login");
    }

    const walletsData = await getAdminWalletsData();

    if (!walletsData) {
        return <div className="p-8 text-center text-red-500">Error al cargar datos de wallets.</div>;
    }

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <AdminWalletsClient
                initialData={walletsData}
            />
        </div>
    );
}
