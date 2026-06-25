"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, CheckCircle2, XCircle, Loader2, Clock, User } from "lucide-react";
import { qcRevisarSolicitud } from "@/app/actions/desbloqueos";

interface ImeiItem {
    imei: string;
    estado: string;
    motivo: string | null;
}

interface Solicitud {
    id: number;
    codigo: string;
    modelo: string | null;
    observacion: string | null;
    imeis: ImeiItem[];
    estado: string;
    totalEquipos: number;
    fechaCreacion: string;
    tecnico: { id: number; name: string; username: string; profileImage: string | null };
}

interface Props {
    initialSolicitudes: Solicitud[];
}

export function QCDesbloqueosClient({ initialSolicitudes }: Props) {
    const router = useRouter();
    const [solicitudes, setSolicitudes] = useState(initialSolicitudes);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [decisiones, setDecisiones] = useState<Record<string, { aprobado: boolean; motivo: string }>>({});
    const [observacionQc, setObservacionQc] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleString("es-DO", {
            timeZone: "America/Santo_Domingo",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    const getImageUrl = (img: string | null) => {
        if (!img) return null;
        if (img.startsWith("http")) return img;
        const filename = img.split(/[/\\]/).pop();
        return `/profile_images/${filename}`;
    };

    const handleDecision = (imei: string, aprobado: boolean) => {
        setDecisiones(prev => ({
            ...prev,
            [imei]: { aprobado, motivo: prev[imei]?.motivo || "" }
        }));
    };

    const handleMotivo = (imei: string, motivo: string) => {
        setDecisiones(prev => ({
            ...prev,
            [imei]: { aprobado: prev[imei]?.aprobado ?? true, motivo }
        }));
    };

    const aprobarTodos = (solicitud: Solicitud) => {
        const all: Record<string, { aprobado: boolean; motivo: string }> = {};
        for (const item of solicitud.imeis) {
            all[item.imei] = { aprobado: true, motivo: "" };
        }
        setDecisiones(all);
    };

    const rechazarTodos = (solicitud: Solicitud) => {
        const all: Record<string, { aprobado: boolean; motivo: string }> = {};
        for (const item of solicitud.imeis) {
            all[item.imei] = { aprobado: false, motivo: "Rechazado por QC" };
        }
        setDecisiones(all);
    };

    const handleSubmit = (solicitud: Solicitud) => {
        setError(null);
        const items = solicitud.imeis.map(i => ({
            imei: i.imei,
            aprobado: decisiones[i.imei]?.aprobado ?? false,
            motivo: decisiones[i.imei]?.motivo || undefined
        }));

        const hayAprobados = items.some(i => i.aprobado);
        const hayRechazados = items.some(i => !i.aprobado);

        if (!hayAprobados && !hayRechazados) {
            setError("Marca al menos un IMEI");
            return;
        }

        startTransition(async () => {
            const res = await qcRevisarSolicitud(solicitud.id, items, observacionQc.trim() || undefined);
            if (res.success) {
                setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
                setExpandedId(null);
                setDecisiones({});
                setObservacionQc("");
                router.refresh();
            } else {
                setError(res.error || "Error al enviar revisión");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Lock size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                        Cola de Desbloqueos
                    </h1>
                    <p className="text-[11px] uppercase font-bold text-slate-500 tracking-[0.2em]">
                        {solicitudes.length} solicitud{solicitudes.length === 1 ? "" : "es"} pendiente{solicitudes.length === 1 ? "" : "s"} de revisión
                    </p>
                </div>
            </div>

            {solicitudes.length === 0 ? (
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-12 text-center">
                        <CheckCircle2 className="mx-auto text-emerald-300" size={48} />
                        <h3 className="font-black text-lg text-slate-900 mt-4">No hay solicitudes pendientes</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Cuando los técnicos envíen solicitudes de desbloqueo aparecerán aquí.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {solicitudes.map(s => {
                        const isExpanded = expandedId === s.id;
                        const allDecided = s.imeis.every(i => decisiones[i.imei] !== undefined);
                        const aprobados = s.imeis.filter(i => decisiones[i.imei]?.aprobado).length;
                        const rechazados = s.imeis.filter(i => decisiones[i.imei] && !decisiones[i.imei].aprobado).length;

                        return (
                            <Card key={s.id} className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                                <CardHeader
                                    className="cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                                >
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            {getImageUrl(s.tecnico.profileImage) ? (
                                                <img
                                                    src={getImageUrl(s.tecnico.profileImage)!}
                                                    alt={s.tecnico.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                    <User size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <CardTitle className="text-base font-black text-slate-900">
                                                    {s.codigo}
                                                </CardTitle>
                                                <p className="text-xs text-slate-500">
                                                    {s.tecnico.name} · {s.totalEquipos} equipo{s.totalEquipos === 1 ? "" : "s"} ·{" "}
                                                    {formatDate(s.fechaCreacion)}
                                                </p>
                                                {s.modelo && (
                                                    <p className="text-xs font-bold text-indigo-700 mt-0.5">
                                                        Modelo: {s.modelo}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isExpanded && (
                                                <>
                                                    <Button
                                                        onClick={(e) => { e.stopPropagation(); aprobarTodos(s); }}
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl text-emerald-700 border-emerald-200"
                                                    >
                                                        Aprobar todos
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => { e.stopPropagation(); rechazarTodos(s); }}
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl text-rose-700 border-rose-200"
                                                    >
                                                        Rechazar todos
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : s.id); }}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                {isExpanded ? "Cerrar" : "Revisar"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent className="space-y-4">
                                        {s.observacion && (
                                            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                                                <strong>Observación del técnico:</strong> {s.observacion}
                                            </div>
                                        )}

                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {s.imeis.map(item => {
                                                const dec = decisiones[item.imei];
                                                const aprobado = dec?.aprobado;
                                                return (
                                                    <div
                                                        key={item.imei}
                                                        className={`rounded-2xl p-3 border-2 transition-all ${
                                                            aprobado === true
                                                                ? "bg-emerald-50 border-emerald-200"
                                                                : aprobado === false
                                                                ? "bg-rose-50 border-rose-200"
                                                                : "bg-slate-50 border-slate-200"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                                            <code className="font-mono text-sm font-bold text-slate-900">
                                                                {item.imei}
                                                            </code>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    onClick={() => handleDecision(item.imei, true)}
                                                                    size="sm"
                                                                    className={`rounded-xl h-9 ${
                                                                        aprobado === true
                                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                            : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                                                                    }`}
                                                                >
                                                                    <CheckCircle2 size={14} className="mr-1" />
                                                                    Aprobar
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDecision(item.imei, false)}
                                                                    size="sm"
                                                                    className={`rounded-xl h-9 ${
                                                                        aprobado === false
                                                                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                                                                            : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                                                                    }`}
                                                                >
                                                                    <XCircle size={14} className="mr-1" />
                                                                    Rechazar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {aprobado === false && (
                                                            <input
                                                                type="text"
                                                                placeholder="Motivo del rechazo (opcional)"
                                                                value={dec?.motivo || ""}
                                                                onChange={(e) => handleMotivo(item.imei, e.target.value)}
                                                                className="mt-2 w-full text-sm rounded-xl border border-rose-200 px-3 py-2 bg-white"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                                Observación general (opcional)
                                            </label>
                                            <Textarea
                                                value={observacionQc}
                                                onChange={(e) => setObservacionQc(e.target.value)}
                                                rows={2}
                                                className="rounded-2xl"
                                                placeholder="Notas para el administrador..."
                                            />
                                        </div>

                                        {error && (
                                            <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-900">
                                                {error}
                                            </div>
                                        )}

                                        {allDecided && (
                                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                                                Resumen: <strong className="text-emerald-700">{aprobados} aprobado(s)</strong>,{" "}
                                                <strong className="text-rose-700">{rechazados} rechazado(s)</strong>
                                            </div>
                                        )}

                                        <Button
                                            onClick={() => handleSubmit(s)}
                                            disabled={isPending || !allDecided}
                                            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-sm"
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    Enviar Revisión a Admin
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
