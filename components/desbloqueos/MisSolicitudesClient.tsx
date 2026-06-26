"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Lock,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Wallet,
    ChevronDown,
    Smartphone,
    MessageSquare
} from "lucide-react";
import Link from "next/link";

interface ImeiItem {
    imei: string;
    estado: string;
    motivo?: string | null;
}

interface Solicitud {
    id: number;
    codigo: string;
    estado: string;
    modelo: string | null;
    observacion: string | null;
    observacionQc: string | null;
    observacionAdmin: string | null;
    imeis: ImeiItem[];
    totalEquipos: number;
    equiposAprobados: number;
    equiposRechazados: number;
    montoPorEquipo: number;
    montoTotalPagado: number;
    fechaCreacion: string;
    fechaQc: string | null;
    fechaAdmin: string | null;
    qcName: string | null;
    adminName: string | null;
}

interface Props {
    initialSolicitudes: Solicitud[];
    currentUser: { id: number; name: string; role: string };
}

const estadoBadge = (estado: string) => {
    const map: Record<string, { label: string; class: string; icon: any }> = {
        "Pendiente QC": { label: "Pendiente QC", class: "bg-amber-100 text-amber-700", icon: Clock },
        "Pendiente Admin": { label: "Pendiente Admin", class: "bg-indigo-100 text-indigo-700", icon: AlertCircle },
        "Aprobado": { label: "Aprobado", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
        "Rechazado": { label: "Rechazado", class: "bg-rose-100 text-rose-700", icon: XCircle }
    };
    return map[estado] || { label: estado, class: "bg-slate-100 text-slate-700", icon: Clock };
};

const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-DO", {
        timeZone: "America/Santo_Domingo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

// Helper para color de chip de IMEI segun estado
const imeiChipClass = (estado: string) => {
    if (estado === "Aprobado") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (estado === "Rechazado") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-600 border-slate-200"; // Pendiente
};

export function MisSolicitudesClient({ initialSolicitudes, currentUser }: Props) {
    const [solicitudes] = useState(initialSolicitudes);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // stats
    const totalEquipos = solicitudes.reduce((acc, s) => acc + s.totalEquipos, 0);
    const totalAprobados = solicitudes.reduce((acc, s) => acc + s.equiposAprobados, 0);
    const totalGanado = solicitudes.reduce((acc, s) => acc + s.montoTotalPagado, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Lock size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                            Mis Solicitudes de Desbloqueo
                        </h1>
                        <p className="text-[11px] uppercase font-bold text-slate-500 tracking-[0.2em]">
                            {currentUser.name}
                        </p>
                    </div>
                </div>
                <Link href="/desbloqueos/nuevo">
                    <Button className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Solicitud
                    </Button>
                </Link>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Equipos Procesados</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{totalAprobados}</p>
                        <p className="text-xs text-slate-500 mt-1">de {totalEquipos} totales</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Solicitudes</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{solicitudes.length}</p>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-none shadow-xl shadow-emerald-100 bg-emerald-50">
                    <CardContent className="p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-1">
                            <Wallet size={12} /> Total Ganado
                        </p>
                        <p className="text-3xl font-black text-emerald-700 mt-1">
                            RD${totalGanado.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista */}
            {solicitudes.length === 0 ? (
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-12 text-center">
                        <Lock className="mx-auto text-slate-300" size={48} />
                        <h3 className="font-black text-lg text-slate-900 mt-4">No tienes solicitudes aún</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Crea tu primera solicitud de desbloqueo.
                        </p>
                        <Link href="/desbloqueos/nuevo" className="inline-block mt-4">
                            <Button className="h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                <Plus className="mr-2 h-4 w-4" /> Crear Solicitud
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {solicitudes.map(s => {
                        const badge = estadoBadge(s.estado);
                        const Icon = badge.icon;
                        const isExpanded = expandedId === s.id;
                        const montoProyectado = s.equiposAprobados * s.montoPorEquipo;
                        const pendientesDeRevision = s.totalEquipos - s.equiposAprobados - s.equiposRechazados;

                        return (
                            <Card key={s.id} className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                                {/* Header clickeable */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                                    aria-expanded={isExpanded}
                                    aria-controls={`solicitud-detalle-${s.id}`}
                                    className="w-full text-left p-5 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between flex-wrap gap-3">
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h3 className="font-black text-base text-slate-900">
                                                    {s.codigo}
                                                </h3>
                                                <Badge className={`${badge.class} rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider`}>
                                                    <Icon size={10} className="mr-1 inline" />
                                                    {badge.label}
                                                </Badge>
                                                {s.modelo && (
                                                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-0.5 text-[10px] font-black">
                                                        <Smartphone size={10} className="mr-1 inline" />
                                                        {s.modelo}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                <div>
                                                    <p className="text-slate-500">Total equipos</p>
                                                    <p className="font-bold text-slate-900">{s.totalEquipos}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Aprobados</p>
                                                    <p className="font-bold text-emerald-700">{s.equiposAprobados}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Rechazados</p>
                                                    <p className="font-bold text-rose-700">{s.equiposRechazados}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">
                                                        {s.estado === "Aprobado" ? "Pagado" : "Proyectado"}
                                                    </p>
                                                    <p className={`font-bold ${s.estado === "Aprobado" ? "text-slate-900" : "text-indigo-700"}`}>
                                                        RD${(s.estado === "Aprobado" ? s.montoTotalPagado : montoProyectado).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-3 space-y-0.5">
                                                <p>Creada: {formatDate(s.fechaCreacion)}</p>
                                                {s.fechaQc && <p>QC: {formatDate(s.fechaQc)} {s.qcName && `· ${s.qcName}`}</p>}
                                                {s.fechaAdmin && <p>Admin: {formatDate(s.fechaAdmin)} {s.adminName && `· ${s.adminName}`}</p>}
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={20}
                                            className={`text-slate-400 transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </button>

                                {/* Detalle expandible */}
                                {isExpanded && (
                                    <div
                                        id={`solicitud-detalle-${s.id}`}
                                        className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
                                    >
                                        {/* Lista de IMEIs */}
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                                                IMEIs ({s.imeis.length})
                                            </h4>
                                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                                                {s.imeis.map((item, idx) => (
                                                    <div
                                                        key={`${item.imei}-${idx}`}
                                                        className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-2 text-xs ${imeiChipClass(item.estado)}`}
                                                    >
                                                        <code className="font-mono font-bold">{item.imei}</code>
                                                        <div className="flex items-center gap-2">
                                                            {item.motivo && (
                                                                <span className="text-[10px] italic text-slate-500 max-w-[200px] truncate" title={item.motivo}>
                                                                    {item.motivo}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-black uppercase tracking-wider">
                                                                {item.estado}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {pendientesDeRevision > 0 && s.estado === "Pendiente QC" && (
                                                <p className="text-[11px] text-slate-500 mt-2 italic">
                                                    {pendientesDeRevision} IMEI{pendientesDeRevision === 1 ? "" : "s"} aún sin revisar por QC.
                                                </p>
                                            )}
                                        </div>

                                        {/* Observaciones */}
                                        {(s.observacion || s.observacionQc || s.observacionAdmin) && (
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1">
                                                    <MessageSquare size={11} /> Observaciones
                                                </h4>
                                                {s.observacion && (
                                                    <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-700">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                                                            Tu nota al crear
                                                        </span>
                                                        {s.observacion}
                                                    </div>
                                                )}
                                                {s.observacionQc && (
                                                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block mb-1">
                                                            QC {s.qcName && `· ${s.qcName}`}
                                                        </span>
                                                        {s.observacionQc}
                                                    </div>
                                                )}
                                                {s.observacionAdmin && (
                                                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                                                            Admin {s.adminName && `· ${s.adminName}`}
                                                        </span>
                                                        {s.observacionAdmin}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Resumen de pago si aprobado */}
                                        {s.estado === "Aprobado" && s.montoTotalPagado > 0 && (
                                            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 flex items-center gap-1 mb-1">
                                                    <Wallet size={11} /> Acreditado a tu wallet
                                                </p>
                                                <p className="text-2xl font-black text-emerald-700">
                                                    RD${s.montoTotalPagado.toFixed(2)}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    {s.equiposAprobados} equipo{s.equiposAprobados === 1 ? "" : "s"} × RD${s.montoPorEquipo}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
