"use client";

import { useState } from "react";
import { SupplierDialog } from "./SupplierDialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteSupplier } from "@/app/actions/supplier";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Supplier {
    id: number;
    name: string;
    contactInfo: string | null;
    // Add other fields if necessary
}

export function SuppliersHeaderActions() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 hover:shadow-indigo-500/25 hover:scale-105 active:scale-95 font-bold rounded-xl h-12 px-6">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Proveedor
            </Button>
            <SupplierDialog open={open} onOpenChange={setOpen} />
        </>
    );
}

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await deleteSupplier(deleteId);
        if (res.success) {
            toast.success("Proveedor eliminado correctamente");
            setDeleteId(null);
        } else {
            toast.error(res.error || "Error al eliminar");
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-slate-100/50 dark:bg-white/5">
                        <TableRow className="border-b border-slate-200 dark:border-white/10 hover:bg-transparent">
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest w-1/3">Proveedor</TableHead>
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest w-1/3">Información de Contacto</TableHead>
                            <TableHead className="py-4 px-6 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest w-1/3">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-slate-600 dark:text-slate-400 py-8 font-medium">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full">
                                            <MoreHorizontal className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p>No hay proveedores registrados aún.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <TableCell className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-purple-900/50 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                {supplier.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            {supplier.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium">
                                        {supplier.contactInfo || <span className="text-slate-400 italic">No especificado</span>}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex gap-2 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingSupplier(supplier)}
                                                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 h-9 px-4 rounded-xl transition-all shadow-sm"
                                            >
                                                <Pencil className="w-4 h-4 mr-2 text-indigo-500" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeleteId(supplier.id)}
                                                className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 border-slate-200 dark:bg-white/5 dark:hover:bg-red-500/20 dark:hover:text-red-400 dark:hover:border-red-500/50 dark:text-slate-300 dark:border-white/10 h-9 px-4 rounded-xl transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <SupplierDialog
                open={!!editingSupplier}
                onOpenChange={(open) => !open && setEditingSupplier(null)}
                supplier={editingSupplier}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">¿Eliminar Proveedor?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al proveedor.
                            <br /><br />
                            <span className="text-amber-600 dark:text-amber-500 font-medium">Nota: Si tiene compras asociadas, se bloqueará la eliminación por seguridad.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-white/10">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20">
                            Eliminar Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
