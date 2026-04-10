"use client";

import { useState } from "react";
import {
    AlertCircle, Search, ArrowLeft, Clock, User as UserIcon,
    ShieldAlert, ExternalLink, Calendar, Smartphone, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-1">
                <p className="font-black text-slate-800">{label}</p>
                <p className="text-sm font-bold text-indigo-600">Rechazo: {payload[0].value}%</p>
                <p className="text-xs text-slate-500 font-medium">Revisados: {payload[0].payload.totalReviewed}</p>
                <p className="text-xs text-rose-500 font-medium">Penalidades: {payload[0].payload.totalPenalties}</p>
            </div>
        );
    }
    return null;
};

export function PenaltiesViewClient({ data }: { data: any }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const allPenalties = [
        ...data.penalties,
        ...data.externalPenalties
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    const filteredPenalties = allPenalties.filter((p: any) => {
        const tecnicoName = (p.tecnico?.name || p.tecnico?.username || p.culpable || "").toLowerCase();
        const imei = (p.equipo?.imei || p.imei || "").toLowerCase();
        const motivo = (p.motivo || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return tecnicoName.includes(search) || imei.includes(search) || motivo.includes(search);
    });

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mb-4 transition-colors"
                    >
                        <ArrowLeft size={14} /> Volver a Pagos
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        Historial de Penalidades
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2 tracking-wide">
                        Registro completo de todas las sanciones aplicadas en el sistema.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.refresh()}
                        className="h-12 w-12 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-all hover:scale-110"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </Button>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por técnico, IMEI o motivo..."
                            className="h-12 pl-12 bg-white border-none rounded-2xl font-bold shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden relative group">
                    <div className="absolute -mt-8 -mr-8 w-24 h-24 rounded-full bg-indigo-600 opacity-10 group-hover:scale-110 transition-transform duration-500 top-0 right-0" />
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Registros</p>
                            <p className="text-3xl font-black tracking-tighter text-slate-800">{allPenalties.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden relative group">
                    <div className="absolute -mt-8 -mr-8 w-24 h-24 rounded-full bg-rose-600 opacity-10 group-hover:scale-110 transition-transform duration-500 top-0 right-0" />
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Internas (Por IMEI)</p>
                            <p className="text-3xl font-black tracking-tighter text-slate-800">{data.penalties.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden relative group">
                    <div className="absolute -mt-8 -mr-8 w-24 h-24 rounded-full bg-amber-600 opacity-10 group-hover:scale-110 transition-transform duration-500 top-0 right-0" />
                    <CardContent className="p-6 flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
                            <ExternalLink className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Externas (Manuales)</p>
                            <p className="text-3xl font-black tracking-tighter text-slate-800">{data.externalPenalties.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Technician Effectiveness Stats */}
            {data.technicianStats && data.technicianStats.length > 0 && (
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                    <CardContent className="p-8 lg:p-10">
                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Left Side: Stats Cards */}
                            <div className="w-full lg:w-5/12 flex flex-col">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <UserIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight text-slate-800">Efectividad por Técnico</h3>
                                        <p className="text-slate-500 font-medium text-sm mt-1">Porcentaje de rechazo sobre total de equipos referidos y revisados</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                    {data.technicianStats.map((stat: any) => (
                                        <div key={stat.id} className="relative overflow-hidden p-5 rounded-3xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    {stat.profileImage ? (
                                                        <img src={stat.profileImage} alt={stat.name} className="h-14 w-14 rounded-2xl object-cover shadow-md border-2 border-white" />
                                                    ) : (
                                                        <div className="h-14 w-14 rounded-2xl bg-indigo-100 shadow-inner flex items-center justify-center text-indigo-700 font-black text-xl border-2 border-white">
                                                            {stat.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{stat.name}</p>
                                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Técnico</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={cn(
                                                    "border-none font-black px-3 py-1 text-sm shadow-sm",
                                                    stat.percentage > 10 ? "bg-rose-100 text-rose-700" :
                                                    stat.percentage > 5 ? "bg-amber-100 text-amber-700" :
                                                    "bg-emerald-100 text-emerald-700"
                                                )}>
                                                    {stat.percentage}%
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-end bg-white p-3 rounded-2xl border border-slate-50">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mb-1">Revisados</p>
                                                    <p className="text-2xl font-black text-slate-800 tracking-tighter">{stat.totalReviewed}</p>
                                                </div>
                                                <div className="w-[1px] h-8 bg-slate-100 mx-4"></div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mb-1">Penalidades</p>
                                                    <p className="text-2xl font-black text-rose-600 tracking-tighter">{stat.totalPenalties}</p>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 h-1.5 bg-slate-200 w-full opacity-70">
                                                <div className={cn(
                                                    "h-full transition-all duration-1000 rounded-r-full",
                                                    stat.percentage > 10 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" :
                                                    stat.percentage > 5 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                                                    "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                )} style={{ width: `${Math.min(stat.percentage, 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Graph & Top */}
                            <div className="w-full lg:w-7/12 flex flex-col gap-6">
                                {/* Graph */}
                                <div className="bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center p-8 relative overflow-hidden group w-full">
                                    <div className="absolute -mt-20 -mr-20 w-64 h-64 rounded-full bg-indigo-600 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 top-0 right-0 pointer-events-none" />
                                    <h4 className="text-lg font-black tracking-tight text-slate-700 mb-8 w-full text-center uppercase tracking-[0.1em]">
                                        Gráfica de Rechazo (%)
                                    </h4>
                                    <div className="w-full h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={data.technicianStats} 
                                                margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                                    tickFormatter={(value) => `${value}%`}
                                                />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                                <Bar 
                                                    dataKey="percentage" 
                                                    radius={[8, 8, 8, 8]}
                                                    maxBarSize={60}
                                                >
                                                    {data.technicianStats.map((entry: any, index: number) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={
                                                                entry.percentage > 10 ? '#f43f5e' : 
                                                                entry.percentage > 5 ? '#f59e0b' : 
                                                                '#10b981'
                                                            } 
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Top Penalties */}
                                <div className="bg-rose-50/50 rounded-3xl border border-rose-100 p-6 flex flex-col w-full relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-base font-black tracking-tight text-slate-800 uppercase tracking-widest">
                                            Top Más Penalizados
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[...data.technicianStats].sort((a, b) => b.totalPenalties - a.totalPenalties).slice(0, 3).map((stat: any, index: number) => (
                                            <div key={`top-${stat.id}`} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-rose-50">
                                                <div className="text-3xl font-black text-rose-200">
                                                    #{index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-700 truncate">{stat.name}</p>
                                                    <p className="text-xs font-black text-rose-600">{stat.totalPenalties} Penalidades</p>
                                                </div>
                                                {stat.profileImage ? (
                                                    <img src={stat.profileImage} alt={stat.name} className="h-10 w-10 rounded-full object-cover shadow-sm border border-rose-100" />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-black text-xs border border-rose-200">
                                                        {stat.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="space-y-4">
                {filteredPenalties.map((p: any) => (
                    <Card key={`${p.type}-${p.id}`} className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all group bg-white overflow-hidden">
                        <div className="flex flex-col lg:flex-row lg:items-center">
                            {/* Technician Info */}
                            <div className="p-6 lg:w-[30%] border-b lg:border-b-0 lg:border-r border-slate-50 flex items-center gap-4">
                                <div className="h-16 w-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white font-black text-xl rotate-3 group-hover:rotate-0 transition-transform">
                                    {(p.tecnico?.name || p.tecnico?.username || p.culpable || "??").substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Técnico Sancionado</p>
                                    <h3 className="text-xl font-black text-slate-800 leading-tight">
                                        {p.tecnico?.name || p.tecnico?.username || p.culpable}
                                    </h3>
                                    <Badge variant="outline" className={cn(
                                        "mt-2 rounded-lg text-[9px] font-black uppercase border-none",
                                        p.type === 'internal' ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                                    )}>
                                        {p.type === 'internal' ? 'Interna (IMEI)' : 'Externa (Manual)'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Penalty Details */}
                            <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                                        <Smartphone size={10} /> Equipo / Referencia
                                    </p>
                                    <p className="font-bold text-slate-700 leading-tight">
                                        {p.type === 'internal'
                                            ? [p.equipo?.marca, p.equipo?.deviceModel?.brand, p.equipo?.modelo, p.equipo?.deviceModel?.modelName]
                                                .filter(Boolean)
                                                .filter((val, index, self) => self.indexOf(val) === index) // remove duplicates if marca == brand
                                                .join(' ') || "Equipo sin identificar"
                                            : (p.modelo || "Referencia Manual")}
                                    </p>
                                    <p className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 inline-block mt-1">
                                        {p.type === 'internal' ? p.equipo?.imei : p.imei}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                                        <AlertCircle size={10} /> Motivo
                                    </p>
                                    <p className="font-bold text-slate-600 line-clamp-2 italic">
                                        "{p.motivo}"
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} /> Fecha Aplicada
                                    </p>
                                    <p className="font-bold text-slate-700">
                                        {format(new Date(p.fecha), "PPP", { locale: es })}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        {format(new Date(p.fecha), "p", { locale: es })}
                                    </p>
                                </div>
                            </div>

                            {/* Amount & Action */}
                            <div className="p-6 lg:w-[20%] bg-slate-50/50 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4">
                                <div className="text-right lg:text-center w-full">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Monto Descontado</p>
                                    <p className="text-2xl font-black text-rose-600 tracking-tighter">
                                        - RD$ {(p.monto || p.cantidad).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredPenalties.length === 0 && (
                    <div className="py-20 text-center bg-white rounded-[2.5rem] shadow-xl border-none">
                        <Search size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-2xl font-black text-slate-400">No se encontraron penalidades</h3>
                        <p className="text-slate-300 font-bold uppercase tracking-widest mt-2">Intenta con otra búsqueda</p>
                    </div>
                )}
            </div>
        </div>
    );
}
