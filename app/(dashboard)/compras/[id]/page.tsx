import { getPurchaseById } from "@/app/actions/purchase";
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

    const purchase = await getPurchaseById(id);
    if (!purchase) return notFound();

    return (
        <PurchaseDashboardDetail purchase={purchase} />
    );
}
