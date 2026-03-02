import { getPurchaseById } from "@/app/actions/purchase";
import { notFound } from "next/navigation";
import { MatchImeisClient } from "@/components/purchases/MatchImeisClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Verificar IMEIs Físicos | RMA System",
};

export default async function MatchImeisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idString } = await params;
    const id = parseInt(idString);
    if (isNaN(id)) return notFound();

    const purchase = await getPurchaseById(id);
    if (!purchase) return notFound();

    return (
        <MatchImeisClient purchase={purchase as any} />
    );
}
