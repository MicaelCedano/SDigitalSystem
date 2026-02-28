import { getGarantiaById, getEquipoHistorialByImei, getTecnicosGarantias, getSuppliers } from "@/app/actions/garantias";
import { GarantiaDetailClient } from "@/components/garantias/GarantiaDetailClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export const metadata = {
    title: "Detalle de Garantía - RMA Señal Digital",
};

export default async function GarantiaDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const id = parseInt(params.id);
    if (isNaN(id)) notFound();

    const [garantia, tecnicos, suppliers] = await Promise.all([
        getGarantiaById(id),
        getTecnicosGarantias(),
        getSuppliers()
    ]);

    if (!garantia) notFound();

    const equipoHistorial = await getEquipoHistorialByImei(garantia.imeiSn);

    return (
        <div className="pt-4 max-w-6xl mx-auto w-full">
            <GarantiaDetailClient
                garantia={garantia}
                equipoHistorial={equipoHistorial}
                tecnicos={tecnicos}
                suppliers={suppliers}
                currentUser={session.user}
            />
        </div>
    );
}
