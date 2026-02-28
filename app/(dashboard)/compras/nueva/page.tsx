import { getSuppliers } from "@/app/actions/supplier";
import { getDeviceModels } from "@/app/actions/device-models";
import { CreatePurchaseForm } from "@/components/purchases/CreatePurchaseForm";
import { Metadata } from "next";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Nueva Compra | RMA System",
    description: "Registrar nueva compra de equipos",
};

export const dynamic = 'force-dynamic';

export default async function NewPurchasePage() {
    const [suppliers, deviceModels] = await Promise.all([
        getSuppliers(),
        getDeviceModels()
    ]);

    const formattedModels = deviceModels.map(m => ({
        id: m.id,
        brand: m.brand,
        modelName: m.modelName,
        storageGb: m.storageGb,
        color: m.color
    }));

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000" />

                <div className="flex items-center gap-6 relative z-10">
                    <Link href="/compras">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                            <ArrowLeft className="h-7 w-7" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <ShoppingCart className="h-6 w-6 text-indigo-600" />
                            <h1 className="text-4xl font-bold text-slate-800 tracking-tighter">Nueva Compra</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Registra una nueva adquisición y carga los equipos al sistema.</p>
                    </div>
                </div>

                <div className="relative z-10 hidden lg:block">
                    <div className="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Modo Borrador</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-96 h-96 -mb-48 -mr-48 bg-slate-50 rounded-full opacity-50" />
                <div className="relative z-10">
                    <CreatePurchaseForm suppliers={suppliers} deviceModels={formattedModels} />
                </div>
            </div>
        </div>
    );
}
