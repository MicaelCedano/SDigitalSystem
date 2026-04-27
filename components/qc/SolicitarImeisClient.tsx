"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Smartphone, Loader2, AlertCircle, CheckCircle2,
    XCircle, Clock, Send, RefreshCw, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImeiStatus {
    imei: string;
    status: "checking" | "ok" | "not_found" | "not_available" | "duplicate";
    label?: string;
}

interface Solicitud {
    id: number;
    imeis: string[];
    estado: string;
    observacion: string | null;
    fechaCreacion: string;
    fechaResolucion: string | null;
}

function useDebouncedRef(delay: number) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    return (fn: () => void) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(fn, delay);
    };
}

export default function SolicitarImeisClient() {
    const [rawText, setRawText] = useState("");
    const [imeiStatuses, setImeiStatuses] = useState<ImeiStatus[]>([]);
    const [observacion, setObservacion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
    const debounce = useDebouncedRef(600);

    const parseImeis = (text: string): string[] =>
        text.split(/[\n,;\s]+/).map(s => s.trim()).filter(s => s.length > 5);

    const buildStatusList = (imeis: string[]): { unique: string[]; initial: ImeiStatus[] } => {
        const seen = new Set<string>();
        const initial: ImeiStatus[] = [];
        const unique: string[] = [];
        for (const imei of imeis) {
            if (seen.has(imei)) {
                initial.push({ imei, status: "duplicate" });
            } else {
                seen.add(imei);
                initial.push({ imei, status: "checking" });
                unique.push(imei);
            }
        }
        return { unique, initial };
    };

    const validateImeis = useCallback(async (text: string) => {
        const imeis = parseImeis(text);
        if (imeis.length === 0) { setImeiStatuses([]); return; }

        const { unique, initial } = buildStatusList(imeis);
        setImeiStatuses(initial);

        if (unique.length === 0) return;

        try {
            const res = await fetch("/api/equipment/validate-imeis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imeis: unique })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setImeiStatuses(prev =>
                    prev.map(item =>
                        item.status === "duplicate"
                            ? item
                            : { ...item, status: "not_available", label: data.error || "No se pudo validar" }
                    )
                );
                return;
            }

            setImeiStatuses(prev =>
                prev.map(item => {
                    if (item.status === "duplicate") return item;
                    const result = data.results.find((r: any) => r.imei === item.imei);
                    if (!result) return item;
                    return { ...item, status: result.status, label: result.label };
                })
            );
        } catch {
            setImeiStatuses(prev =>
                prev.map(item =>
                    item.status === "duplicate"
                        ? item
                        : { ...item, status: "not_available", label: "Error de red al validar" }
                )
            );
        }
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawText(val);
        debounce(() => validateImeis(val));
    };

    const loadMisSolicitudes = async () => {
        setLoadingSolicitudes(true);
        try {
            const res = await fetch("/api/solicitudes-imei/mis-solicitudes");
            const data = await res.json();
            if (data.success) setSolicitudes(data.solicitudes);
        } catch {
            // ignore
        } finally {
            setLoadingSolicitudes(false);
        }
    };

    useEffect(() => { loadMisSolicitudes(); }, []);

    const validCount = imeiStatuses.filter(s => s.status === "ok").length;
    const hasValids = validCount > 0;

    const handleSubmit = async () => {
        const imeis = imeiStatuses.filter(s => s.status === "ok").map(s => s.imei);
        if (imeis.length === 0) { toast.error("No hay IMEIs válidos para solicitar."); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/solicitudes-imei", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imeis, observacion: observacion || undefined })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                setRawText("");
                setImeiStatuses([]);
                setObservacion("");
                loadMisSolicitudes();
            } else {
                toast.error(data.error || "Error al enviar solicitud.");
            }
        } catch {
            toast.error("Error de red.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const estadoBadge = (estado: string) => {
        if (estado === "Pendiente") return <Badge className="bg-amber-50 text-amber-600 border-amber-200 font-black text-[10px] uppercase tracking-widest">Pendiente</Badge>;
        if (estado === "Aprobado")  return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-black text-[10px] uppercase tracking-widest">Aprobado</Badge>;
        return <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-black text-[10px] uppercase tracking-widest">Rechazado</Badge>;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Panel izquierdo - Formulario */}
            <div className="lg:col-span-3 space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                    <div className="h-1.5 bg-indigo-600" />
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-xl">
                                <Smartphone className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">IMEIs a Solicitar</h3>
                                <p className="text-xs text-slate-500">Uno por línea, o separados por coma/espacio</p>
                            </div>
                        </div>

                        <Textarea
                            value={rawText}
                            onChange={handleTextChange}
                            placeholder={"352999001234567\n352999001234568\n352999001234569"}
                            className="font-mono text-sm min-h-[180px] resize-none rounded-2xl border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                        />

                        {/* Status chips */}
                        {imeiStatuses.length > 0 && (
                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {imeiStatuses.map((item, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm",
                                        item.status === "ok" && "bg-emerald-50 border-emerald-100",
                                        item.status === "not_found" && "bg-rose-50 border-rose-100",
                                        item.status === "not_available" && "bg-amber-50 border-amber-100",
                                        item.status === "duplicate" && "bg-slate-50 border-slate-100",
                                        item.status === "checking" && "bg-slate-50 border-slate-100 animate-pulse",
                                    )}>
                                        <span className="font-mono font-bold text-slate-700">{item.imei}</span>
                                        <span className="flex items-center gap-1.5 text-xs font-bold">
                                            {item.status === "checking" && <><Loader2 className="w-3 h-3 animate-spin text-slate-400" /><span className="text-slate-400">Verificando...</span></>}
                                            {item.status === "ok" && <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">{item.label || "Disponible"}</span></>}
                                            {item.status === "not_found" && <><XCircle className="w-3.5 h-3.5 text-rose-500" /><span className="text-rose-600">No encontrado</span></>}
                                            {item.status === "not_available" && <><AlertCircle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-600">{item.label}</span></>}
                                            {item.status === "duplicate" && <><AlertCircle className="w-3.5 h-3.5 text-slate-400" /><span className="text-slate-400">Duplicado</span></>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Observación (opcional)</label>
                            <Textarea
                                value={observacion}
                                onChange={e => setObservacion(e.target.value)}
                                placeholder="Ej: Equipos del lote de ayer, modelos iPhone 13..."
                                className="resize-none rounded-2xl border-slate-200 text-sm min-h-[80px]"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm">
                                <span className="font-black text-emerald-600">{validCount}</span>
                                <span className="text-slate-500 font-medium"> disponible{validCount !== 1 ? "s" : ""} de </span>
                                <span className="font-black text-slate-700">{imeiStatuses.length}</span>
                                <span className="text-slate-500 font-medium"> ingresado{imeiStatuses.length !== 1 ? "s" : ""}</span>
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={!hasValids || isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 px-8 rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" />Enviar Solicitud</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Panel derecho - Mis solicitudes */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-slate-400" />
                        <h3 className="font-black text-slate-700 text-base">Mis Solicitudes</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={loadMisSolicitudes} className="h-8 w-8 rounded-xl text-slate-400 hover:text-indigo-600">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {loadingSolicitudes ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                ) : solicitudes.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">No tienes solicitudes aún.</div>
                ) : (
                    <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                        {solicitudes.map(sol => (
                            <Card key={sol.id} className="border-none shadow-md shadow-slate-200/50 rounded-2xl overflow-hidden">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitud #{sol.id}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {new Date(sol.fechaCreacion).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                        {estadoBadge(sol.estado)}
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">{sol.imeis.length} equipo{sol.imeis.length !== 1 ? "s" : ""}</span>
                                    </div>

                                    {sol.observacion && (
                                        <p className="text-xs text-slate-500 italic bg-slate-50 rounded-xl p-2.5 mt-2">"{sol.observacion}"</p>
                                    )}

                                    {sol.estado === "Pendiente" && (
                                        <div className="flex items-center gap-1.5 mt-3 text-amber-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">Esperando aprobación del admin</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
