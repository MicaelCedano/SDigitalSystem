
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Save, Loader2, User, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { reportarTrabajosRealizados } from "@/app/actions/garantias";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    observaciones: z.string().optional(),
    items: z.array(z.object({
        imeiSn: z.string().min(5, "IMEI/SN requerido"),
        marca: z.string().optional(),
        modelo: z.string().optional(),
        problema: z.string().min(3, "Describa el problema"),
        cliente: z.string().min(2, "Nombre de cliente requerido"),
    })).min(1, "Debe agregar al menos un equipo")
});

export function ReportWorkForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            observaciones: "",
            items: [{ imeiSn: "", marca: "", modelo: "", problema: "", cliente: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        name: "items",
        control: form.control
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            const res = await reportarTrabajosRealizados({
                cliente: "Lote Múltiple",
                observaciones: values.observaciones,
                items: values.items
            });

            if (res.success) {
                toast.success("Trabajo reportado con éxito. Pendiente de aprobación por admin.");
                router.push("/garantias");
                router.refresh();
            } else {
                toast.error((res as any).error || "Error al reportar trabajo");
            }
        } catch (error) {
            toast.error("Error crítico al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Header Info */}
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <FormField
                        control={form.control}
                        name="observaciones"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Notas del Reporte
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Notas generales para el administrador..." {...field} className="rounded-xl border-slate-200 h-12 bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Items Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" /> Equipos Reparados
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ imeiSn: "", marca: "", modelo: "", problema: "", cliente: "" })}
                            className="rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
                        >
                            <Plus className="w-4 h-4 mr-1" /> Añadir Otro
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.imeiSn`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">IMEI / Serial</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                                        <Input {...field} className="pl-9 rounded-xl border-slate-100 h-10 text-sm font-mono" placeholder="IMEI" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.cliente`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Cliente / Propietario</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="rounded-xl border-slate-100 h-10 text-sm" placeholder="A quién pertenece?" />
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
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Modelo/Marca</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="rounded-xl border-slate-100 h-10 text-sm" placeholder="Ej: iPhone 13" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.problema`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Problema Original</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="rounded-xl border-slate-100 h-10 text-sm" placeholder="Falla inicial" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex items-end pb-1">
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
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

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-2xl shadow-lg shadow-indigo-200"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Reportar y Solicitar Pago
                    </Button>
                </div>
            </form>
        </Form>
    );
}
