import { Suspense } from "react";
import { getSuppliers } from "@/app/actions/supplier";
import { SuppliersTable, SuppliersHeaderActions } from "@/components/purchases/SuppliersList";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Proveedores | RMA System",
    description: "Gestión de proveedores",
};

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();

    return (
        <div className="flex-1 space-y-8 fade-in-up duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-900 shadow-2xl relative overflow-hidden group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-teal-500/20 dark:from-blue-500/10 dark:to-teal-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" /><path d="M14 17h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold tracking-tighter text-slate-800">
                            Directorio de Proveedores
                        </h2>
                        <p className="text-slate-400 font-bold text-base mt-1">
                            Gestiona tus contactos y fuentes de abastecimiento.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0">
                    <SuppliersHeaderActions />
                </div>
            </div>

            <div className="relative z-10">
                <SuppliersTable suppliers={suppliers} />
            </div>
        </div>
    );
}
