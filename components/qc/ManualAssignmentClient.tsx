"use client";

import { useState, useCallback, useRef } from "react";
import {
    Users, Smartphone, Loader2, AlertCircle,
    CheckCircle2, XCircle, Clock, Send, Copy, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { assignToQualityControl } from "@/app/actions/equipment";

interface QCUser { id: number; name: string | null; username: string; }

interface ImeiStatus {
    imei: string;
    status: "checking" | "ok" | "not_found" | "not_available" | "duplicate";
    equipoId?: number;
    label?: string;
}

interface Props { 
    qcUsers: QCUser[]; 
    availableEquipments: any[];
}

function useDebouncedRef(delay: number) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    return (fn: () => void) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(fn, delay);
    };
}

export default function ManualAssignmentClient({ qcUsers, availableEquipments }: Props) {
    const [rawText, setRawText] = useState("");
    const [imeiStatuses, setImeiStatuses] = useState<ImeiStatus[]>([]);
    const [selectedQcId, setSelectedQcId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debounce = useDebouncedRef(600);

    const parseImeis = (text: string): string[] =>
        text.split(/[\n,;\s]+/).map(s => s.trim()).filter(s => s.length > 5);

    /** Splits parsed IMEIs into unique (for API) and marks duplicates inline */
    const buildStatusList = (imeis: string[]): { unique: string[]; initial: ImeiStatus[] } => {
        const seen = new Set<string>();
        const initial: ImeiStatus[] = [];
        const unique: string[] = [];
        for (const imei of imeis) {
            if (seen.has(imei)) {
                initial.push({ imei, status: "duplicate", label: "Duplicado en la lista" });
            } else {
                seen.add(imei);
                unique.push(imei);
                initial.push({ imei, status: "checking" });
            }
        }
        return { unique, initial };
    };

    const validateImeis = useCallback(async (allImeis: string[]) => {
        if (allImeis.length === 0) { setImeiStatuses([]); return; }

        const { unique, initial } = buildStatusList(allImeis);
        setImeiStatuses(initial);

        try {
            const res = await fetch("/api/equipment/validate-imeis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imeis: unique })
            });
            const data = await res.json();
            if (data.results) {
                const map = new Map<string, ImeiStatus>(data.results.map((r: ImeiStatus) => [r.imei, r]));
                setImeiStatuses(initial.map(s => s.status === "duplicate" ? s : (map.get(s.imei) ?? s)));
            }
        } catch {
            setImeiStatuses(allImeis.map(imei => ({ imei, status: "not_found" as const })));
        }
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setRawText(text);
        const parsed = parseImeis(text);
        if (parsed.length > 0) debounce(() => validateImeis(parsed));
        else setImeiStatuses([]);
    };

    const addImeiToList = (imei: string) => {
        const currentImeis = parseImeis(rawText);
        if (currentImeis.includes(imei)) {
            toast.error("El IMEI ya está en la lista");
            return;
        }
        const newText = rawText.trim() ? `${rawText.trim()}\n${imei}` : imei;
        setRawText(newText);
        validateImeis([...currentImeis, imei]);
        toast.success("IMEI añadido");
    };

    const handleSubmit = async () => {
        if (!selectedQcId) { toast.error("Selecciona un técnico de Control de Calidad"); return; }
        const validIds = imeiStatuses.filter(s => s.status === "ok" && s.equipoId).map(s => s.equipoId!);
        if (validIds.length === 0) { toast.error("No hay equipos válidos para asignar"); return; }
        setIsSubmitting(true);
        const res = await assignToQualityControl(validIds, Number(selectedQcId));
        setIsSubmitting(false);
        if (res.success) {
            toast.success(res.message);
            setRawText(""); setImeiStatuses([]); setSelectedQcId("");
        } else {
            toast.error(res.error);
        }
    };

    const filteredAvailable = availableEquipments.filter(e => 
        e.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.deviceModel?.brand + " " + e.deviceModel?.modelName).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const okCount = imeiStatuses.filter(s => s.status === "ok").length;
    const errorCount = imeiStatuses.filter(s => s.status === "not_found" || s.status === "not_available").length;
    const dupCount = imeiStatuses.filter(s => s.status === "duplicate").length;
    const checkingCount = imeiStatuses.filter(s => s.status === "checking").length;
    const selectedUser = qcUsers.find(u => u.id.toString() === selectedQcId);

    const statusColor = (s: ImeiStatus["status"]) => ({
        ok: { row: "bg-emerald-50 border-emerald-100", icon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        checking: { row: "bg-slate-50 border-slate-100", icon: "bg-slate-100 text-slate-400", badge: "bg-slate-100 text-slate-500 border-slate-200" },
        duplicate: { row: "bg-orange-50 border-orange-100", icon: "bg-orange-100 text-orange-600", badge: "bg-orange-100 text-orange-700 border-orange-200" },
        not_available: { row: "bg-amber-50 border-amber-100", icon: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
        not_found: { row: "bg-rose-50 border-rose-100", icon: "bg-rose-100 text-rose-600", badge: "bg-rose-100 text-rose-700 border-rose-200" },
    }[s]);

    const statusLabel = (s: ImeiStatus["status"]) => ({
        ok: "✓ Disponible", checking: "...", duplicate: "⚠ Duplicado",
        not_available: "No disponible", not_found: "No encontrado",
    }[s]);

    const StatusIcon = ({ s }: { s: ImeiStatus["status"] }) =>
        s === "checking" ? <Loader2 size={12} className="animate-spin" />
            : s === "ok" ? <CheckCircle2 size={12} />
                : <XCircle size={12} />;

    return (
        <div className="space-y-5">
            {/* TOP BAR */}
            <div className="bg-[#0f172a] rounded-[2rem] p-5 flex flex-col md:flex-row items-start md:items-center gap-5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full -mr-20 -mt-20 pointer-events-none" />

                {/* Technician */}
                <div className="relative z-10 flex-1 min-w-[220px] space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-1.5">
                        <Users size={10} /> Técnico Asignado
                    </Label>
                    <Select value={selectedQcId} onValueChange={setSelectedQcId}>
                        <SelectTrigger className="h-12 bg-white/10 border-white/20 rounded-2xl text-white font-bold text-sm placeholder:text-slate-400 focus:ring-indigo-500/50">
                            <SelectValue placeholder="Seleccionar técnico de CC..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-white/10 text-white rounded-2xl shadow-2xl">
                            {qcUsers.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()} className="focus:bg-white/10 rounded-xl cursor-pointer py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-300 text-[11px] font-black">
                                            {(u.name || u.username).substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold">{u.name || u.username}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="hidden md:block w-px h-14 bg-white/10" />

                {/* Stats */}
                <div className="relative z-10 flex items-center gap-5">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Válidos</p>
                        <p className="text-3xl font-black text-emerald-400 leading-none">{okCount}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Inválidos</p>
                        <p className="text-3xl font-black text-rose-400 leading-none">{errorCount + dupCount}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pend. Inv.</p>
                        <p className="text-xl font-bold text-slate-100 leading-none">{availableEquipments.length}</p>
                    </div>
                </div>

                <div className="hidden md:block w-px h-14 bg-white/10" />

                {/* Confirm */}
                <div className="relative z-10 flex-shrink-0">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || okCount === 0 || !selectedQcId || checkingCount > 0}
                        className="h-13 px-7 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black rounded-2xl shadow-2xl shadow-indigo-900/60 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-3 text-base whitespace-nowrap"
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={20} />Asignando...</>
                            : checkingCount > 0 ? <><Clock size={20} className="animate-spin" />Validando...</>
                                : <><Send size={18} />Asignar {okCount > 0 ? `${okCount} Equipo${okCount !== 1 ? "s" : ""}` : ""}{selectedUser ? ` a ${selectedUser.name || selectedUser.username}` : ""}</>}
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Column 1: Available in Inventory */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-4 overflow-hidden h-[600px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><ClipboardList size={18} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800">Equipos Disponibles</h3>
                                <p className="text-xs text-slate-400">En Inventario actualmente</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black">{availableEquipments.length}</Badge>
                    </div>

                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar por IMEI o Modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 bg-slate-50 border-slate-100 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {filteredAvailable.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                                <AlertCircle size={40} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium">No se encontraron equipos</p>
                            </div>
                        ) : filteredAvailable.map((eq) => (
                            <button
                                key={eq.id}
                                onClick={() => addImeiToList(eq.imei)}
                                className="w-full text-left p-3.5 rounded-2xl border border-slate-50 hover:border-indigo-200 hover:bg-indigo-50 group transition-all duration-300"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400 mb-0.5">
                                            {eq.deviceModel?.brand} {eq.deviceModel?.modelName}
                                        </p>
                                        <p className="font-mono font-bold text-sm text-slate-700 truncate">{eq.imei}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white p-1 rounded-lg">
                                        <Send size={12} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Column 2: Input Area */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-4 h-[600px]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Smartphone size={18} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Cargar a la Lista</h3>
                            <p className="text-xs text-slate-400">Escribe o selecciona de la columna izquierda</p>
                        </div>
                    </div>
                    <Textarea
                        placeholder={"356938035643809\n354269091234567\n..."}
                        value={rawText}
                        onChange={handleTextChange}
                        className="flex-1 p-4 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white font-mono text-sm resize-none leading-7"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2.5 border rounded-2xl text-center bg-emerald-50 border-emerald-100 text-emerald-700`}>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Válidos</p>
                            <p className="text-xl font-black leading-none mt-0.5">{okCount}</p>
                        </div>
                        <div className={`p-2.5 border rounded-2xl text-center bg-rose-50 border-rose-100 text-rose-700`}>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Detectados</p>
                            <p className="text-xl font-black leading-none mt-0.5">{imeiStatuses.length}</p>
                        </div>
                    </div>
                </div>

                {/* Column 3: Real-time Status */}
                <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col gap-4 h-[600px]">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 tracking-tight">Estado del Lote</h3>
                        {checkingCount > 0 && <Loader2 className="animate-spin text-indigo-500 ml-auto" size={15} />}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {imeiStatuses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-200">
                                <Smartphone size={52} className="mb-4 opacity-20" />
                                <p className="font-medium text-sm text-slate-400">Pega IMEIs para validar</p>
                            </div>
                        ) : imeiStatuses.map((item, i) => {
                            const colors = statusColor(item.status)!;
                            return (
                                <div key={`${item.imei}-${i}`} className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${colors.row}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-7 h-7 flex-shrink-0 rounded-xl flex items-center justify-center ${colors.icon}`}>
                                            <StatusIcon s={item.status} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono font-bold text-sm text-slate-800 truncate leading-none">{item.imei}</p>
                                            {item.label && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.label}</p>}
                                        </div>
                                    </div>
                                    <Badge className={`ml-3 flex-shrink-0 text-[9px] font-black uppercase px-2 py-0.5 border ${colors.badge}`}>
                                        {statusLabel(item.status)}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
