import { getPurchaseById } from "@/app/actions/purchase";
import { getDeviceModels } from "@/app/actions/device-models";
import { notFound } from "next/navigation";
import { PurchaseDashboardDetail } from "@/components/purchases/PurchaseDashboardDetail";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Detalle de Compra | RMA System",
    description: "Detalles de la compra y equipos asociados",
};

interface PurchaseDetailPageProps {
    params: {
        id: string;
    }
}

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) return notFound();

    const [purchase, deviceModels] = await Promise.all([
        getPurchaseById(id),
        getDeviceModels()
    ]);
    if (!purchase) return notFound();

    return (
        <PurchaseDashboardDetail purchase={purchase} deviceModels={deviceModels} />
    );
}
