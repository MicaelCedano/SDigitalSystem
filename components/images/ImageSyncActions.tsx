
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Trash2 } from "lucide-react";
import { syncAllEverything, clearLocalImages } from "@/app/actions/image-service";
import { toast } from "sonner";

export function ImageSyncActions() {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleClear = async () => {
        if (!confirm("¿Estás seguro de que quieres borrar todas las imágenes locales? Esto reseteará el catálogo visual para usar enlaces externos.")) return;

        setIsSyncing(true);
        const tid = toast.loading("Limpiando almacenamiento local y reseteando base de datos...");
        try {
            const res = await clearLocalImages();
            if (res.success) {
                toast.success("Limpieza completada. Ya no hay imágenes locales.", { id: tid });
            } else {
                toast.error(res.error || "Error en la limpieza", { id: tid });
            }
        } catch (e) {
            toast.error("Error inesperado", { id: tid });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGlobalSync = async () => {
        setIsSyncing(true);
        const tid = toast.loading("Iniciando sincronización global de imágenes (Modelos + Equipos)...");
        try {
            const res = await syncAllEverything();
            if (res.success) {
                toast.success(
                    `Sincronización finalizada. Modelos: ${res.modelsUpdated}/${res.modelsProcessed}. Equipos: ${res.equipmentsUpdated}/${res.equipmentsProcessed}.`,
                    { id: tid, duration: 6000 }
                );
            } else {
                toast.error(res.error || "Error en la sincronización global", { id: tid });
            }
        } catch (e) {
            toast.error("Ocurrió un error inesperado", { id: tid });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0 flex gap-4">
            <Button
                onClick={handleClear}
                disabled={isSyncing}
                variant="outline"
                className="border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl h-14 px-6 font-bold gap-2"
            >
                <Trash2 className="w-5 h-5" />
                Limpiar Disco
            </Button>
            <Button
                onClick={handleGlobalSync}
                disabled={isSyncing}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-xl transition-all duration-300 hover:shadow-pink-500/25 hover:scale-105 active:scale-95 font-black rounded-2xl h-14 px-8 gap-3 border-none"
            >
                <Zap className={isSyncing ? "animate-pulse w-5 h-5 fill-white" : "w-5 h-5 fill-white"} />
                {isSyncing ? "Sincronizando..." : "Sincronizar TODO de golpe"}
            </Button>
        </div>
    );
}
