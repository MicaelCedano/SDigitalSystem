"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Users,
    Search,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Hash,
    Package,
    User as UserIcon,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface QCEquipo {
    id: number;
    imei: string;
    deviceModel: { brand: string; modelName: string; storageGb: number; color: string | null } | null;
    funcionalidad: string | null;
    estado: string;
    loteCodigo: string | null;
}

interface QCSummary {
    tecnicoId: number;
    username: string;
    name: string | null;
    profileImage: string | null;
    total: number;
    funcionales: number;
    noFuncionales: number;
    equipos: QCEquipo[];
}

interface PurchaseQCBreakdownProps {
    purchaseId: number;
    qcBreakdown: QCSummary[];
    pendingReview: { total: number; equipos: QCEquipo[] };
    totalPurchase: number;
}

const STORAGE_PREFIX = "sdigital.qc.collapsed.";

export function PurchaseQCBreakdown({ purchaseId, qcBreakdown, pendingReview, totalPurchase }: PurchaseQCBreakdownProps) {
    const [search, setSearch] = useState("");
    const [expandedQC, setExpandedQC] = useState<number | null>(null);

    // null = sin preferencia guardada (primera vez: expandido por defecto).
    // Una vez que el usuario hace clic, persistimos en localStorage por compra.
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [hasUserPreference, setHasUserPreference] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = window.localStorage.getItem(STORAGE_PREFIX + purchaseId);
        if (stored === "true") {
            setIsCollapsed(true);
            setHasUserPreference(true);
        } else if (stored === "false") {
            setIsCollapsed(false);
            setHasUserPreference(true);
        }
    }, [purchaseId]);

    const toggleCollapsed = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_PREFIX + purchaseId, String(next));
            }
            setHasUserPreference(true);
            return next;
        });
    };

    const filteredQC = useMemo(() => {
        if (!search.trim()) return qcBreakdown;
        const q = search.toLowerCase();
        return qcBreakdown.filter(qc => {
            if (
                qc.username.toLowerCase().includes(q) ||
                (qc.name?.toLowerCase().includes(q) ?? false)
            ) return true;
            // También buscar por IMEI dentro de los equipos
            return qc.equipos.some(e => e.imei.toLowerCase().includes(q));
        });
    }, [search, qcBreakdown]);

    const totalReviewed = qcBreakdown.reduce((s, q) => s + q.total, 0) + pendingReview.total;
    const noReviewed = totalPurchase - totalReviewed;

    // Resumen compacto que se ve cuando la sección está colapsada.
    const compactSummary = (
        <div className="flex items-center gap-4 flex-wrap px-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-2.5 py-1 rounded-lg">
                <Users className="h-3.5 w-3.5" /> {qcBreakdown.length} QCs
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" /> {totalReviewed} revisados
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-600 uppercase tracking-[0.2em] bg-rose-50 px-2.5 py-1 rounded-lg">
                <XCircle className="h-3.5 w-3.5" /> {qcBreakdown.reduce((s, q) => s + q.noFuncionales, 0)} no funcionales
            </span>
            {noReviewed > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] bg-amber-50 px-2.5 py-1 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5" /> {noReviewed} pendientes
                </span>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header — clickable, colapsa/expande la sección entera */}
            <button
                type="button"
                onClick={toggleCollapsed}
                aria-expanded={!isCollapsed}
                aria-controls={`qc-breakdown-body-${purchaseId}`}
                className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-2xl"
            >
                <div className="flex items-start gap-3 px-2 py-2 rounded-2xl transition-colors group-hover:bg-slate-50/60">
                    <div className="p-2 bg-slate-900 rounded-xl text-white flex-shrink-0">
                        <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Revisión por QC</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                                    Cuántos equipos revisó cada técnico en esta compra
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                    "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600",
                                    isCollapsed && "bg-indigo-100 text-indigo-600"
                                )}
                            >
                                <ChevronDown
                                    className={cn(
                                        "h-5 w-5 transition-transform duration-300",
                                        !isCollapsed && "rotate-180"
                                    )}
                                />
                            </div>
                        </div>
                        {isCollapsed && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                {compactSummary}
                            </div>
                        )}
                    </div>
                </div>
            </button>

            {/* Cuerpo colapsable */}
            {!isCollapsed && (
                <div
                    id={`qc-breakdown-body-${purchaseId}`}
                    className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300"
                >

            {/* Resumen rápido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryStat
                    icon={<Users className="h-5 w-5" />}
                    label="QCs Activos"
                    value={qcBreakdown.length}
                    color="indigo"
                />
                <SummaryStat
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label="Equipos Revisados"
                    value={totalReviewed}
                    subtext={`de ${totalPurchase} totales`}
                    color="emerald"
                />
                <SummaryStat
                    icon={<XCircle className="h-5 w-5" />}
                    label="No Funcionales"
                    value={qcBreakdown.reduce((s, q) => s + q.noFuncionales, 0)}
                    color="rose"
                />
                <SummaryStat
                    icon={<AlertCircle className="h-5 w-5" />}
                    label="Pendientes de Revisión"
                    value={noReviewed}
                    color="amber"
                />
            </div>

            {/* Buscador */}
            {qcBreakdown.length > 0 && (
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    <Input
                        placeholder="Buscar QC por nombre, usuario o IMEI revisado..."
                        className="h-14 pl-12 bg-white border-slate-100 rounded-[1.5rem] font-bold text-slate-700 shadow-sm focus-visible:ring-indigo-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}

            {/* Lista de QCs */}
            {filteredQC.length > 0 ? (
                <div className="space-y-4">
                    {filteredQC.map((qc, idx) => {
                        const isExpanded = expandedQC === qc.tecnicoId;
                        const pct = totalPurchase > 0 ? (qc.total / totalPurchase) * 100 : 0;
                        const functionalPct = qc.total > 0 ? (qc.funcionales / qc.total) * 100 : 0;

                        return (
                            <Card
                                key={qc.tecnicoId}
                                className="rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-200/40 overflow-hidden bg-white hover:shadow-2xl transition-all duration-300"
                            >
                                <div
                                    className="p-6 cursor-pointer select-none"
                                    onClick={() => setExpandedQC(isExpanded ? null : qc.tecnicoId)}
                                >
                                    <div className="flex items-center gap-5">
                                        {/* Rank badge */}
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md",
                                                idx === 0 ? "bg-amber-400 text-white shadow-amber-200" :
                                                    idx === 1 ? "bg-slate-300 text-slate-700 shadow-slate-200" :
                                                        idx === 2 ? "bg-orange-300 text-white shadow-orange-200" :
                                                            "bg-slate-100 text-slate-500"
                                            )}>
                                                #{idx + 1}
                                            </div>
                                        </div>

                                        {/* Avatar + nombre */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
                                                {(qc.name || qc.username).slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-base truncate">
                                                    {qc.name || qc.username}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    @{qc.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats inline */}
                                        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Revisados</p>
                                                <p className="text-2xl font-black text-slate-800 tracking-tighter">{qc.total}</p>
                                            </div>
                                            <div className="w-px h-10 bg-slate-100" />
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Funcionales</p>
                                                <p className="text-2xl font-black text-emerald-600 tracking-tighter">{qc.funcionales}</p>
                                            </div>
                                            <div className="w-px h-10 bg-slate-100" />
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">No Func.</p>
                                                <p className="text-2xl font-black text-rose-600 tracking-tighter">{qc.noFuncionales}</p>
                                            </div>
                                            <div className="w-px h-10 bg-slate-100" />
                                            <div className="text-right min-w-[120px]">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">% del Lote</p>
                                                <p className="text-lg font-black text-indigo-600 tracking-tighter">{pct.toFixed(1)}%</p>
                                            </div>
                                        </div>

                                        {/* Expand chevron */}
                                        <div className="flex-shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedQC(isExpanded ? null : qc.tecnicoId);
                                                }}
                                            >
                                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Barra de progreso funcional vs no funcional */}
                                    <div className="mt-5 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Tasa de aprobación: <span className="text-emerald-600">{functionalPct.toFixed(0)}%</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {qc.equipos.length} equipos en lista
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-700"
                                                style={{ width: `${functionalPct}%` }}
                                            />
                                            <div
                                                className="h-full bg-rose-500 transition-all duration-700"
                                                style={{ width: `${100 - functionalPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Mobile stats */}
                                    <div className="md:hidden mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revisados</p>
                                            <p className="text-xl font-black text-slate-800">{qc.total}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">OK</p>
                                            <p className="text-xl font-black text-emerald-600">{qc.funcionales}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NO</p>
                                            <p className="text-xl font-black text-rose-600">{qc.noFuncionales}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla expandible de IMEIs */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-indigo-500" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                                    IMEIs revisados por {qc.name || qc.username}
                                                </p>
                                            </div>
                                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/50">
                                                        <TableRow className="hover:bg-transparent border-slate-100">
                                                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-6">#</TableHead>
                                                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">IMEI</TableHead>
                                                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dispositivo</TableHead>
                                                            <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Lote</TableHead>
                                                            <TableHead className="text-right text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-6">Veredicto</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {qc.equipos.map((eq, i) => (
                                                            <TableRow key={eq.id} className="hover:bg-slate-50 border-slate-50">
                                                                <TableCell className="font-mono text-[10px] text-slate-300 pl-6">{i + 1}</TableCell>
                                                                <TableCell>
                                                                    <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                                        {eq.imei}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-[11px] font-bold text-slate-700">
                                                                        {eq.deviceModel?.brand} {eq.deviceModel?.modelName}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-400 ml-1.5">
                                                                        {eq.deviceModel?.storageGb}GB
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {eq.loteCodigo ? (
                                                                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                            {eq.loteCodigo}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-300 italic">—</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right pr-6">
                                                                    <Badge
                                                                        className={cn(
                                                                            "rounded-lg px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border-none shadow-sm",
                                                                            eq.funcionalidad === 'Funcional'
                                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                                : 'bg-rose-100 text-rose-700'
                                                                        )}
                                                                    >
                                                                        {eq.funcionalidad}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : qcBreakdown.length === 0 ? (
                <Card className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/30 p-12">
                    <div className="text-center space-y-3">
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                            <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-lg font-bold text-slate-400">Aún no hay equipos revisados por QC</p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Cuando un técnico (QC) marque equipos como Funcionales o No Funcionales desde su lote,
                            aparecerán aquí agrupados.
                        </p>
                    </div>
                </Card>
            ) : (
                <Card className="rounded-[2rem] border border-slate-100 p-8">
                    <p className="text-center text-slate-400 font-bold italic">
                        Sin resultados para "{search}"
                    </p>
                </Card>
            )}

            {/* Banner de pendientes de revisión (sin asignar a lote) */}
            {pendingReview.total > 0 && (
                <Card className="rounded-[2rem] border-2 border-amber-200 bg-amber-50/40 overflow-hidden">
                    <div className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-amber-900 text-base">
                                {pendingReview.total} equipo{pendingReview.total !== 1 ? 's' : ''} revisado{pendingReview.total !== 1 ? 's' : ''} sin lote asignado
                            </p>
                            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mt-1">
                                No se pueden atribuir a un QC específico. Revisa el historial de estos IMEIs.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
                </div>
            )}
        </div>
    );
}

// === Sub-componentes locales ===

function SummaryStat({ icon, label, value, subtext, color }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    subtext?: string;
    color: 'indigo' | 'emerald' | 'rose' | 'amber';
}) {
    const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
        rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    };
    const c = colorMap[color];

    return (
        <Card className="rounded-[1.5rem] border border-slate-50 shadow-md shadow-slate-200/40 bg-white overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center gap-3">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", c.bg, c.text)}>
                        {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{label}</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{value}</p>
                        {subtext && (
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{subtext}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
