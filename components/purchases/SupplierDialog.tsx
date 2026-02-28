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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupplier, updateSupplier } from "@/app/actions/supplier";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    contactInfo: z.string().optional(),
});

interface SupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier?: { id: number; name: string; contactInfo: string | null } | null;
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            contactInfo: "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: supplier?.name || "",
                contactInfo: supplier?.contactInfo || "",
            });
        }
    }, [open, supplier, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            if (supplier) {
                const res = await updateSupplier(supplier.id, values);
                if (res.success) {
                    toast.success("Proveedor actualizado correctamente");
                    onOpenChange(false);
                } else {
                    toast.error(res.error || "Error al actualizar");
                }
            } else {
                const res = await createSupplier(values);
                if (res.success) {
                    toast.success("Proveedor creado correctamente");
                    onOpenChange(false);
                } else {
                    toast.error(res.error || "Error al crear");
                }
            }
        } catch (error) {
            toast.error("Error inesperado via acción");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Ingrese los detalles del proveedor aquí. Click guardar cuando termine.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Nombre</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. Amazon, BestBuy..."
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
                            name="contactInfo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 dark:text-slate-300">Información de Contacto</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej. email@proveedor.com, +1 555..."
                                            {...field}
                                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white rounded-xl h-11"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl h-11 w-full sm:w-auto"
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
