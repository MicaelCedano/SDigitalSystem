import { getTecnicosPaymentsInfo } from "@/app/actions/garantias";
import { PagosTecnicosClient } from "@/components/garantias/PagosTecnicosClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Gestión de Pagos - RMA Señal Digital",
};

export default async function PagosTecnicosPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/garantias");
    }

    const tecnicosInfo = await getTecnicosPaymentsInfo();

    return (
        <div className="pt-4 max-w-7xl mx-auto w-full">
            <PagosTecnicosClient tecnicos={tecnicosInfo} />
        </div>
    );
}
