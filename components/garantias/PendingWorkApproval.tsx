
"use client";

import { useState } from "react";
import { Check, X, Eye, Loader2, DollarSign, Package, Smartphone, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aprobarYPayLoteTrabajo } from "@/app/actions/garantias";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function PendingWorkApproval({ lotes }: { lotes: any[] }) {
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [viewLote, setViewLote] = useState<any | null>(null);
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
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setViewLote(lote)}
                                    className="h-11 w-11 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View Details Modal */}
            <Dialog open={!!viewLote} onOpenChange={() => setViewLote(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Smartphone className="w-6 h-6 text-indigo-600" />
                            </div>
                            Detalle del Reporte {viewLote?.codigo}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Revisa los equipos reportados por {viewLote?.createdBy?.name || viewLote?.createdBy?.username} antes de aprobar el pago.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-6">
                        {/* Info Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Técnico</span>
                                </div>
                                <p className="font-bold text-slate-800">{viewLote?.createdBy?.name || viewLote?.createdBy?.username}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Package className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cantidad</span>
                                </div>
                                <p className="font-bold text-slate-800">{viewLote?.garantias?.length} Equipos</p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Pago Total</span>
                                </div>
                                <p className="font-black text-indigo-700 text-lg">RD$ {(viewLote?.garantias?.length * 50).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Equipments Table */}
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-b border-slate-100 hover:bg-slate-50">
                                        <TableHead className="text-xs font-black uppercase tracking-widest py-4">IMEI / Serial</TableHead>
                                        <TableHead className="text-xs font-black uppercase tracking-widest py-4">Modelo/Marca</TableHead>
                                        <TableHead className="text-xs font-black uppercase tracking-widest py-4">Cliente</TableHead>
                                        <TableHead className="text-xs font-black uppercase tracking-widest py-4">Falla Reportada</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {viewLote?.garantias?.map((g: any) => (
                                        <TableRow key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4 font-mono text-sm font-bold text-indigo-600">{g.imeiSn}</TableCell>
                                            <TableCell className="py-4 font-bold text-slate-700">{g.modelo} {g.marca}</TableCell>
                                            <TableCell className="py-4">{g.cliente}</TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-1">
                                                  <span className="text-xs text-slate-500 italic">"{g.problema}"</span>
                                                  {g.solucionAplicada && (
                                                    <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0 px-1.5 h-auto">
                                                       {g.solucionAplicada}
                                                    </Badge>
                                                  )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 rounded-2xl h-12 shadow-lg shadow-emerald-200"
                            onClick={() => {
                                handleApprove(viewLote.id);
                                setViewLote(null);
                            }}
                            disabled={loadingId === viewLote?.id}
                        >
                            {loadingId === viewLote?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aprobar y Pagar Ahora"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
