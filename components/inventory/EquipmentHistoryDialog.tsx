"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogTitle
} from "@/components/ui/dialog";
import {
    History,
    User,
    Loader2,
    Smartphone,
    CheckCircle2,
    XCircle,
    X,
    Calendar,
    Building2,
    ClipboardCheck,
    Quote,
    AlertCircle,
    HardDrive,
    Layers
} from "lucide-react";
import { getEquipmentFullDetails } from "@/app/actions/equipment";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { findAndAssignImageToEquipment } from "@/app/actions/image-service";
import Image from "next/image";

interface EquipmentHistoryDialogProps {
    equipmentId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EquipmentHistoryDialog({ equipmentId, open, onOpenChange }: EquipmentHistoryDialogProps) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getEquipmentFullDetails(equipmentId)
                .then((data) => {
                    setDetails(data);
                    setLoading(false); // Done with main data

                    // Background: fetch image if missing
                    if (data && !data.imageFilename) {
                        try {
                            findAndAssignImageToEquipment(equipmentId)
                                .then((result) => {
                                    if (result.success && result.filename) {
                                        setDetails((prev: any) => ({ ...prev, imageFilename: result.filename }));
                                    }
                                })
                                .catch(err => console.error("Auto image fetch failed:", err));
                        } catch (err) {
                            console.error("Auto image fetch trigger failed:", err);
                        }
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [open, equipmentId]);

    // Calculate Last QC
    const lastQC = details?.historial?.find((h: any) =>
        ['Revisado', 'Control de Calidad', 'Verificado'].includes(h.estado) ||
        h.user?.role?.toUpperCase().includes('CALIDAD') ||
        h.user?.role?.toUpperCase().includes('QUALITY')
    );

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Reduced height slightly to 85vh to ensure it fits better on most screens without cutting off */}
            <DialogContent className="max-w-3xl w-full bg-slate-50 p-0 overflow-hidden rounded-2xl border-0 shadow-2xl flex flex-col h-[85vh]">
                <DialogTitle className="sr-only">Expediente del Equipo</DialogTitle>
                {loading || !details ? (
                    <div className="flex flex-col items-center justify-center h-full bg-white">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
                        <p className="text-slate-500 font-medium text-sm">Cargando expediente...</p>
                    </div>
                ) : (
                    <>
                        {/* Header Fixed */}
                        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 z-20 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 truncate">
                                        Expediente del Equipo
                                    </h2>
                                    <p className="text-xs text-slate-500 font-mono">
                                        IMEI: {details.imei}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <Badge className={cn(
                                    "font-bold border-0 px-2.5 py-0.5 pointer-events-none",
                                    details.estado === 'En Inventario' ? "bg-emerald-100 text-emerald-700" :
                                        details.estado === 'Vendido' ? "bg-indigo-100 text-indigo-700" :
                                            "bg-amber-100 text-amber-700"
                                )}>
                                    {details.estado}
                                </Badge>
                                <DialogClose asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                        <X size={18} />
                                    </Button>
                                </DialogClose>
                            </div>
                        </div>

                        {/* Scrolling Content */}
                        <div className="flex-1 w-full bg-slate-50 overflow-y-auto">
                            <div className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto pb-24">

                                {/* 0. Device Visual (Added at Top) */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[320px]">
                                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-indigo-50/80 to-transparent z-0" />
                                    <div className="relative p-8 flex flex-col items-center text-center z-10">

                                        <div className="relative group mb-6 w-full flex justify-center">
                                            {details.imageFilename ? (
                                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 transition-transform duration-700 group-hover:scale-105">
                                                    {/* Glow effect */}
                                                    <div className="absolute inset-4 bg-indigo-500 blur-[50px] opacity-20 rounded-full" />
                                                    <Image
                                                        src={details.imageFilename.startsWith('http') ? details.imageFilename : `/device-images/${details.imageFilename}`}
                                                        alt={`${details.modelo}`}
                                                        width={300}
                                                        height={300}
                                                        className="w-full h-full object-contain relative z-10 drop-shadow-xl"
                                                        unoptimized
                                                    />

                                                    {/* Regenerate Button (Hidden by default, shown on hover/group hover) */}
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute bottom-0 right-0 z-20 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const result = await findAndAssignImageToEquipment(equipmentId, true); // true = force random
                                                            if (result.success && result.filename) {
                                                                setDetails({ ...details, imageFilename: result.filename });
                                                            }
                                                        }}
                                                        title="Buscar otra imagen"
                                                    >
                                                        <History className="h-4 w-4 text-slate-600" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 rounded-full" />
                                                    <Smartphone strokeWidth={0.5} className="w-32 h-32 text-slate-800 relative z-10 drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                                                </div>
                                            )}
                                        </div>

                                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                                            {details.deviceModel?.brand} {details.deviceModel?.modelName || details.modelo}
                                        </h1>

                                        <div className="flex items-center justify-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-3 py-1 h-8 gap-2 text-sm font-medium shadow-sm">
                                                <div className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: details.color?.toLowerCase() || '#cbd5e1' }} />
                                                {details.color}
                                            </Badge>
                                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-3 py-1 h-8 gap-2 text-sm font-medium shadow-sm">
                                                <HardDrive size={14} className="text-indigo-500" />
                                                {details.storageGb}GB
                                            </Badge>
                                            {details.grado && (
                                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 px-3 py-1 h-8 gap-2 text-sm font-medium shadow-sm">
                                                    <Layers size={14} className="text-amber-500" />
                                                    Grado {details.grado}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 1. Last QC & Note */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase tracking-wider">
                                            <ClipboardCheck size={16} />
                                            Última Revisión
                                        </div>
                                        {lastQC && (
                                            <span className="text-xs font-medium text-slate-400">
                                                {format(new Date(lastQC.fecha), "dd MMM yyyy", { locale: es })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm",
                                                lastQC ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {lastQC?.user?.username?.substring(0, 2).toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-lg">
                                                    {lastQC?.user?.name || lastQC?.user?.username || "Pendiente"}
                                                </div>
                                                <div className="text-sm text-slate-500 font-medium">
                                                    {lastQC?.user?.role?.replace('_', ' ') || "Control de Calidad"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* QC Note */}
                                        {lastQC?.observacion ? (
                                            <div className="relative bg-amber-50 rounded-xl p-4 border border-amber-100">
                                                <Quote className="absolute top-3 left-3 h-4 w-4 text-amber-300 opacity-50" />
                                                <p className="text-slate-700 text-sm font-medium pl-6 italic leading-relaxed">
                                                    "{lastQC.observacion}"
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 text-sm italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <AlertCircle size={14} />
                                                El técnico no dejó notas específicas.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Functional Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={cn(
                                        "bg-white p-5 rounded-2xl border flex items-center gap-4 shadow-sm",
                                        details.funcionalidad === 'Funcional'
                                            ? "border-emerald-100 bg-emerald-50/30"
                                            : "border-rose-100 bg-rose-50/30"
                                    )}>
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                            details.funcionalidad === 'Funcional' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                        )}>
                                            {details.funcionalidad === 'Funcional' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Funcionalidad</div>
                                            <div className={cn(
                                                "font-black text-lg",
                                                details.funcionalidad === 'Funcional' ? "text-emerald-700" : "text-rose-700"
                                            )}>
                                                {details.funcionalidad || 'No verificado'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-black text-sm">
                                            {details.grado || "-"}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Clasificación</div>
                                            <div className="font-black text-slate-700 text-lg">
                                                Grado Cosmético
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Technical Specs */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Datos del Sistema</h3>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        <div className="px-6 py-3.5 flex justify-between hover:bg-slate-50/50">
                                            <span className="text-sm text-slate-500 font-medium">ID Interno</span>
                                            <span className="text-sm font-mono font-bold text-slate-700">#{details.id}</span>
                                        </div>
                                        <div className="px-6 py-3.5 flex justify-between hover:bg-slate-50/50">
                                            <span className="text-sm text-slate-500 font-medium">Lote de Compra</span>
                                            <span className="text-sm font-bold text-slate-700">{details.lote?.codigo || "N/A"}</span>
                                        </div>
                                        <div className="px-6 py-3.5 flex justify-between hover:bg-slate-50/50">
                                            <span className="text-sm text-slate-500 font-medium">Fecha Ingreso</span>
                                            <span className="text-sm font-bold text-slate-700">
                                                {details.fechaIngreso ? format(new Date(details.fechaIngreso), "dd/MM/yyyy", { locale: es }) : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Origin */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Origen del Dispositivo</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-slate-900 truncate text-base">{details.purchase?.supplier?.name || "Proveedor Desconocido"}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Badge variant="outline" className="bg-slate-50 font-normal">
                                                    Compra #{details.purchaseId}
                                                </Badge>
                                                <span>•</span>
                                                <Calendar size={12} />
                                                {details.purchase?.purchaseDate ? format(new Date(details.purchase.purchaseDate), "dd MMM yyyy", { locale: es }) : "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-2" />

                                {/* 5. History Timeline */}
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-6">
                                        <History size={20} className="text-slate-400" />
                                        Historial Completo
                                    </h3>

                                    <div className="relative pl-4">
                                        <div className="absolute left-[19px] top-2 bottom-6 w-[2px] bg-slate-200" />

                                        {details.historial?.map((entry: any, idx: number) => (
                                            <div key={idx} className="relative pb-10 pl-10 group">
                                                {/* Timeline Dot */}
                                                <div className={cn(
                                                    "absolute left-0 top-1 w-10 h-10 rounded-full border-4 bg-white z-10 flex items-center justify-center transition-colors shadow-sm",
                                                    idx === 0
                                                        ? "border-indigo-100 text-indigo-600"
                                                        : "border-slate-100 text-slate-300"
                                                )}>
                                                    <div className={cn("w-3 h-3 rounded-full", idx === 0 ? "bg-indigo-600" : "bg-slate-300")} />
                                                </div>

                                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className={cn(
                                                                "font-bold text-base",
                                                                idx === 0 ? "text-indigo-700" : "text-slate-800"
                                                            )}>
                                                                {entry.estado}
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                                                                <User size={12} />
                                                                <span className="text-slate-700 font-semibold">{entry.user?.name || entry.user?.username}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs font-black text-slate-900">
                                                                {format(new Date(entry.fecha), "dd MMM", { locale: es })}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                {format(new Date(entry.fecha), "HH:mm", { locale: es })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {entry.observacion && entry.observacion !== "Sin observaciones" && (
                                                        <div className="pt-3 mt-1 border-t border-slate-50 text-sm text-slate-600 italic">
                                                            "{entry.observacion}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Extra padding at bottom to ensure scroll reaches end */}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
