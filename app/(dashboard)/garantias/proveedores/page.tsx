import { getGarantias, getSuppliers } from "@/app/actions/garantias";
import { GarantiasProveedoresClient } from "@/components/garantias/GarantiasProveedoresClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Garantías Externas (Proveedores) - RMA Señal Digital",
};

export default async function GarantiasProveedoresPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Fetch warranties that are in provider states
    const allGarantias = await getGarantias();
    const probeedorGarantias = allGarantias.filter((g: any) =>
        ['Enviado a Proveedor', 'Recibido de Proveedor', 'Reparado', 'No Reparado', 'Usado para Piezas'].includes(g.estado)
    );

    const suppliers = await getSuppliers();

    return (
        <div className="pt-4 max-w-7xl mx-auto w-full">
            <GarantiasProveedoresClient
                garantias={probeedorGarantias}
                suppliers={suppliers}
                currentUser={session.user}
            />
        </div>
    );
}
