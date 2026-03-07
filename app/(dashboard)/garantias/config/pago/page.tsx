import { getTecnicosGarantias, getConfiguracionesPago } from "@/app/actions/garantias";
import { ListadoTarifasClient } from "@/components/garantias/ListadoTarifasClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Gestión de Tarifas - RMA Señal Digital",
};

export default async function ListadoTarifasPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/garantias");
    }

    const tecnicos = await getTecnicosGarantias();
    const configs = await getConfiguracionesPago();

    return (
        <div className="pt-4 max-w-5xl mx-auto w-full">
            <ListadoTarifasClient 
                tecnicos={tecnicos} 
                configs={configs}
            />
        </div>
    );
}
