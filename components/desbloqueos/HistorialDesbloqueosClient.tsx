"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Lock,
    User,
    ShieldCheck,
    UserCog,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    Hash,
    Smartphone,
    ExternalLink,
    Wallet
} from "lucide-react";
import { buscarUnlockPorImei } from "@/app/actions/desbloqueos";
import Link from "next/link";

interface UnlockResult {
    imei: string;
    modelo: string | null;
    createdAt: string;
    paidAt: string | null;
    solicitudId: number;
    solicitudCodigo: string;
    tecnico: { id: number; name: string; username: string } | null;
    qc: { id: number; name: string; username: string } | null;
    admin: { id: number; name: string; username: string } | null;
}

export function HistorialDesbloqueosClient() {
    const [imei, setImei] = useState("");
    const [result, setResult] = useState<UnlockResult | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleBuscar = () => {
        const trimmed = imei.trim();
        if (!trimmed) {
            setError("Pegá un IMEI para buscar");
            setResult(null);
            setNotFound(false);
            return;
        }
        setError(null);
        setResult(null);
        setNotFound(false);
        startTransition(async () => {
            const res = await buscarUnlockPorImei(trimmed);
            if (!res.success) {
                setError(res.error || "Error desconocido");
                return;
            }
            if (!res.record) {
                setNotFound(true);
                return;
            }
            setResult(res.record);
        });
    };

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleBuscar();
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

    return (
        <div className="space-y-6 px-4 md:px-0">
            {/* Header de sección */}
            <div className="flex items-center gap-3 px-0 md:px-4">
                <div className="p-2 bg-slate-900 rounded-xl text-white shrink-0">
                    <Search className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                        Historial de Desbloqueos por IMEI
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                        Pegá un IMEI y mirá quién lo desbloqueó, quién lo aprobó y cuándo se pagó.
                    </p>
                </div>
            </div>

            {/* Buscador */}
            <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white">
                <CardContent className="p-4 md:p-8">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                value={imei}
                                onChange={(e) => setImei(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="IMEI (15 dígitos)"
                                className="h-14 pl-12 pr-4 rounded-2xl border-slate-200 text-base font-mono tracking-wider"
                                inputMode="numeric"
                                autoComplete="off"
                            />
                        </div>
                        <Button
                            onClick={handleBuscar}
                            disabled={isPending}
                            className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Buscando
                                </>
                            ) : (
                                <>
                                    <Search className="h-5 w-5 mr-2" />
                                    Buscar
                                </>
                            )}
                        </Button>
                    </div>
                    {error && (
                        <p className="text-sm text-rose-600 font-semibold mt-3 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {error}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Empty state inicial */}
            {!result && !notFound && !error && (
                <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl shadow-slate-100/50 bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-8 md:p-12 text-center">
                        <div className="inline-flex p-4 bg-slate-100 rounded-2xl mb-4">
                            <Lock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 tracking-tight">
                            Buscá un IMEI para ver su historial
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                            Funciona para IMEIs que ya fueron aprobados y pagados. Si la solicitud
                            aún está pendiente, no aparecerá acá.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Not found */}
            {notFound && (
                <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl shadow-amber-100/50 bg-gradient-to-br from-amber-50 to-white">
                    <CardContent className="p-8 md:p-10">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-100 rounded-2xl shrink-0">
                                <XCircle className="h-7 w-7 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                                    Este IMEI no fue desbloqueado nunca
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    <span className="font-mono font-bold text-slate-800">{imei.trim()}</span>{" "}
                                    no tiene un UnlockRecord. Puede que la solicitud esté pendiente
                                    de aprobación, o que nunca se haya pedido el desbloqueo.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link href="/admin/desbloqueos">
                                        <Button variant="outline" className="rounded-xl h-11">
                                            Ver solicitudes pendientes
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Resultado */}
            {result && (
                <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl shadow-emerald-100/50 bg-white overflow-hidden">
                    {/* Banda superior con estado */}
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 md:px-8 py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-white shrink-0" />
                            <h2 className="text-base md:text-lg font-black text-white tracking-tight truncate">
                                IMEI desbloqueado y pagado
                            </h2>
                        </div>
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-emerald-100 shrink-0">
                            {result.paidAt ? "Pagado" : "Aprobado sin pago"}
                        </span>
                    </div>

                    <CardContent className="p-4 md:p-8 space-y-6">
                        {/* IMEI + modelo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                                    <Hash className="h-3 w-3" />
                                    IMEI
                                </div>
                                <p className="font-mono text-base font-bold text-slate-800 break-all">
                                    {result.imei}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                                    <Smartphone className="h-3 w-3" />
                                    Modelo
                                </div>
                                <p className="text-base font-bold text-slate-800 truncate">
                                    {result.modelo || "—"}
                                </p>
                            </div>
                        </div>

                        {/* Quiénes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            {/* Técnico que pidió */}
                            <div className="bg-indigo-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">
                                    <User className="h-3 w-3" />
                                    Técnico
                                </div>
                                <p className="text-base font-black text-slate-800 truncate">
                                    {result.tecnico?.name || "—"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    @{result.tecnico?.username || "—"}
                                </p>
                            </div>

                            {/* QC que revisó (si aplica) */}
                            <div className="bg-amber-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">
                                    <ShieldCheck className="h-3 w-3" />
                                    QC que revisó
                                </div>
                                <p className="text-base font-black text-slate-800 truncate">
                                    {result.qc?.name || "Sin QC"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    {result.qc
                                        ? `@${result.qc.username}`
                                        : "Solicitud post 27-06-2026"}
                                </p>
                            </div>

                            {/* Admin que aprobó */}
                            <div className="bg-emerald-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">
                                    <UserCog className="h-3 w-3" />
                                    Aprobado por
                                </div>
                                <p className="text-base font-black text-slate-800 truncate">
                                    {result.admin?.name || "—"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    @{result.admin?.username || "—"}
                                </p>
                            </div>
                        </div>

                        {/* Fechas + link a solicitud */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div className="border border-slate-100 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                                    <Calendar className="h-3 w-3" />
                                    Fecha de creación
                                </div>
                                <p className="text-sm font-bold text-slate-700">
                                    {formatDate(result.createdAt)}
                                </p>
                            </div>
                            <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1.5">
                                    <Wallet className="h-3 w-3" />
                                    Fecha de pago
                                </div>
                                <p className="text-sm font-bold text-slate-700">
                                    {formatDate(result.paidAt)}
                                </p>
                            </div>
                        </div>

                        {/* Link a solicitud */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                                    Solicitud origen
                                </p>
                                <p className="font-mono text-sm font-bold text-slate-700">
                                    {result.solicitudCodigo}
                                </p>
                            </div>
                            <Link href="/admin/desbloqueos">
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver en Aprobar Desbloqueos
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
