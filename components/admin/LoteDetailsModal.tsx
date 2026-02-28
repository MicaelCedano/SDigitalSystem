"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle2, XCircle, Info, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { useState, useMemo } from "react";

interface LoteDetailsModalProps {
    lote: any;
}

export function LoteDetailsModal({ lote }: LoteDetailsModalProps) {
    const sortedEquipos = useMemo(() => {
        if (!lote?.equipos) return [];
        return [...lote.equipos].sort((a, b) => {
            if (a.funcionalidad === 'Funcional' && b.funcionalidad !== 'Funcional') return -1;
            if (a.funcionalidad !== 'Funcional' && b.funcionalidad === 'Funcional') return 1;
            return 0;
        });
    }, [lote.equipos]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ml-auto">
                    <Eye className="w-3.5 h-3.5" /> Ver Detalles
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden p-0 rounded-3xl border-none bg-white shadow-2xl flex flex-col">
                <DialogHeader className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                            <Info className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight text-white uppercase">Detalles del Lote: {lote.codigo}</DialogTitle>
                            <p className="text-slate-400 text-xs font-medium mt-0.5">Técnico: <span className="text-white font-bold">{lote.tecnico.name || lote.tecnico.username}</span></p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 overflow-y-auto">
                    <div className="mb-6 grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Equipos</p>
                            <p className="text-2xl font-black text-slate-800">{lote.equipos.length}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">Funcionales</p>
                            <p className="text-2xl font-black text-emerald-700">{lote.equipos.filter((e: any) => e.funcionalidad === 'Funcional').length}</p>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-1">Fallas</p>
                            <p className="text-2xl font-black text-rose-700">{lote.equipos.filter((e: any) => e.funcionalidad === 'No funcional').length}</p>
                        </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden border-slate-100 shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 px-6">Equipo / IMEI</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 px-6 text-center">Estado</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 px-6 text-center">Grado</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 px-6">Observaciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEquipos.map((equipo: any) => (
                                    <TableRow key={equipo.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Smartphone className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm leading-none mb-1">
                                                        {equipo.deviceModel
                                                            ? `${equipo.deviceModel.brand} ${equipo.deviceModel.modelName} ${equipo.deviceModel.storageGb}GB`
                                                            : (equipo.modelo || equipo.marca)}
                                                        {equipo.color && <span className="ml-1 opacity-60">({equipo.color})</span>}
                                                    </p>
                                                    <p className="text-xs font-mono text-indigo-500 font-semibold">{equipo.imei}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                equipo.funcionalidad === 'Funcional'
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-rose-100 text-rose-700"
                                            )}>
                                                {equipo.funcionalidad === 'Funcional' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {equipo.funcionalidad || 'Sin revisar'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm border border-indigo-100">
                                                {equipo.grado || '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <p className="text-[11px] text-slate-500 font-medium max-w-[200px] leading-relaxed italic">
                                                {equipo.observacion || 'Sin observaciones.'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
