import { getNoFuncionalesData } from "@/app/actions/equipment";
import { NoFuncionalesClient } from "@/components/purchases/NoFuncionalesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "No Funcionales | RMA System",
};

export const dynamic = "force-dynamic";

export default async function NoFuncionalesPage() {
    const { pendientes, recuperados } = await getNoFuncionalesData();

    return (
        <div className="max-w-4xl mx-auto">
            <NoFuncionalesClient pendientes={pendientes} recuperados={recuperados} />
        </div>
    );
}
