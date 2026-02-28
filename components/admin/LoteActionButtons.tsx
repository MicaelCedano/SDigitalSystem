"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { approveLote, rejectLote } from "@/app/actions/lotes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LoteActionButtonsProps {
    loteId: number;
    loteCodigo: string;
}

export function LoteActionButtons({ loteId, loteCodigo }: LoteActionButtonsProps) {
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
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

    return (
        <div className="flex items-center gap-2 mt-4">
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
            <Button
                onClick={handleReject}
                disabled={loading !== null}
                variant="outline"
                className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-9 rounded-xl shadow-sm"
            >
                {loading === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </>
                )}
            </Button>
        </div>
    );
}
