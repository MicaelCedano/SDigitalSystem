import { Suspense } from "react";
import { getDeviceModels } from "@/app/actions/device-models";
import { DeviceModelsTable, DeviceModelsHeaderActions } from "@/components/purchases/DeviceModelsList";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Modelos de Dispositivos | RMA System",
    description: "Gestión de modelos de dispositivos",
};

export const dynamic = 'force-dynamic';

export default async function DeviceModelsPage() {
    const models = await getDeviceModels();

    // Map models to match the expected interface in DeviceModelsTable
    // Prisma returns null for optionals, which is fine, but good to be explicit
    const formattedModels = models.map(m => ({
        id: m.id,
        brand: m.brand,
        modelName: m.modelName,
        storageGb: m.storageGb,
        color: m.color,
        imageFilename: m.imageFilename
    }));

    return (
        <div className="flex-1 space-y-8 fade-in-up duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-900 shadow-2xl relative overflow-hidden group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold tracking-tighter text-slate-800">
                            Catálogo de Modelos
                        </h2>
                        <p className="text-slate-400 font-bold text-base mt-1">
                            Gestiona modelos, capacidades y colores.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0">
                    <DeviceModelsHeaderActions />
                </div>
            </div>

            <div className="relative z-10">
                <DeviceModelsTable models={formattedModels} />
            </div>
        </div>
    );
}

// Client Components are imported from separate file
