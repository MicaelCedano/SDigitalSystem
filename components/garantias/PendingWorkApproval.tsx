
"use client";

import { useState, useEffect } from "react";
import { Check, X, Eye, Loader2, DollarSign, Package, Smartphone, User, FileText, Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { aprobarYPayLoteTrabajo } from "@/app/actions/garantias";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

    const handleApprove = async (loteId: number, customMonto?: number, saveDefault: boolean = false) => {
        setLoadingId(loteId);
        try {
            const res = await aprobarYPayLoteTrabajo(loteId, customMonto, saveDefault);
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lotes.map((lote) => (
                    <Card key={lote.id} className="border-none shadow-xl hover:shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2.5rem] group transition-all duration-500 hover:scale-[1.02]">
                        <div className="h-2 bg-amber-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </div>
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-black text-slate-800 text-2xl tracking-tighter">{lote.codigo}</h4>
                                    <div className="flex flex-col mt-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Técnico</span>
                                        <p className="text-sm font-bold text-slate-600">
                                            {lote.createdBy?.name || lote.createdBy?.username}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black uppercase text-[10px] tracking-widest px-3 py-1">
                                        Pendiente
                                    </Badge>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Balance Wallet</span>
                                        <span className="text-xs font-black text-emerald-600">
                                            RD$ {(lote.createdBy?.wallet?.[0]?.accounts?.[0]?.saldo || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100/50 group-hover:bg-slate-100/50 transition-colors">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <Package className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Equipos</p>
                                        <span className="text-sm font-black text-slate-700">{lote._count.garantias} Reportados</span>
                                    </div>
                                </div>
                                
                                <div className="px-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Notas</p>
                                    <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
                                        "{lote.observaciones || 'Sin observaciones adicionales'}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-emerald-100 hover:scale-105 transition-all duration-300"
                                    onClick={() => handleApprove(lote.id, lote.createdBy?.configuracionPagos?.[0]?.montoPorReparacion || 50)}
                                    disabled={loadingId === lote.id}
                                >
                                    {loadingId === lote.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5 mr-2" />
                                            Aprobar y Pagar
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setViewLote(lote)}
                                    className="h-14 w-14 rounded-2xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all duration-300"
                                >
                                    <Eye className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* View Details Modal */}
            <Dialog open={!!viewLote} onOpenChange={() => setViewLote(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                    <DialogHeader className="p-8 bg-slate-900 border-b border-slate-800 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Smartphone className="w-7 h-7 text-indigo-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                        Detalle del Reporte
                                    </DialogTitle>
                                    <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mt-0.5">
                                        Código: {viewLote?.codigo}
                                    </p>
                                </div>
                            </div>
                            <Badge className="w-fit bg-amber-500/20 text-amber-500 border-amber-500/30 h-8 px-4 rounded-full font-black uppercase text-[9px] tracking-widest backdrop-blur-sm">
                                Pendiente Revisión
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar bg-slate-50">
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryCard 
                                icon={<User className="w-5 h-5 text-indigo-600" />}
                                label="Técnico"
                                value={viewLote?.createdBy?.name || viewLote?.createdBy?.username}
                                subValue="Personal Asignado"
                                color="indigo"
                            />
                            <SummaryCard 
                                icon={<Package className="w-5 h-5 text-amber-600" />}
                                label="Cantidad"
                                value={`${viewLote?.garantias?.length} Equipos`}
                                subValue="Reporte de Trabajo"
                                color="amber"
                            />
                            <SummaryCard 
                                icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                                label="Total a Pagar"
                                value={`RD$ ${(viewLote?.garantias?.length * (viewLote?.createdBy?.configuracionPagos?.[0]?.montoPorReparacion || 50)).toLocaleString()}`}
                                subValue={`RD$ ${viewLote?.createdBy?.configuracionPagos?.[0]?.montoPorReparacion || 50} c/u`}
                                color="emerald"
                            />
                        </div>

                        {/* Equipments Table */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Listado de Equipos</h4>
                            </div>
                            
                            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-6 px-6 text-slate-500">IMEI / Serial</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-6 px-6 text-slate-500">Modelo/Marca</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-6 px-6 text-slate-500">Cliente</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] py-6 px-6 text-slate-500">Falla Reportada</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewLote?.garantias?.map((g: any) => (
                                                <TableRow key={g.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                                    <TableCell className="py-6 px-6">
                                                        <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                            {g.imeiSn}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <p className="font-bold text-slate-800">{g.modelo}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{g.marca}</p>
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <p className="text-sm font-medium text-slate-600">{g.cliente || "S/D"}</p>
                                                    </TableCell>
                                                    <TableCell className="py-6 px-6">
                                                        <div className="flex flex-col gap-2">
                                                            <p className="text-xs text-slate-500 italic leading-relaxed">"{g.problema}"</p>
                                                            {g.solucionAplicada && (
                                                                <Badge className="w-fit bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
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
                        </div>

                        {/* Observations Area */}
                        {viewLote?.observaciones && (
                            <div className="relative overflow-hidden p-8 bg-amber-50 rounded-[2.5rem] border border-amber-200 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600">Observaciones del Técnico</span>
                                    </div>
                                    <p className="text-lg font-bold text-amber-900 italic leading-relaxed">
                                        "{viewLote.observaciones}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4">
                        <Button 
                            variant="ghost"
                            className="rounded-2xl h-14 px-8 font-black text-slate-400"
                            onClick={() => setViewLote(null)}
                        >
                            Cerrar
                        </Button>
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 rounded-2xl h-14 shadow-lg shadow-emerald-100"
                            onClick={() => {
                                handleApprove(viewLote.id, viewLote?.createdBy?.configuracionPagos?.[0]?.montoPorReparacion || 50);
                                setViewLote(null);
                            }}
                            disabled={loadingId === viewLote?.id}
                        >
                            {loadingId === viewLote?.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Check className="w-5 h-5 mr-3" strokeWidth={3} />
                                    Aprobar Trabajo & Pagar
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SummaryCard({ icon, label, value, subValue, color }: any) {
    const colorStyles = {
        indigo: "bg-indigo-50 border-indigo-100",
        amber: "bg-amber-50 border-amber-100",
        emerald: "bg-emerald-50 border-emerald-100",
    };

    return (
        <div className={cn("p-6 rounded-[2rem] border transition-all", colorStyles[color as keyof typeof colorStyles])}>
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                    {icon}
                </div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
            </div>
            <div className="space-y-0.5">
                <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">{subValue}</p>
            </div>
        </div>
    );
}
