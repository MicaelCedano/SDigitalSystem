import { getWalletData } from "@/app/actions/wallet";
import { WalletClient } from "@/components/qc/WalletClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Mi Billetera - RMA Señal Digital",
};

export default async function WalletPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "admin" && session.user.role !== "control_calidad" && session.user.role !== "tecnico_garantias")) {
        redirect("/login");
    }

    const walletData = await getWalletData();

    if (!walletData) {
        return <div className="p-8 text-center text-red-500">Error al cargar datos de la billetera.</div>;
    }

    return (
        <div className="pt-4 max-w-[1200px] mx-auto w-full">
            <WalletClient
                initialData={walletData}
                currentUser={session.user}
            />
        </div>
    );
}
