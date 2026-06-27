"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, XCircle, Loader2, User, DollarSign, Clock } from "lucide-react";
import { adminAceptarSolicitud } from "@/app/actions/desbloqueos";

interface ImeiItem {
    imei: string;
    estado: string;
    motivo: string | null;
}

interface SolicitudPendiente {
    id: number;
    codigo: string;
    modelo: string | null;
    observacion: string | null;
    observacionQc: string | null;
    imeis: ImeiItem[];
    totalEquipos: number;
    equiposAprobados: number;
    equiposRechazados: number;
    montoPorEquipo: number;
    fechaCreacion: string;
    fechaQc: string | null;
    tecnico: { id: number; name: string; username: string; profileImage: string | null };
    qc: { id: number; name: string } | null;
}

interface SolicitudReciente {
    id: number;
    codigo: string;
    estado: string;
    equiposAprobados: number;
    montoTotalPagado: number;
    fechaAdmin: string | null;
    tecnicoName: string;
    adminName: string | null;
}

interface Props {
    pendientes: SolicitudPendiente[];
    recientes: SolicitudReciente[];
}

export function AdminDesbloqueosClient({ pendientes, recientes }: Props) {
    const router = useRouter();
    const [items, setItems] = useState(pendientes);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [observacionAdmin, setObservacionAdmin] = useState("");
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [confirmaAccion, setConfirmaAccion] = useState<{ id: number; accion: "aceptar" | "rechazar" } | null>(null);

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

    const getImageUrl = (img: string | null) => {
        if (!img) return null;
        if (img.startsWith("http")) return img;
        const filename = img.split(/[/\\]/).pop();
        return `/profile_images/${filename}`;
    };

    const handleAccion = (id: number, accion: "aceptar" | "rechazar") => {
        setError(null);
        if (accion === "rechazar" && !observacionAdmin.trim()) {
            setError("Indica un motivo del rechazo en la observación");
            return;
        }
        setPendingId(id);
        startTransition(async () => {
            const res = await adminAceptarSolicitud(id, accion, observacionAdmin.trim() || undefined);
            if (res.success) {
                setItems(prev => prev.filter(s => s.id !== id));
                setExpandedId(null);
                setObservacionAdmin("");
                setConfirmaAccion(null);
                router.refresh();
            } else {
                setError(res.error || "Error al procesar");
            }
            setPendingId(null);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <Lock size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                        Aceptar Desbloqueos
                    </h1>
                    <p className="text-[11px] uppercase font-bold text-slate-500 tracking-[0.2em]">
                        {items.length} solicitud{items.length === 1 ? "" : "es"} esperando tu aprobación
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-900">
                    {error}
                </div>
            )}

            {items.length === 0 ? (
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                    <CardContent className="p-12 text-center">
                        <CheckCircle2 className="mx-auto text-emerald-300" size={48} />
                        <h3 className="font-black text-lg text-slate-900 mt-4">No hay solicitudes esperando</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Cuando un técnico cree una solicitud de desbloqueo aparecerá acá para tu aprobación.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {items.map(s => {
                        const isExpanded = expandedId === s.id;
                        // 2026-06-27: ya no hay paso de QC. Al aceptar, se pagan
                        // TODOS los IMEIs (no rechazados) × RD$25 al técnico.
                        const totalEquiposValidos = s.imeis.filter((i: ImeiItem) => i.estado !== "Rechazado").length;
                        const totalPago = totalEquiposValidos * s.montoPorEquipo;

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
                                                    Técnico: {s.tecnico.name}
                                                    {" · "}
                                                    {formatDate(s.fechaCreacion)}
                                                </p>
                                                {s.modelo && (
                                                    <p className="text-xs font-bold text-indigo-700 mt-0.5">
                                                        Modelo: {s.modelo}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-0.5 text-[10px] font-black uppercase">
                                                {totalEquiposValidos} IMEI{totalEquiposValidos === 1 ? "" : "s"}
                                            </Badge>
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : s.id); }}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                {isExpanded ? "Cerrar" : "Ver"}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent className="space-y-4">
                                        {s.observacion && (
                                            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                                                <strong>Obs. técnico:</strong> {s.observacion}
                                            </div>
                                        )}

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                            {s.imeis.map(item => (
                                                <div
                                                    key={item.imei}
                                                    className="rounded-xl p-3 flex items-center justify-between gap-3 bg-slate-50"
                                                >
                                                    <code className="font-mono text-sm font-bold text-slate-900">
                                                        {item.imei}
                                                    </code>
                                                    <Badge className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-[10px] font-black">
                                                        {item.estado}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Resumen pago */}
                                        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-indigo-50 p-4 space-y-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 flex items-center gap-1">
                                                <DollarSign size={12} /> Resumen de Pago al Aceptar
                                            </h4>
                                            <div>
                                                <p className="text-slate-600 text-xs">Se pagará al técnico</p>
                                                <p className="text-3xl font-black text-emerald-700">
                                                    RD${totalPago.toFixed(2)}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {totalEquiposValidos} × RD${s.montoPorEquipo}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-200">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                                    Total a dispersar al aceptar
                                                </p>
                                                <p className="text-xl font-black text-slate-900">
                                                    RD${totalPago.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                                Observación admin (opcional salvo rechazo)
                                            </label>
                                            <Textarea
                                                value={observacionAdmin}
                                                onChange={(e) => setObservacionAdmin(e.target.value)}
                                                rows={2}
                                                className="rounded-2xl"
                                                placeholder="Motivo de rechazo, notas..."
                                            />
                                        </div>

                                        {confirmaAccion?.id === s.id ? (
                                            <div className="rounded-2xl bg-amber-50 p-4 space-y-3">
                                                <p className="text-sm font-bold text-amber-900">
                                                    ¿Confirmas {confirmaAccion.accion === "aceptar" ? "ACEPTAR" : "RECHAZAR"} esta solicitud?
                                                </p>
                                                {confirmaAccion.accion === "aceptar" && (
                                                    <p className="text-xs text-amber-800">
                                                        Se pagará <strong>RD${totalPago.toFixed(2)}</strong> al técnico y se crearán <strong>{totalEquiposValidos}</strong> registros en UnlockRecord (anti-doble-pago).
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => setConfirmaAccion(null)}
                                                        variant="outline"
                                                        className="flex-1 rounded-xl"
                                                        disabled={isPending}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleAccion(s.id, confirmaAccion.accion)}
                                                        disabled={isPending}
                                                        className={`flex-1 rounded-xl text-white font-bold ${
                                                            confirmaAccion.accion === "aceptar"
                                                                ? "bg-emerald-600 hover:bg-emerald-700"
                                                                : "bg-rose-600 hover:bg-rose-700"
                                                        }`}
                                                    >
                                                        {isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : confirmaAccion.accion === "aceptar" ? (
                                                            "Confirmar Aceptar"
                                                        ) : (
                                                            "Confirmar Rechazar"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    onClick={() => setConfirmaAccion({ id: s.id, accion: "rechazar" })}
                                                    disabled={isPending}
                                                    variant="outline"
                                                    className="h-12 rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 font-bold"
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Rechazar
                                                </Button>
                                                <Button
                                                    onClick={() => setConfirmaAccion({ id: s.id, accion: "aceptar" })}
                                                    disabled={isPending || totalEquiposValidos === 0}
                                                    className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider"
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Aceptar y Pagar
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Historial reciente */}
            {recientes.length > 0 && (
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                            <Clock size={18} />
                            Últimas decisiones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recientes.map(s => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100"
                                >
                                    <div>
                                        <p className="font-mono text-sm font-bold text-slate-900">{s.codigo}</p>
                                        <p className="text-xs text-slate-500">
                                            {s.tecnicoName} · {s.equiposAprobados} aprobado(s) · {formatDate(s.fechaAdmin)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Badge
                                            className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${
                                                s.estado === "Aprobado"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-rose-100 text-rose-700"
                                            }`}
                                        >
                                            {s.estado}
                                        </Badge>
                                        {s.estado === "Aprobado" && (
                                            <p className="text-xs font-bold text-emerald-700 mt-1">
                                                RD${s.montoTotalPagado.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
