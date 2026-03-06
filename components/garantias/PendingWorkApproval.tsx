
"use client";

import { useState } from "react";
import { Check, X, Eye, Loader2, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aprobarYPayLoteTrabajo } from "@/app/actions/garantias";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export function PendingWorkApproval({ lotes }: { lotes: any[] }) {
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const router = useRouter();

    if (!lotes || lotes.length === 0) return null;

    const handleApprove = async (loteId: number) => {
        setLoadingId(loteId);
        try {
            const res = await aprobarYPayLoteTrabajo(loteId);
            if (res.success) {
                toast.success("Trabajo aprobado y pagado al técnico.");
                router.refresh();
            } else {
                toast.error((res as any).error || "Error al aprobar");
            }
        } catch (error) {
            toast.error("Error crítico");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Trabajos por Aprobar y Pagar</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lotes.map((lote) => (
                    <Card key={lote.id} className="border-none shadow-xl bg-white overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className="h-2 bg-amber-500" />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg tracking-tight">{lote.codigo}</h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        Técnico: {lote.createdBy?.name || lote.createdBy?.username}
                                    </p>
                                </div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 font-bold">
                                    Pendiente
                                </Badge>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600">{lote._count.garantias} Equipos reportados</span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 italic">
                                    "{lote.observaciones || 'Sin observaciones'}"
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-200"
                                    onClick={() => handleApprove(lote.id)}
                                    disabled={loadingId === lote.id}
                                >
                                    {loadingId === lote.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Aprobar y Pagar
                                        </>
                                    )}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600">
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
