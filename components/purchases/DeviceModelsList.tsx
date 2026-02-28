"use client";

import { useState } from "react";
import { DeviceModelDialog } from "./DeviceModelDialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, MoreHorizontal, Image as ImageIcon, RefreshCw } from "lucide-react";
import { syncAllMissingImages } from "@/app/actions/image-service";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDeviceModel } from "@/app/actions/device-models";
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
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface DeviceModel {
    id: number;
    brand: string;
    modelName: string;
    storageGb: number;
    color: string | null;
    imageFilename: string | null;
}

export function DeviceModelsHeaderActions() {
    const [open, setOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        const tid = toast.loading("Sincronizando todas las imágenes faltantes...");
        try {
            const res = await syncAllMissingImages();
            if (res.success) {
                toast.success(`Sincronización completa: ${res.updated} de ${res.processed} actualizados.`, { id: tid });
            } else {
                toast.error(res.error || "Error al sincronizar", { id: tid });
            }
        } catch (e) {
            toast.error("Error inesperado en sincronización", { id: tid });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex gap-3">
            <Link href="/images">
                <Button
                    variant="outline"
                    className="border-slate-300 dark:border-white/10 rounded-xl h-12 px-6 font-bold gap-2 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30"
                >
                    <ImageIcon className="w-4 h-4" />
                    Galería de Fotos
                </Button>
            </Link>
            <Button
                onClick={handleSync}
                disabled={isSyncing}
                variant="outline"
                className="border-slate-300 dark:border-white/10 rounded-xl h-12 px-6 font-bold gap-2 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
            >
                <RefreshCw className={isSyncing ? "animate-spin w-4 h-4" : "w-4 h-4"} />
                Sincronizar Fotos
            </Button>
            <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/25 hover:scale-105 active:scale-95 font-bold rounded-xl h-12 px-6">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Modelo
            </Button>
            <DeviceModelDialog open={open} onOpenChange={setOpen} />
        </div>
    );
}

export function DeviceModelsTable({ models }: { models: DeviceModel[] }) {
    const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await deleteDeviceModel(deleteId);
        if (res.success) {
            toast.success("Modelo eliminado correctamente");
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
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest w-[100px]">Imagen</TableHead>
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Marca</TableHead>
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Modelo</TableHead>
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Capacidad</TableHead>
                            <TableHead className="py-4 px-6 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Color</TableHead>
                            <TableHead className="py-4 px-6 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {models.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-slate-600 dark:text-slate-400 py-8 font-medium">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full">
                                            <MoreHorizontal className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p>No hay modelos de dispositivos registrados aún.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            models.map((model) => (
                                <TableRow key={model.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <TableCell className="py-4 px-6">
                                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden relative shadow-sm group-hover:scale-105 transition-transform duration-300">
                                            {model.imageFilename ? (
                                                <Image
                                                    src={model.imageFilename.startsWith('http') ? model.imageFilename : `/device-images/${model.imageFilename}`}
                                                    alt={model.modelName}
                                                    fill
                                                    className="object-contain p-2"
                                                    unoptimized
                                                />
                                            ) : (
                                                <ImageIcon className="text-slate-300 dark:text-slate-600 w-6 h-6" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                        {model.brand}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-slate-700 dark:text-slate-300 font-bold">
                                        {model.modelName}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 px-3 py-1 font-bold">
                                            {model.storageGb} GB
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        {model.color ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20 shadow-sm" style={{ backgroundColor: model.color.toLowerCase() }} />
                                                <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{model.color}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-500 text-xs italic font-medium">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex gap-2 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingModel(model)}
                                                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 h-9 px-4 rounded-xl transition-all shadow-sm"
                                            >
                                                <Pencil className="w-4 h-4 mr-2 text-blue-500" />
                                                Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeleteId(model.id)}
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
            <DeviceModelDialog
                open={!!editingModel}
                onOpenChange={(open) => !open && setEditingModel(null)}
                model={models.find(m => m.id === editingModel?.id) || editingModel}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">¿Eliminar Modelo?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            Esta acción no se puede deshacer.
                            <br /><br />
                            <span className="text-amber-600 dark:text-amber-500 font-medium">Nota: Si el modelo está siendo usado en alguna compra o equipo, se bloqueará la eliminación por seguridad.</span>
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
