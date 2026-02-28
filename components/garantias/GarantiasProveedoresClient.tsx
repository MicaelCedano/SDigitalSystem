"use client";

import { useState } from "react";
import {
    Truck, Search, Filter, ArrowLeft,
    Inbox, Send, CheckCircle2, XCircle,
    Smartphone, User, Calendar, Tag, ChevronRight, Activity, Clock, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import Link from "next/link";
import { cn, formatDateTime } from "@/lib/utils";

export function GarantiasProveedoresClient({ garantias, suppliers, currentUser }: any) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("enviadas");

    const filteredGarantias = garantias.filter((g: any) => {
        const matchesSearch =
            g.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.imeiSn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (g.modelo?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || g.estado === statusFilter;
        const matchesSupplier = supplierFilter === "all" || g.supplierId === Number(supplierFilter);

        return matchesSearch && matchesStatus && matchesSupplier;
    });

    const enviadas = filteredGarantias.filter((g: any) => g.estado === 'Enviado a Proveedor');
    const recibidas = filteredGarantias.filter((g: any) => g.estado !== 'Enviado a Proveedor');

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Enviado a Proveedor': return 'bg-slate-800 text-slate-100 border-slate-700';
            case 'Reparado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'No Reparado': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Usado para Piezas': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-slate-900 rounded-[1.5rem] text-white shadow-xl">
                            <Truck className="w-8 h-8" />
                        </div>
                        Garantías Externas
                    </h1>
                    <p className="text-slate-400 font-bold ml-1 mt-1 flex items-center gap-2">
                        Gestión técnica con proveedores autorizados <ChevronRight className="w-4 h-4" />
                    </p>
                </div>
                <Link href="/garantias">
                    <Button variant="outline" className="rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 h-14 px-8 gap-2 font-black text-lg shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="En Proveedor" value={enviadas.length} icon={<Send className="w-5 h-5" />} color="bg-slate-900" />
                <StatCard label="Recibidas" value={recibidas.length} icon={<Inbox className="w-5 h-5" />} color="bg-blue-600" />
                <StatCard label="Reparadas" value={recibidas.filter((g: any) => g.estado === 'Reparado').length} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-emerald-600" />
                <StatCard label="Piezas/Malas" value={recibidas.filter((g: any) => ['No Reparado', 'Usado para Piezas'].includes(g.estado)).length} icon={<XCircle className="w-5 h-5" />} color="bg-rose-600" />
            </div>

            {/* Filters Bar */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white p-2">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por código, IMEI o cliente..."
                            className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus-visible:ring-slate-900/10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-600">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <SelectValue placeholder="Estado" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="Enviado a Proveedor">📤 Enviado</SelectItem>
                            <SelectItem value="Reparado">✅ Reparado</SelectItem>
                            <SelectItem value="No Reparado">❌ No Reparado</SelectItem>
                            <SelectItem value="Usado para Piezas">⚙️ Piezas</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-600">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                <SelectValue placeholder="Proveedor" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">Todos los proveedores</SelectItem>
                            {suppliers.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-100 rounded-[2rem] w-full max-w-md mx-auto shadow-inner">
                <button
                    onClick={() => setActiveTab("enviadas")}
                    className={cn(
                        "flex-1 h-12 rounded-[1.5rem] font-black text-sm tracking-tight transition-all flex items-center justify-center gap-2",
                        activeTab === "enviadas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Send className="w-4 h-4" />
                    Enviadas <Badge variant="secondary" className="ml-1 h-5 px-1.5 rounded-md">{enviadas.length}</Badge>
                </button>
                <button
                    onClick={() => setActiveTab("recibidas")}
                    className={cn(
                        "flex-1 h-12 rounded-[1.5rem] font-black text-sm tracking-tight transition-all flex items-center justify-center gap-2",
                        activeTab === "recibidas" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Inbox className="w-4 h-4" />
                    Recibidas <Badge variant="secondary" className="ml-1 h-5 px-1.5 rounded-md">{recibidas.length}</Badge>
                </button>
            </div>

            {/* Table Area */}
            <div className="grid grid-cols-1 gap-6 pb-20">
                {(activeTab === "enviadas" ? enviadas : recibidas).length > 0 ? (
                    (activeTab === "enviadas" ? enviadas : recibidas).map((g: any) => (
                        <Card key={g.id} className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-transform overflow-hidden group">
                            <div className="flex flex-col lg:flex-row">
                                {/* Left side - Main info */}
                                <div className="p-8 flex-1 border-r border-slate-50">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-mono font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">
                                                {g.codigo}
                                            </span>
                                            <Badge className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border", getStatusColor(g.estado))}>
                                                {g.estado}
                                            </Badge>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDateTime(g.fechaRecepcion)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <InfoItem label="Cliente" value={g.cliente} icon={<User className="w-3.5 h-3.5" />} />
                                        <InfoItem label="IMEI / SN" value={g.imeiSn} icon={<Shield className="w-3.5 h-3.5" />} isMono />
                                        <InfoItem label="Marca" value={g.marca || "---"} icon={<Tag className="w-3.5 h-3.5" />} />
                                        <InfoItem label="Modelo" value={g.modelo || "---"} icon={<Smartphone className="w-3.5 h-3.5" />} />
                                    </div>
                                </div>

                                {/* Right side - Provider & Actions */}
                                <div className="p-8 lg:w-96 bg-slate-50 flex flex-col justify-between gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proveedor Responsable</p>
                                                <p className="font-black text-slate-800 tracking-tight leading-none mt-1">
                                                    {g.supplier?.name || "No asignado"}
                                                </p>
                                            </div>
                                        </div>
                                        {g.fechaEnvioProveedor && (
                                            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 italic">
                                                <Clock className="w-3.5 h-3.5" /> Enviado el {formatDateTime(g.fechaEnvioProveedor).split(' ')[0]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <Link href={`/garantias/${g.id}`} className="flex-1">
                                            <Button className="w-full h-14 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl font-black text-sm gap-2 shadow-sm">
                                                Ver Detalle
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="py-32 text-center space-y-4 opacity-50">
                        <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300">
                            <Activity className="w-10 h-10" />
                        </div>
                        <p className="text-xl font-bold text-slate-400 tracking-tight italic">No se encontraron garantías que coincidan con la búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/30 overflow-hidden relative group">
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700", color)} />
            <CardContent className="p-6">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4", color)}>
                    {icon}
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-4xl font-black text-slate-800 tracking-tighter mt-1">{value}</p>
            </CardContent>
        </Card>
    );
}

function InfoItem({ label, value, icon, isMono }: any) {
    return (
        <div className="space-y-1.5 flex flex-col items-start min-w-0">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                {icon} {label}
            </p>
            <p className={cn(
                "font-bold text-slate-800 truncate w-full",
                isMono ? "font-mono text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-100" : "text-base tracking-tight"
            )}>
                {value}
            </p>
        </div>
    );
}
