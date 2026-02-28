
"use client";

import { useState } from "react";
import {
    Truck, Calendar, User, FileText,
    ChevronRight, Printer, Search, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";

export function ConduceListClient({ initialConduces }: { initialConduces: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filtered = initialConduces.filter(c =>
        c.codigoConduce.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por código o cliente..."
                        className="pl-12 h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-bold gap-2">
                    <Filter className="w-5 h-5" /> Filtrar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((conduce) => (
                    <Card key={conduce.id} className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-0">
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-slate-900 rounded-2xl text-white group-hover:rotate-12 transition-transform">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 font-black text-[10px] uppercase">
                                        {conduce.estado || 'Activo'}
                                    </Badge>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-1">{conduce.codigoConduce}</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{conduce.cliente}</p>
                            </div>

                            <div className="px-8 py-6 bg-slate-50/50 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-bold flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> {formatDateTime(conduce.fechaGeneracion).split(' ')[0]}
                                    </span>
                                    <span className="text-slate-800 font-black flex items-center gap-1">
                                        {conduce.totalEquipos} Equipos
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <User className="w-3.5 h-3.5" /> Generado por: {conduce.generadoPor?.name || conduce.generadoPor?.username}
                                </div>
                            </div>

                            <div className="p-6 flex gap-3">
                                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold h-12 shadow-lg gap-2">
                                    <FileText className="w-4 h-4" /> Detalles
                                </Button>
                                <Button variant="outline" className="rounded-2xl h-12 w-12 border-slate-200 flex items-center justify-center p-0">
                                    <Printer className="w-5 h-5 text-slate-600" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-xl font-black text-slate-400">No se encontraron conduces</h4>
                        <p className="text-slate-300 font-medium">Prueba con otra búsqueda o genera un nuevo conduce.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
