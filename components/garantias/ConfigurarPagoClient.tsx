"use client";

import { useState } from "react";
import {
    Settings, ArrowLeft, Save,
    Smartphone, User, Mail, Shield, Check, X,
    DollarSign, AlertCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatDateTime } from "@/lib/utils";
import { saveConfiguracionPago } from "@/app/actions/garantias";

export function ConfigurarPagoClient({ tecnico, currentConfig }: any) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [monto, setMonto] = useState(currentConfig?.montoPorReparacion?.toString() || "50.00");
    const [activo, setActivo] = useState(currentConfig ? currentConfig.activo : true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await saveConfiguracionPago(tecnico.id, {
                montoPorReparacion: parseFloat(monto),
                activo
            });

            if (res && res.success) {
                toast.success("Configuración guardada exitosamente");
                router.push("/garantias/pagos");
                router.refresh();
            } else {
                toast.error(res?.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/garantias/pagos">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Configurar Pago
                        </h1>
                        <p className="text-slate-400 font-bold flex items-center gap-2">
                            {tecnico.name || tecnico.username}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="md:col-span-2">
                    <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl font-black flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                Parámetros de Retribución
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                                        Monto por Reparación Exitosa (RD$)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <span className="text-slate-300 font-black text-xl">RD$</span>
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={monto}
                                            onChange={(e) => setMonto(e.target.value)}
                                            className="h-20 bg-slate-50 border-none rounded-[1.5rem] pl-20 pr-6 font-black text-3xl text-slate-800 placeholder:text-slate-200 focus-visible:ring-indigo-500/10"
                                            placeholder="50.00"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold ml-1 flex items-center gap-1.5 italic">
                                        <Info className="w-3.5 h-3.5" /> Este monto se acreditará automáticamente al wallet del técnico.
                                    </p>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[1.5rem] flex items-center justify-between border border-slate-100 group">
                                    <div className="space-y-1">
                                        <p className="font-black text-slate-700 tracking-tight">Pago Automático Activo</p>
                                        <p className="text-xs text-slate-400 font-bold">Activar o desactivar las acreditaciones por sistema.</p>
                                    </div>
                                    <Switch
                                        checked={activo}
                                        onCheckedChange={setActivo}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] font-black text-lg gap-3 shadow-xl transition-all active:scale-95"
                                    >
                                        <Save className="w-5 h-5" />
                                        {currentConfig ? "Actualizar Configuración" : "Crear Configuración"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Column */}
                <div className="space-y-6">
                    <Card className="rounded-[2rem] border-none shadow-xl bg-slate-900 text-white p-6">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                <User className="w-4 h-4" /> Perfil del Técnico
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-5">
                            <ProfileMiniItem label="Nombre" value={tecnico.name || "---"} />
                            <ProfileMiniItem label="Usuario" value={tecnico.username} />
                            <ProfileMiniItem label="Email" value={tecnico.email || "---"} />
                            <ProfileMiniItem label="Rol" value={tecnico.role} />
                        </CardContent>
                    </Card>

                    {currentConfig && (
                        <Card className="rounded-[2rem] border-slate-100 shadow-xl bg-white p-6">
                            <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-6">
                                <AlertCircle className="w-4 h-4" /> Último Registro
                            </CardTitle>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Actualizado</p>
                                    <p className="text-sm font-bold text-slate-800">{formatDateTime(currentConfig.fechaConfiguracion)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Estado</p>
                                    {currentConfig.activo ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-md px-2 py-0.5 text-xs font-black uppercase">Operativo</Badge>
                                    ) : (
                                        <Badge className="bg-rose-100 text-rose-700 border-none rounded-md px-2 py-0.5 text-xs font-black uppercase">Detenido</Badge>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProfileMiniItem({ label, value }: any) {
    return (
        <div className="space-y-0.5">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{label}</p>
            <p className="text-sm font-bold text-white tracking-tight">{value}</p>
        </div>
    );
}
