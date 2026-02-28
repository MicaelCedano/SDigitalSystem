"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, Eye, Calendar, Package } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteDraft, activateDraft } from "@/app/actions/purchase";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface DraftPurchase {
    id: number;
    purchaseDate: Date | string;
    supplier: { name: string };
    _count: { items: number; equipos: number };
}

export function DraftsList({ drafts }: { drafts: DraftPurchase[] }) {
    const router = useRouter();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleDelete = async (id: number) => {
        setProcessingId(id);
        const res = await deleteDraft(id);
        if (res.success) {
            toast.success("Borrador eliminado correctamente");
            router.refresh();
        } else {
            toast.error(res.error || "Error al eliminar");
        }
        setProcessingId(null);
    };

    const handleActivate = async (id: number) => {
        setProcessingId(id);
        const res = await activateDraft(id);
        if (res.success) {
            toast.success("Compra activada e ingreso al inventario confirmado!");
            router.push("/compras");
        } else {
            toast.error(res.error || "Error al activar");
        }
        setProcessingId(null);
    };

    if (drafts.length === 0) {
        return (
            <div className="text-center py-32 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
                <div className="bg-white h-20 w-20 rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Package className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Sin borradores pendientes</h3>
                <p className="text-slate-400 mt-2 font-medium">Todas tus compras han sido procesadas o eliminadas.</p>
                <Button
                    variant="outline"
                    onClick={() => router.push("/compras/nueva")}
                    className="mt-8 h-12 px-8 rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 hover:border-indigo-100 transition-all font-bold shadow-sm"
                >
                    Nueva Compra
                </Button>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-50 hover:bg-transparent">
                        <TableHead className="py-6 px-8 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Referencia</TableHead>
                        <TableHead className="py-6 px-8 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Proveedor</TableHead>
                        <TableHead className="py-6 px-8 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha Registro</TableHead>
                        <TableHead className="py-6 px-8 text-left text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Contenido</TableHead>
                        <TableHead className="py-6 px-8 text-right text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Gestión</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {drafts.map((draft) => (
                        <TableRow key={draft.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="py-6 px-8">
                                <span className="inline-flex items-center justify-center h-10 w-20 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-200">
                                    #{draft.id}
                                </span>
                            </TableCell>
                            <TableCell className="py-6 px-8">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700">{draft.supplier?.name}</span>
                                    <span className="text-xs text-slate-400 font-medium">Proveedor de Equipos</span>
                                </div>
                            </TableCell>
                            <TableCell className="py-6 px-8">
                                <div className="flex items-center text-slate-500 font-medium">
                                    <Calendar className="mr-2 h-4 w-4 text-indigo-400" />
                                    {format(new Date(draft.purchaseDate), "PPP", { locale: es })}
                                </div>
                            </TableCell>
                            <TableCell className="py-6 px-8">
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="h-8 pl-1 pr-3 rounded-lg bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 transition-colors font-bold gap-2">
                                        <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
                                            <Package className="h-3 w-3" />
                                        </div>
                                        {draft._count.items} Modelos
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="py-6 px-8 text-right">
                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                disabled={processingId === draft.id}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-[2rem] p-10 border-none shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">¿Eliminar borrador?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-500 font-medium mt-2">
                                                    Esta acción eliminará la compra de <span className="font-bold text-slate-700">{draft.supplier?.name}</span> y todos sus items asociados. Esta acción no se puede deshacer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-8 gap-3">
                                                <AlertDialogCancel className="h-12 px-6 rounded-xl border-slate-200 font-bold transition-all hover:bg-slate-50">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(draft.id)} className="h-12 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold transition-all shadow-lg shadow-rose-200">
                                                    Eliminar Definitivamente
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="h-10 pl-3 pr-5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-200 flex gap-2 items-center"
                                                disabled={processingId === draft.id}
                                            >
                                                {processingId === draft.id ? (
                                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                Confirmar e Ingresar
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-[2.5rem] p-12 border-none shadow-2xl overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 bg-indigo-50 rounded-full opacity-50" />
                                            <AlertDialogHeader className="relative z-10">
                                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 font-bold shadow-inner">
                                                    <CheckCircle2 className="h-8 w-8" />
                                                </div>
                                                <AlertDialogTitle className="text-3xl font-bold text-slate-800 tracking-tighter">¿Confirmar Ingreso?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-500 font-medium mt-3 text-lg leading-relaxed">
                                                    Estás a punto de confirmar el ingreso de este lote. Los equipos pasarán a estado <span className="text-indigo-600 font-bold">"En Inventario"</span> y estarán listos para la venta.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-10 gap-4 flex-col sm:flex-row relative z-10">
                                                <AlertDialogCancel className="h-14 px-8 rounded-2xl border-slate-200 font-bold transition-all hover:bg-slate-50 flex-1">Aún no, revisar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleActivate(draft.id)} className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold transition-all shadow-xl shadow-indigo-200 flex-1">
                                                    Sí, Confirmar Ingreso
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
