
import { getTecnicosGarantias } from "@/app/actions/garantias";
import { BatchGarantiaForm } from "@/components/garantias/BatchGarantiaForm";
import { Metadata } from "next";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Ingreso por Lote | Garantías",
};

export default async function BatchGarantiaPage() {
    const tecnicos = await getTecnicosGarantias();

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000" />

                <div className="flex items-center gap-6 relative z-10">
                    <Link href="/garantias">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                            <ArrowLeft className="h-7 w-7" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Package className="h-6 w-6 text-indigo-600" />
                            <h1 className="text-4xl font-bold text-slate-800 tracking-tighter">Ingreso por Lote</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Registra múltiples garantías de un mismo cliente en un solo paso.</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Modo Masivo</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-96 h-96 -mb-48 -mr-48 bg-slate-50 rounded-full opacity-50" />
                <div className="relative z-10">
                    <BatchGarantiaForm tecnicos={tecnicos} />
                </div>
            </div>
        </div>
    );
}
