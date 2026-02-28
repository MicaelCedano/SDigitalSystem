"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createDeviceModel, updateDeviceModel } from "@/app/actions/device-models";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    brand: z.string().min(1, "La marca es requerida"),
    modelName: z.string().min(1, "El modelo es requerido"),
    storageGb: z.coerce.number().min(1, "El almacenamiento debe ser mayor a 0"),
    color: z.string().optional(),
});

import { findAndAssignImageToDeviceModel } from "@/app/actions/image-service";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

interface DeviceModelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    model?: {
        id: number;
        brand: string;
        modelName: string;
        storageGb: number;
        color: string | null;
        imageFilename: string | null;
    } | null;
}

export function DeviceModelDialog({ open, onOpenChange, model }: DeviceModelDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            brand: "",
            modelName: "",
            storageGb: 0,
            color: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                brand: model?.brand || "",
                modelName: model?.modelName || "",
                storageGb: model?.storageGb || 0,
                color: model?.color || "",
            });
        }
    }, [open, model, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        // Show immediate feedback that it might take a sec for image fetching
        const toastId = toast.loading("Procesando modelo y buscando imagen...");

        try {
            if (model) {
                const res = await updateDeviceModel(model.id, values);
                if (res.success) {
                    toast.success("Modelo actualizado correctamente", { id: toastId });
                    onOpenChange(false);
                } else {
                    toast.error(res.error || "Error al actualizar", { id: toastId });
                }
            } else {
                const res = await createDeviceModel(values);
                if (res.success) {
                    toast.success("Modelo creado y foto asignanda (si se encontró)", { id: toastId });
                    onOpenChange(false);
                } else {
                    toast.error(res.error || "Error al crear", { id: toastId });
                }
            }
        } catch (error) {
            toast.error("Error inesperado", { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {model ? "Editar Modelo" : "Nuevo Modelo"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Ingrese los detalles del dispositivo. El sistema intentará buscar una imagen automáticamente si se especifica el color.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Image Preview Area */}
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
                                {model?.imageFilename ? (
                                    <Image
                                        src={model.imageFilename.startsWith('http') ? model.imageFilename : `/device-images/${model.imageFilename}`}
                                        alt="Current model"
                                        fill
                                        className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                                        <ImageIcon className="w-10 h-10 opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Sin Imagen</span>
                                    </div>
                                )}

                                {loading && (
                                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Marca</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Apple, Samsung..."
                                                {...field}
                                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white rounded-xl h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="modelName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Modelo</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="iPhone 13, S23..."
                                                {...field}
                                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white rounded-xl h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="storageGb"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Almacenamiento (GB)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="128"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white rounded-xl h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Color (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Midnight, Black..."
                                                {...field}
                                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white rounded-xl h-11"
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs text-slate-500">
                                            Ayuda a buscar la imagen correcta.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                            {model && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={loading}
                                    onClick={async () => {
                                        setLoading(true);
                                        const tid = toast.loading("Buscando nueva imagen...");
                                        const res = await findAndAssignImageToDeviceModel(model.id, true);
                                        if (res.success) toast.success("Imagen actualizada!", { id: tid });
                                        else toast.error("No se encontró otra imagen", { id: tid });
                                        setLoading(false);
                                    }}
                                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl h-11"
                                >
                                    🔄 Nueva Foto
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-xl h-11 flex-1"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
