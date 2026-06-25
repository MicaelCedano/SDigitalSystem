"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Lock, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { crearSolicitudDesbloqueo } from "@/app/actions/desbloqueos";
import Link from "next/link";

interface Props {
    currentUser: { id: number; name: string; role: string };
}

export function CrearSolicitudClient({ currentUser }: Props) {
    const router = useRouter();
    const [modelo, setModelo] = useState("");
    const [imeisText, setImeisText] = useState("");
    const [observacion, setObservacion] = useState("");
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

    // Parsear IMEIs desde el textarea (uno por línea o separados por comas/espacios)
    const imeisList = imeisText
        .split(/[\s,;\n\r]+/)
        .map(i => i.trim())
        .filter(i => i.length > 0);

    const duplicadosEnLista = (() => {
        const counts = new Map<string, number>();
        for (const i of imeisList) counts.set(i, (counts.get(i) || 0) + 1);
        const dup: string[] = [];
        for (const [imei, c] of Array.from(counts.entries())) if (c > 1) dup.push(imei);
        return dup;
    })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        if (!modelo.trim()) {
            setFeedback({ type: "err", msg: "Indica el modelo (ej. Vortex HD65 Ultra)" });
            return;
        }
        if (imeisList.length === 0) {
            setFeedback({ type: "err", msg: "Pega al menos un IMEI" });
            return;
        }
        if (duplicadosEnLista.length > 0) {
            setFeedback({ type: "err", msg: `Hay IMEIs repetidos: ${duplicadosEnLista.join(", ")}` });
            return;
        }

        startTransition(async () => {
            const res = await crearSolicitudDesbloqueo(imeisList, modelo.trim(), observacion.trim() || undefined);
            if (res.success) {
                setFeedback({ type: "ok", msg: res.message || "Solicitud creada" });
                setModelo("");
                setImeisText("");
                setObservacion("");
                setTimeout(() => router.push("/desbloqueos"), 1500);
            } else {
                setFeedback({ type: "err", msg: res.error || "Error al crear la solicitud" });
            }
        });
    };

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
                            Nueva Solicitud de Desbloqueo
                        </h1>
                        <p className="text-[11px] uppercase font-bold text-slate-500 tracking-[0.2em]">
                            Pago de RD$25 por equipo al ser aprobada
                        </p>
                    </div>
                </div>
                <Link href="/desbloqueos">
                    <Button variant="outline" className="h-11 rounded-2xl">
                        Ver mis solicitudes
                    </Button>
                </Link>
            </div>

            {/* Reglas */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-amber-50">
                <CardContent className="p-5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 mb-2">
                        Importante
                    </h3>
                    <ul className="text-sm text-amber-900 space-y-1">
                        <li>• El pago se acredita a tu wallet <strong>después</strong> de que el administrador acepte la solicitud.</li>
                        <li>• Una sola modelo por solicitud. Si son varios modelos, crea una solicitud por cada uno.</li>
                        <li>• No se permiten IMEIs repetidos en la misma lista.</li>
                        <li>• Si un IMEI ya está en otra solicitud pendiente, será rechazado.</li>
                        <li>• Si el IMEI ya fue desbloqueado antes, no se puede volver a desbloquear.</li>
                    </ul>
                </CardContent>
            </Card>

            {/* Form */}
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
                <CardHeader>
                    <CardTitle className="text-lg font-black tracking-tight">
                        Datos de la Solicitud
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                Modelo de los Equipos
                            </label>
                            <Input
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                placeholder="Ej. Vortex HD65 Ultra, iPhone 13, Samsung A54..."
                                className="rounded-2xl h-12"
                                disabled={isPending}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                Un solo modelo por solicitud (si son varios modelos, haz una solicitud por cada uno)
                            </p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                IMEIs Desbloqueados
                            </label>
                            <Textarea
                                value={imeisText}
                                onChange={(e) => setImeisText(e.target.value)}
                                placeholder={"Pega los IMEIs aquí, uno por línea o separados por comas.\nEjemplo:\n352109876543210\n352109876543211\n352109876543212"}
                                rows={10}
                                className="rounded-2xl font-mono text-sm"
                                disabled={isPending}
                            />
                            <div className="flex items-center justify-between mt-2 text-xs">
                                <span className="text-slate-500">
                                    {imeisList.length} IMEI{imeisList.length === 1 ? "" : "s"} detectado{imeisList.length === 1 ? "" : "s"}
                                </span>
                                {duplicadosEnLista.length > 0 && (
                                    <span className="text-rose-600 font-bold flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {duplicadosEnLista.length} repetido{duplicadosEnLista.length === 1 ? "" : "s"}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">
                                Observación (opcional)
                            </label>
                            <Textarea
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                placeholder="Notas adicionales, lote, etc."
                                rows={2}
                                className="rounded-2xl"
                                disabled={isPending}
                            />
                        </div>

                        {/* Resumen */}
                        {imeisList.length > 0 && (
                            <div className="rounded-2xl bg-indigo-50 p-4 space-y-1">
                                <p className="text-sm text-indigo-900">
                                    <strong>{imeisList.length}</strong> equipo{imeisList.length === 1 ? "" : "s"} en esta solicitud
                                </p>
                                <p className="text-xs text-indigo-700">
                                    A pagar al técnico al aprobarse: <strong>RD${(imeisList.length * 25).toFixed(2)}</strong>
                                    <br />
                                    A pagar al QC que revise: <strong>RD${(imeisList.length * 25).toFixed(2)}</strong>
                                </p>
                            </div>
                        )}

                        {feedback && (
                            <div
                                className={`rounded-2xl p-4 flex items-start gap-3 ${
                                    feedback.type === "ok"
                                        ? "bg-emerald-50 text-emerald-900"
                                        : "bg-rose-50 text-rose-900"
                                }`}
                            >
                                {feedback.type === "ok" ? (
                                    <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                )}
                                <p className="text-sm font-medium">{feedback.msg}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isPending || imeisList.length === 0 || duplicadosEnLista.length > 0}
                            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider text-sm shadow-lg shadow-indigo-200"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Enviar Solicitud
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
