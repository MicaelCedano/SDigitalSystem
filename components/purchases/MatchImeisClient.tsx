"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, ClipboardCheck, Smartphone, CheckCircle2,
    XCircle, AlertCircle, Fingerprint, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function MatchImeisClient({ purchase }: { purchase: any }) {
    const [imeisInput, setImeisInput] = useState("");
    const [results, setResults] = useState<any>(null);

    const handleMatch = () => {
        // 1. Clean input
        const rawImeis = imeisInput.split(/[\s,]+/).map(i => i.trim()).filter(Boolean);
        const imeisFisicos = Array.from(new Set(rawImeis)); // unique

        if (imeisFisicos.length === 0) {
            setResults(null);
            return;
        }

        // 2. Map database 
        const todosEquiposMap = new Map(purchase.equipos.map((e: any) => [e.imei, e]));
        const imeisDbSet = new Set(purchase.equipos.map((e: any) => e.imei));

        // 3. Compare Lists
        const matches: any[] = [];
        const extraFisicos: any[] = [];
        const missingFisicos: any[] = [];

        // Check physical ones
        imeisFisicos.forEach(imei => {
            if (imeisDbSet.has(imei)) {
                matches.push(todosEquiposMap.get(imei));
            } else {
                extraFisicos.push({ 
                    imei, 
                    motivo: "No registrado en esta compra", 
                    estado_actual: "Desconocido" 
                });
            }
        });

        // Check missing in physical
        purchase.equipos.forEach((eq: any) => {
            if (!imeisFisicos.includes(eq.imei)) {
                missingFisicos.push(eq);
            }
        });

        // Save state
        setResults({
            matches,
            extraFisicos,
            missingFisicos,
            totalFisicos: imeisFisicos.length,
            totalDb: purchase.equipos.length
        });
    };

    return (
        <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-7xl mx-auto px-4 md:px-0 mt-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" />
                <div className="space-y-4 relative z-10 w-full">
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href={`/compras/${purchase.id}`}>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">Verificador Físico</h1>
                            </div>
                            <p className="text-slate-500 font-medium text-sm md:text-base mt-2 ml-14">
                                Compra #{purchase.id} • Pega los IMEIs físicos para compararlos con los equipos funcionales del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {!results ? (
                /* INGRESO DE DATOS */
                <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white max-w-4xl mx-auto">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                        <Smartphone className="w-5 h-5 text-indigo-500" />
                        Lista de IMEIs Físicos (Pistola/Escáner)
                    </h3>
                    <Textarea
                        placeholder="Pega los IMEIs aquí. Puedes separarlos por espacios, comas o saltos de línea..."
                        className="min-h-[300px] text-lg font-mono bg-slate-50 border-slate-200 rounded-2xl p-6 focus-visible:ring-indigo-500/20 shadow-sm transition-all"
                        value={imeisInput}
                        onChange={(e) => setImeisInput(e.target.value)}
                    />
                    <div className="mt-6 flex justify-end">
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-10 text-lg font-bold shadow-xl shadow-indigo-100"
                            onClick={handleMatch}
                            disabled={!imeisInput.trim()}
                        >
                            <ClipboardCheck className="w-5 h-5 mr-2" />
                            Verificar Coincidencias
                        </Button>
                    </div>
                </Card>
            ) : (
                /* RESULTADOS */
                <div className="space-y-8 animate-in slide-in-from-bottom-8">
                    {/* Tarjetas Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-6 rounded-3xl border-none shadow-lg bg-emerald-50 relative overflow-hidden">
                            <CheckCircle2 className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-500 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Coincidencias (OK)</p>
                            <p className="text-4xl font-black text-emerald-600">{results.matches.length}</p>
                        </Card>
                        <Card className="p-6 rounded-3xl border-none shadow-lg bg-indigo-50 relative overflow-hidden">
                            <Fingerprint className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-500 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60 mb-1">Total Ingresados</p>
                            <p className="text-4xl font-black text-indigo-600">{results.totalFisicos}</p>
                        </Card>
                        <Card className="p-6 rounded-3xl border-none shadow-lg bg-amber-50 relative overflow-hidden">
                            <Layers className="absolute -bottom-4 -right-4 w-24 h-24 text-amber-500 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60 mb-1">Faltan en físico</p>
                            <p className="text-4xl font-black text-amber-600">{results.missingFisicos.length}</p>
                        </Card>
                        <Card className="p-6 rounded-3xl border-none shadow-lg bg-rose-50 relative overflow-hidden">
                            <AlertCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-500 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/60 mb-1">Erróneos / Extras</p>
                            <p className="text-4xl font-black text-rose-600">{results.extraFisicos.length}</p>
                        </Card>
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-500 font-bold ml-4">Total de equipos registrados en esta compra: <strong className="text-indigo-600">{results.totalDb}</strong></p>
                        <Button variant="outline" onClick={() => setResults(null)} className="rounded-xl border-slate-200">
                            Hacer otra verificación
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* LEFT COLUMN: Errores y Faltantes */}
                        <div className="lg:col-span-1 space-y-8">

                            {/* Extras / Erróneos */}
                            <div className="bg-white rounded-3xl shadow-xl border border-rose-50 p-6 overflow-hidden">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                    No pertenecen a esta compra
                                    <Badge className="ml-auto bg-rose-100 text-rose-700 hover:bg-rose-100">{results.extraFisicos.length}</Badge>
                                </h3>

                                {results.extraFisicos.length > 0 ? (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {results.extraFisicos.map((e: any, i: number) => (
                                            <div key={i} className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/50">
                                                <p className="font-mono font-bold text-slate-800 mb-1">{e.imei}</p>
                                                <p className="text-xs text-rose-600 font-bold mb-1">{e.motivo}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic text-sm text-center py-4">Sin equipos sobrantes o de otras compras.</p>
                                )}
                            </div>

                            {/* Missing */}
                            <div className="bg-white rounded-3xl shadow-xl border border-amber-50 p-6 overflow-hidden">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
                                    <Layers className="w-5 h-5 text-amber-500" />
                                    Pendientes de escaneo físico
                                    <Badge className="ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100">{results.missingFisicos.length}</Badge>
                                </h3>

                                {results.missingFisicos.length > 0 ? (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                        {results.missingFisicos.map((eq: any, i: number) => (
                                            <div key={i} className="bg-amber-50/30 p-3 rounded-xl border border-amber-50">
                                                <p className="font-mono font-bold text-slate-800 text-sm mb-0.5">{eq.imei}</p>
                                                <p className="text-xs font-bold text-slate-600 truncate">
                                                    {eq.deviceModel?.brand} {eq.deviceModel?.modelName} {eq.modelo}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic text-sm text-center py-4">Escaneaste todos los disponibles en sistema.</p>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Matches */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-3xl shadow-xl border border-emerald-50 p-6 overflow-hidden">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    Coincidencias de esta compra
                                    <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-lg py-1 px-3 hover:bg-emerald-100">{results.matches.length}</Badge>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[850px] overflow-y-auto pr-2">
                                    {results.matches.map((eq: any, i: number) => (
                                        <div key={i} className="flex flex-col bg-slate-50 border border-slate-100 p-3.5 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <p className="font-bold text-slate-800 text-sm leading-tight">
                                                    {eq.deviceModel?.brand} {eq.deviceModel?.modelName} {eq.modelo}
                                                </p>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge className={eq.funcionalidad === 'Funcional' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700' + " tracking-widest font-black text-[9px] uppercase hover:opacity-100"}>
                                                        {eq.funcionalidad || 'Sin Revisar'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[8px] font-bold border-slate-200 text-slate-500 bg-white">
                                                        {eq.estado}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <p className="font-mono font-bold text-slate-600 text-xs">{eq.imei}</p>
                                            <div className="flex gap-2 mt-2">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white rounded px-1.5 py-0.5 border border-slate-100">
                                                    {eq.color || 'N/A'} • {eq.storageGb || eq.deviceModel?.storageGb || '?'}GB
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {results.matches.length === 0 && (
                                        <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">
                                            Ningún IMEI escaneado coincidió con un equipo en el sistema.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

