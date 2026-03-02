import { getDraftPurchases } from "@/app/actions/purchase";
import { DraftsList } from "@/components/purchases/DraftsList";
import { Metadata } from "next";
import { FileEdit, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Borradores | RMA System",
    description: "Gestión de compras en borrador",
};

export const dynamic = 'force-dynamic';

export default async function DraftsPage() {
    const rawDrafts = await getDraftPurchases();

    const drafts = rawDrafts.map(d => ({
        id: d.id,
        purchaseDate: d.purchaseDate,
        supplier: { name: d.supplier.name },
        _count: { items: d.totalQuantity, equipos: d._count.equipos }
    }));

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Premium Header */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-20 w-20 rounded-[1.5rem] bg-amber-50 flex items-center justify-center text-amber-600 shadow-lg shadow-amber-100/50">
                        <FileEdit className="h-10 w-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-bold text-slate-800 tracking-tighter">Borradores</h1>
                        </div>
                        <p className="text-slate-400 font-bold flex items-center gap-2">
                            Ingresos Pendientes <ChevronRight className="w-4 h-4" /> <span className="text-amber-600">Por confirmar</span>
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex gap-4">
                    <div className="px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">
                            {drafts.length}
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendientes</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-64 h-64 -mb-10 -ml-10 bg-slate-50 rounded-full opacity-50" />
                <div className="relative z-10">
                    <DraftsList drafts={drafts} />
                </div>
            </div>
        </div>
    );
}
