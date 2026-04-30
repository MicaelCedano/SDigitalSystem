import { getPurchaseById } from "@/app/actions/purchase";
import { notFound } from "next/navigation";
import { PurchaseNoFuncionalesClient } from "@/components/purchases/PurchaseNoFuncionalesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "No Funcionales | RMA System",
};

export const dynamic = "force-dynamic";

export default async function PurchaseNoFuncionalesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) return notFound();

    const purchase = await getPurchaseById(id);
    if (!purchase) return notFound();

    return <PurchaseNoFuncionalesClient purchase={purchase as any} />;
}
