"use client";

import { useState } from "react";
import { 
    Users, DollarSign, Settings, ChevronRight, 
    ArrowLeft, Search, ShieldCheck, AlertCircle,
    UserCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ListadoTarifasClient({ tecnicos, configs }: any) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTecnicos = tecnicos.filter((t: any) => 
        (t.name || t.username).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/admin/pagos">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                            Gestión de Tarifas
                        </h1>
                        <p className="text-slate-400 font-bold flex items-center gap-2 mt-1">
                            Configuración centralizada de retribuciones <ChevronRight className="w-4 h-4" />
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-2">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar técnico por nombre o usuario..."
                            className="h-16 pl-14 bg-slate-50 border-none rounded-[1.5rem] font-bold text-slate-700 placeholder:text-slate-300 focus-visible:ring-indigo-500/10 text-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Technicians Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTecnicos.map((t: any) => {
                    const config = configs.find((c: any) => c.tecnicoId === t.id);
                    
                    return (
                        <Card key={t.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500">
                            <CardContent className="p-0">
                                <div className="p-8 flex items-center justify-between border-b border-slate-50">
                                    <div className="flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:rotate-3 transition-transform">
                                            {(t.name || t.username).substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                {t.name || t.username}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 border-slate-200 text-slate-400">
                                                    {t.role.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-[10px] text-slate-300 font-black">•</span>
                                                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{t.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/garantias/config/pago/${t.id}`}>
                                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                            <Settings className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="p-8 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tarifa Actual</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black text-slate-900">RD$ {config?.montoPorReparacion?.toLocaleString() || "50"}</span>
                                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                                    <DollarSign className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-slate-100" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</p>
                                            {config ? (
                                                config.activo ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-lg px-2 py-0.5 text-[9px] font-black uppercase">Activo</Badge>
                                                ) : (
                                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none rounded-lg px-2 py-0.5 text-[9px] font-black uppercase">Pausado</Badge>
                                                )
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none rounded-lg px-2 py-0.5 text-[9px] font-black uppercase">Por Configurar</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Link href={`/garantias/config/pago/${t.id}`}>
                                        <Button className="h-12 px-6 bg-white hover:bg-slate-900 border border-slate-100 hover:text-white text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all">
                                            Ajustar
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {filteredTecnicos.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                            <AlertCircle className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold italic text-lg">No se encontraron técnicos para mostrar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
