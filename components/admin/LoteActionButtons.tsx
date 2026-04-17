"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Trash2, RotateCcw } from "lucide-react";
import { approveLote, rejectLote, cancelLote } from "@/app/actions/lotes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LoteActionButtonsProps {
    loteId: number;
    loteCodigo: string;
    estado?: string;
}

export function LoteActionButtons({ loteId, loteCodigo, estado }: LoteActionButtonsProps) {
    const [loading, setLoading] = useState<"approve" | "reject" | "cancel" | null>(null);
    const router = useRouter();

    const handleApprove = async () => {
        setLoading("approve");
        try {
            const res = await approveLote(loteId);
            if (res.success) {
                toast.success(`Lote ${loteCodigo} aprobado correctamente`);
                router.refresh();
            } else {
                toast.error(res.error || "Error al aprobar lote");
            }
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async () => {
        setLoading("reject");
        try {
            const res = await rejectLote(loteId);
            if (res.success) {
                toast.success(`Lote ${loteCodigo} devuelto al técnico`);
                router.refresh();
            } else {
                toast.error(res.error || "Error al rechazar lote");
            }
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async () => {
        setLoading("cancel");
        try {
            const res = await cancelLote(loteId);
            if (res.success) {
                toast.success(`Lote ${loteCodigo} eliminado y equipos regresados a inventario`);
                router.refresh();
            } else {
                toast.error(res.error || "Error al eliminar lote");
            }
        } finally {
            setLoading(null);
        }
    };

    const isAbierto = estado === "Abierto";

    return (
        <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2">
                {!isAbierto && (
                    <Button
                        onClick={handleApprove}
                        disabled={loading !== null}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl shadow-sm"
                    >
                        {loading === "approve" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" /> Aceptar
                            </>
                        )}
                    </Button>
                )}

                {!isAbierto && (
                    <Button
                        onClick={handleReject}
                        disabled={loading !== null}
                        variant="outline"
                        className="flex-1 border-amber-200 text-amber-600 hover:bg-amber-50 font-bold h-9 rounded-xl shadow-sm"
                    >
                        {loading === "reject" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <RotateCcw className="mr-2 h-4 w-4" /> Devolver
                            </>
                        )}
                    </Button>
                )}
            </div>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        disabled={loading !== null}
                        variant="ghost"
                        className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold h-9 rounded-xl transition-colors"
                    >
                        {loading === "cancel" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" /> Cancelar Lote (Desasignar)
                            </>
                        )}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-slate-800 tracking-tight">¿Cancelar Lote?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            Esta acción desasignará todos los equipos del técnico y los devolverá al inventario con estado "En Inventario". 
                            No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 text-slate-500 h-10">Volver</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleCancel}
                            className="rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white h-10 px-6 shadow-lg shadow-rose-200"
                        >
                            Sí, Cancelar y Desasignar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
