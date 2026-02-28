
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, Loader2, User, FileText, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createGarantiasLote } from "@/app/actions/garantias";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    cliente: z.string().min(2, "Nombre de cliente requerido"),
    tecnicoId: z.string().optional(),
    observaciones: z.string().optional(),
    items: z.array(z.object({
        imeiSn: z.string().min(5, "IMEI/SN requerido"),
        marca: z.string().optional(),
        modelo: z.string().optional(),
        problema: z.string().min(3, "Describa el problema"),
    })).min(1, "Debe agregar al menos una garantía")
});

export function BatchGarantiaForm({ tecnicos }: { tecnicos: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cliente: "",
            tecnicoId: "",
            observaciones: "",
            items: [{ imeiSn: "", marca: "", modelo: "", problema: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const res = await createGarantiasLote({
                cliente: values.cliente,
                tecnicoId: values.tecnicoId ? Number(values.tecnicoId) : undefined,
                observaciones: values.observaciones,
                items: values.items
            });

            if (res.success && res.data) {
                toast.success(`Lote ${res.data.lote.codigo} creado con éxito`);
                router.push("/garantias");
                router.refresh();
            } else {
                toast.error(res.error || "Error al crear lote");
            }
        } catch (error) {
            toast.error("Error crítico al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
                {/* Lote Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                    <FormField
                        control={form.control}
                        name="cliente"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Cliente / Origen
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Nombre del cliente o tienda" {...field} className="rounded-xl border-slate-200 h-12 bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="tecnicoId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5" /> Asignar a Técnico (Opcional)
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12 bg-white">
                                            <SelectValue placeholder="Seleccionar técnico" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        {tecnicos.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()} className="rounded-xl">
                                                {t.name || t.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="observaciones"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Notas Generales
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Notas para todo el lote..." {...field} className="rounded-xl border-slate-200 h-12 bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Items Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-4 ring-indigo-50">
                                {fields.length}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Equipos en el Lote</h2>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ imeiSn: "", marca: "", modelo: "", problema: "" })}
                            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold flex gap-2"
                        >
                            <Plus className="w-4 h-4" /> Añadir Equipo
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 animate-in slide-in-from-right-4 duration-300"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    {index + 1}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.imeiSn`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">IMEI / Serial</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                        <Input {...field} className="pl-9 rounded-xl border-slate-100 focus:border-indigo-300 h-11 text-sm font-mono" placeholder="Ingresar IMEI" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.marca`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Marca</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="rounded-xl border-slate-100 focus:border-indigo-300 h-11 text-sm" placeholder="Ej: Apple" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.modelo`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Modelo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="rounded-xl border-slate-100 focus:border-indigo-300 h-11 text-sm" placeholder="Ej: iPhone 15" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-4 items-end">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.problema`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-400">Problema</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="rounded-xl border-slate-100 focus:border-indigo-300 h-11 text-sm" placeholder="Falla reportada" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="h-11 w-11 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors mb-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center pt-8 border-t border-slate-100">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-12 rounded-3xl shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 flex gap-3"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Procesar Lote de Garantías
                    </Button>
                </div>
            </form>
        </Form>
    );
}
