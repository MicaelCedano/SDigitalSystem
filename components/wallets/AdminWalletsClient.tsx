"use client";

import { useState } from "react";
import {
    Users, Plus, XCircle, Award, CheckCircle2,
    DollarSign, TrendingUp, User as UserIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addManualAccreditacion, deleteManualAccreditacion } from "@/app/actions/wallets";
import { useRouter } from "next/navigation";

interface AdminWalletsClientProps {
    initialData: any;
}

export function AdminWalletsClient({ initialData }: AdminWalletsClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // We parse basic data back from our server action shape
    // Notice how we must compute things as well
    const { tecnicos, wallets, historial, control_calidad_ganados } = initialData;

    const totalGanadoGlobal = control_calidad_ganados.reduce((sum: number, t: any) => sum + t.total_ganado, 0) || 1; // 1 to prevent div zero

    const handleAcreditar = async (e: React.FormEvent, tecnicoId: number) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem('monto') as HTMLInputElement;
        const monto = parseFloat(input.value);

        if (isNaN(monto) || monto <= 0) return toast.error("Monto inválido");

        setIsLoading(true);
        const res = await addManualAccreditacion(tecnicoId, monto);
        if (res.success) {
            toast.success("Acreditación exitosa");
            form.reset();
            router.refresh();
        } else {
            toast.error(res.error || "Error al acreditar");
        }
        setIsLoading(false);
    };

    const handleEliminar = async (transactionId: number) => {
        if (!confirm('¿Eliminar acreditación?')) return;
        setIsLoading(true);
        const res = await deleteManualAccreditacion(transactionId);
        if (res.success) {
            toast.success("Acreditación eliminada");
            router.refresh();
        } else {
            toast.error(res.error || "Error al eliminar acreditación");
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 slide-in-from-bottom-4">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
                        Gestión de <span className="bg-gradient-to-r from-indigo-600 to-[#5C67E6] bg-clip-text text-transparent">Wallets</span>
                    </h1>
                    <p className="text-slate-500 text-lg font-medium">
                        Administra saldos y realiza acreditaciones manuales al equipo.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="px-6 py-4 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-4">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none">Total Global</p>
                            <p className="text-xl font-black text-indigo-900 leading-none mt-1">RD$ {totalGanadoGlobal.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wallets Individuales */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Wallets Activas</h2>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Gestión individual</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {tecnicos.map((tecnico: any) => {
                        const h = historial[tecnico.id] || { retiros: [], acreditaciones_manuales: [] };
                        const saldo = wallets[tecnico.id] || 0;

                        return (
                            <div key={tecnico.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all duration-300">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex flex-col items-center sm:items-start min-w-[140px] border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-6">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400 mb-3 border-[3px] border-white shadow-sm ring-1 ring-slate-100">
                                            {(tecnico.name || tecnico.username)[0].toUpperCase()}
                                        </div>
                                        <h3 className="font-black text-[15px] text-slate-800 text-center sm:text-left leading-tight">
                                            {tecnico.name || tecnico.username}
                                        </h3>
                                        <div className="mt-4 text-center sm:text-left w-full">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Actual</span>
                                            <p className="text-[22px] font-black text-emerald-600 font-mono mt-0.5">
                                                RD$ {saldo.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                                                Acreditar Dinero Manual
                                            </label>
                                            <form onSubmit={(e) => handleAcreditar(e, tecnico.id)} className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    name="monto"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder="0.00"
                                                    required
                                                    className="flex-1 bg-white border-slate-200 h-10 font-mono text-sm"
                                                />
                                                <Button
                                                    type="submit"
                                                    className="bg-[#5C67E6] hover:bg-[#4E58D0] text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-indigo-200 flex gap-2"
                                                    disabled={isLoading}
                                                >
                                                    <Plus className="w-4 h-4" /> Acreditar
                                                </Button>
                                            </form>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Últimos Retiros / Pagos</span>
                                                <div className="space-y-2">
                                                    {h.retiros.length > 0 ? h.retiros.map((r: any, i: number) => (
                                                        <div key={i} className="flex flex-col text-[11px] bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
                                                            <div className="flex justify-between font-mono font-bold text-slate-700">
                                                                <span>RD$ {r.monto.toFixed(2)}</span>
                                                                <span className="text-slate-400 font-sans font-medium">{new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <p className="text-[11px] text-slate-400 font-medium italic">Sin retiros</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Acreditaciones Modificables</span>
                                                <div className="space-y-2">
                                                    {h.acreditaciones_manuales.length > 0 ? h.acreditaciones_manuales.map((m: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between text-[11px] bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl shadow-sm group">
                                                            <span className="font-mono font-bold text-indigo-700">+{m.monto.toFixed(2)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEliminar(m.id)}
                                                                disabled={isLoading}
                                                                className="text-slate-300 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 rounded-md p-1 opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-100"
                                                                title="Eliminar este crédito"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )) : (
                                                        <p className="text-[11px] text-slate-400 font-medium italic">Sin registros</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
