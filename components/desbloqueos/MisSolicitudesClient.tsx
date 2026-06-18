"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Wallet } from "lucide-react";
import Link from "next/link";

interface Solicitud {
    id: number;
    codigo: string;
    estado: string;
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

export function MisSolicitudesClient({ initialSolicitudes, currentUser }: Props) {
    const solicitudes = initialSolicitudes;

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
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Solicitud
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {solicitudes.map(s => {
                        const badge = estadoBadge(s.estado);
                        const Icon = badge.icon;
                        return (
                            <Card key={s.id} className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between flex-wrap gap-3">
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-black text-base text-slate-900">
                                                    {s.codigo}
                                                </h3>
                                                <Badge className={`${badge.class} rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider`}>
                                                    <Icon size={10} className="mr-1 inline" />
                                                    {badge.label}
                                                </Badge>
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
                                                    <p className="text-slate-500">Pagado</p>
                                                    <p className="font-bold text-slate-900">
                                                        RD${s.montoTotalPagado.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-3 space-y-0.5">
                                                <p>Creada: {formatDate(s.fechaCreacion)}</p>
                                                {s.fechaQc && <p>QC: {formatDate(s.fechaQc)} {s.qcName && `· ${s.qcName}`}</p>}
                                                {s.fechaAdmin && <p>Admin: {formatDate(s.fechaAdmin)} {s.adminName && `· ${s.adminName}`}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
