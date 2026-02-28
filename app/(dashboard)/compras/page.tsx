import { Suspense } from "react";
import { getPurchases, getDraftPurchases } from "@/app/actions/purchase";
import { PurchaseDashboardUI } from "@/components/purchases/PurchaseDashboardUI";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Compras | RMA System",
    description: "Gestión de compras y proveedores",
};

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
    const { active, history } = await getPurchases();
    const drafts = await getDraftPurchases();

    return (
        <div className="space-y-6">
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />}>
                <PurchaseDashboardUI
                    activePurchases={active}
                    historyPurchases={history}
                    draftCount={drafts.length}
                />
            </Suspense>
        </div>
    );
}
