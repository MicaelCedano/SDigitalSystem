"use client";

import { useState } from "react";
import {
    Smartphone, User, Tag, Layers, AlertTriangle,
    FileText, Save, ArrowLeft, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGarantia } from "@/app/actions/garantias";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CreateGarantiaClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        cliente: "",
        imeiSn: "",
        marca: "",
        modelo: "",
        problema: "",
        observaciones: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cliente || !formData.imeiSn || !formData.problema) {
            toast.error("Por favor completa los campos obligatorios");
            return;
        }

        setIsLoading(true);
        try {
            const result = await createGarantia(formData);
            if (result.success && result.garantia) {
                toast.success(`Garantía ${result.garantia.codigo} creada correctamente`);
                router.push("/garantias");
                router.refresh();
            } else {
                toast.error(result.error || "Error al crear la garantía");
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
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        Nueva Garantía
                    </h1>
                    <p className="text-slate-500 font-medium">Ingresa los detalles para iniciar el proceso de reparación.</p>
                </div>
                <Link href="/garantias">
                    <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver
                    </Button>
                </Link>
            </div>

            {/* Form Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative group">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                    <div className="flex items-center gap-4 pb-8 border-b border-slate-100">
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                            <Smartphone className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Detalles del Equipo</h2>
                            <p className="text-sm font-medium text-slate-400">Toda la información será validada por el administrador.</p>
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
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus-visible:ring-blue-500/20 placeholder:text-slate-300 transition-all focus:bg-white focus:shadow-inner"
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
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-mono font-bold text-slate-700 focus-visible:ring-blue-500/20 placeholder:text-slate-300 transition-all focus:bg-white focus:shadow-inner"
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
                                placeholder="Ej: Samsung, Apple, Xiaomi..."
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus-visible:ring-blue-500/20 placeholder:text-slate-300 transition-all focus:bg-white focus:shadow-inner"
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
                                placeholder="Ej: Galaxy S21, iPhone 13..."
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-700 focus-visible:ring-blue-500/20 placeholder:text-slate-300 transition-all focus:bg-white focus:shadow-inner"
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
                            placeholder="Describe detalladamente la falla reportada por el cliente..."
                            className="min-h-[120px] bg-slate-50 border-none rounded-[2rem] px-6 py-5 font-bold text-slate-700 focus-visible:ring-blue-500/20 placeholder:text-slate-300 transition-all focus:bg-white focus:shadow-inner resize-none"
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
                            placeholder="Notas sobre el estado físico del equipo, accesorios entregados, etc."
                            className="min-h-[100px] bg-slate-50 border-none rounded-[2rem] px-6 py-5 font-bold text-slate-700 focus-visible:ring-blue-500/20 placeholder:text-slate-300 transition-all focus:bg-white focus:shadow-inner resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-100">
                        <Link href="/garantias">
                            <Button type="button" variant="ghost" className="h-12 px-8 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                                Cancelar
                            </Button>
                        </Link>
                        <Button
                            disabled={isLoading}
                            className="h-14 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-6 h-6" />
                                    Registrar Garantía
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
