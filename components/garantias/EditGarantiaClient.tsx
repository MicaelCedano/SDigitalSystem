"use client";

import { useState } from "react";
import {
    Smartphone, User, Tag, Layers, AlertTriangle,
    FileText, Save, ArrowLeft, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateGarantia } from "@/app/actions/garantias";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function EditGarantiaClient({ garantia }: { garantia: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        cliente: garantia.cliente || "",
        imeiSn: garantia.imeiSn || "",
        marca: garantia.marca || "",
        modelo: garantia.modelo || "",
        problema: garantia.problema || "",
        observaciones: garantia.observaciones || ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cliente || !formData.imeiSn || !formData.problema) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateGarantia(garantia.id, formData);
            if (result.success) {
                toast.success(`Garantía ${garantia.codigo} actualizada correctamente`);
                router.push(`/garantias/${garantia.id}`);
                router.refresh();
            } else {
                toast.error(result.error || "Error al actualizar la garantía");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                        Editar Garantía {garantia.codigo}
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Modifica la información general del equipo.</p>
                </div>
                <Link href={`/garantias/${garantia.id}`}>
                    <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 gap-2 font-bold">
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </Button>
                </Link>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                    <div className="flex items-center gap-4 pb-8 border-b border-slate-50">
                        <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Información Actualizable</h2>
                            <p className="text-sm font-medium text-slate-400">Solo se permiten cambios en datos generales.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cliente */}
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Cliente <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                name="cliente"
                                required
                                value={formData.cliente}
                                onChange={handleChange}
                                placeholder="Nombre completo del cliente"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus-visible:ring-amber-500/20"
                            />
                        </div>

                        {/* IMEI / SN */}
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Smartphone className="w-3.5 h-3.5" /> IMEI / Serial <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                name="imeiSn"
                                required
                                value={formData.imeiSn}
                                onChange={handleChange}
                                placeholder="IMEI o número de serie"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-mono font-bold text-slate-700 focus-visible:ring-amber-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Marca */}
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5" /> Marca
                            </label>
                            <Input
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                                placeholder="Ej: Samsung, Apple..."
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus-visible:ring-amber-500/20"
                            />
                        </div>

                        {/* Modelo */}
                        <div className="space-y-2.5">
                            <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" /> Modelo
                            </label>
                            <Input
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleChange}
                                placeholder="Ej: iPhone 13 Pro..."
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus-visible:ring-amber-500/20"
                            />
                        </div>
                    </div>

                    {/* Problema */}
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" /> Problema Reportado <span className="text-rose-500">*</span>
                        </label>
                        <Textarea
                            name="problema"
                            required
                            value={formData.problema}
                            onChange={handleChange}
                            placeholder="Describe la falla..."
                            className="min-h-[120px] bg-slate-50 border-none rounded-[2rem] px-6 py-5 font-bold text-slate-700 focus-visible:ring-amber-500/20 resize-none"
                        />
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2.5">
                        <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Observaciones Adicionales
                        </label>
                        <Textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleChange}
                            placeholder="Notas adicionales..."
                            className="min-h-[100px] bg-slate-50 border-none rounded-[2rem] px-6 py-5 font-bold text-slate-700 focus-visible:ring-amber-500/20 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-50">
                        <Link href={`/garantias/${garantia.id}`}>
                            <Button type="button" variant="ghost" className="h-12 px-8 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            disabled={isLoading}
                            className="h-14 px-10 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-200 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                        >
                            {isLoading ? "Guardando..." : (
                                <>
                                    <Save className="w-6 h-6" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Importance Notice */}
            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 flex gap-6 items-start">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <Info className="w-8 h-8 text-amber-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-amber-900 tracking-tight">Importante</h3>
                    <ul className="text-sm font-bold text-amber-800/70 space-y-1 mt-1">
                        <li>• Los cambios se registrarán en el historial de la garantía.</li>
                        <li>• Solo se pueden editar los campos básicos (cliente, IMEI, marca, modelo, problema).</li>
                        <li>• Los campos técnicos se gestionan desde el panel de reparación.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
