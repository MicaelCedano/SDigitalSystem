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

    // Trae solo activos por default; el client puede pedir incluir inactivos con el toggle
    const tecnicosInfo = await getTecnicosPaymentsInfo(false);

    return (
        <div className="pt-4 max-w-7xl mx-auto w-full">
            <PagosTecnicosClient tecnicos={tecnicosInfo} />
        </div>
    );
}
