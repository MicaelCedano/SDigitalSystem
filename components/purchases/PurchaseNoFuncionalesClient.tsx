"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Search, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { markAsFuncional } from "@/app/actions/equipment";
import { useRouter } from "next/navigation";

interface Props {
    purchase: any;
}

export function PurchaseNoFuncionalesClient({ purchase }: Props) {
    const [search, setSearch] = useState("");
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const noFuncEquipos: any[] = purchase.equipos.filter(
        (e: any) => e.funcionalidad === "No funcional"
    );

    const filtered = noFuncEquipos.filter((e: any) => {
        const q = search.toLowerCase();
        return (
            e.imei?.toLowerCase().includes(q) ||
            (e.deviceModel?.modelName || "").toLowerCase().includes(q) ||
            (e.deviceModel?.brand || "").toLowerCase().includes(q)
        );
    });

    const handleMarkFuncional = async (equipoId: number) => {
        setLoadingId(equipoId);
        const res = await markAsFuncional(equipoId);
        setLoadingId(null);
        if (res.success) {
            toast.success("Equipo marcado como Funcional");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Error al actualizar");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-rose-50 rounded-full opacity-40" />
                <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-4">
                        <Link href={`/compras/${purchase.id}`}>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <AlertTriangle className="h-6 w-6 text-rose-500" />
                                <h1 className="text-4xl font-bold text-slate-800 tracking-tighter">No Funcionales</h1>
                                <Badge className="bg-rose-100 text-rose-700 border-0 rounded-xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                    Compra #{purchase.id}
                                </Badge>
                            </div>
                            <p className="text-slate-400 font-medium pl-1">
                                {purchase.supplier?.name} · {noFuncEquipos.length} equipo{noFuncEquipos.length !== 1 ? "s" : ""} por recuperar
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 relative z-10">
                    <div className="text-center px-6 py-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <p className="text-3xl font-black text-rose-600">{noFuncEquipos.length}</p>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Pendientes</p>
                    </div>
                    <div className="text-center px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-3xl font-black text-emerald-600">{purchase.functionalCount}</p>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Funcionales</p>
                    </div>
                </div>
            </div>

            {/* Empty state */}
            {noFuncEquipos.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-16 text-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800">¡Todo funcional!</h3>
                    <p className="text-slate-400 mt-2">No hay equipos no funcionales en esta compra.</p>
                    <Link href={`/compras/${purchase.id}`}>
                        <Button className="mt-6 rounded-2xl h-12 px-6 bg-indigo-600 text-white font-bold">
                            Volver a la compra
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-rose-400 transition-colors" />
                        <Input
                            placeholder="Buscar por IMEI, modelo o marca..."
                            className="h-16 pl-14 bg-white border-slate-100 rounded-[1.5rem] font-bold text-slate-700 shadow-sm focus-visible:ring-rose-500/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-rose-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-rose-50/40">
                                <TableRow className="hover:bg-transparent border-rose-100/50">
                                    <TableHead className="w-[60px] text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-10">#</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">IMEI</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dispositivo</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Grado</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Observación</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-10">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map((eq: any, idx: number) => (
                                    <TableRow key={eq.id} className="hover:bg-rose-50/20 border-slate-50 transition-colors group">
                                        <TableCell className="font-mono text-xs text-slate-300 pl-10">{idx + 1}</TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm">
                                                {eq.imei}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <p className="font-bold text-slate-800 text-sm leading-tight">
                                                {eq.deviceModel?.brand} {eq.deviceModel?.modelName}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {eq.deviceModel?.storageGb}GB · {eq.deviceModel?.color || eq.color || "N/A"}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            {eq.grado ? (
                                                <Badge className="bg-slate-100 text-slate-600 border-0 font-bold text-xs rounded-lg px-3">
                                                    {eq.grado}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <span className="text-xs text-slate-500 truncate block">
                                                {eq.observacion || <span className="text-slate-300">—</span>}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkFuncional(eq.id)}
                                                disabled={loadingId === eq.id || isPending}
                                                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                                            >
                                                {loadingId === eq.id ? "..." : "Marcar Funcional"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-300 font-bold italic text-lg">
                                            No se encontraron equipos
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
