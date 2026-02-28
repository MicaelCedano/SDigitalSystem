"use client";

import { useState } from "react";
import {
    History, ArrowLeft, TrendingUp, TrendingDown,
    Calendar, Search, Filter, ChevronRight,
    CreditCard, ArrowUpRight, ArrowDownLeft,
    User as UserIcon, Wallet
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

export function TransaccionesTecnicoClient({ data, currentUser }: any) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filteredTransactions = data.transactions.filter((t: any) => {
        const matchesSearch = t.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || t.tipo === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalIngresos = data.transactions
        .filter((t: any) => t.tipo === 'ingreso' && t.estado === 'Aprobado')
        .reduce((sum: number, t: any) => sum + t.monto, 0);

    const totalRetiros = data.transactions
        .filter((t: any) => t.tipo === 'retiro' && t.estado === 'Aprobado')
        .reduce((sum: number, t: any) => sum + t.monto, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/garantias/pagos">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            Transacciones
                        </h1>
                        <p className="text-slate-400 font-bold ml-1 flex items-center gap-2">
                            {data.tecnico.name || data.tecnico.username} <ChevronRight className="w-4 h-4" /> Historial de cuenta
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Balance Actual"
                    value={`RD$ ${data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    icon={<Wallet className="w-5 h-5" />}
                    color="bg-slate-900"
                />
                <StatCard
                    label="Total Ingresos"
                    value={`RD$ ${totalIngresos.toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="bg-emerald-600"
                />
                <StatCard
                    label="Total Retiros"
                    value={`RD$ ${totalRetiros.toLocaleString()}`}
                    icon={<TrendingDown className="w-5 h-5" />}
                    color="bg-rose-600"
                />
            </div>

            {/* Filters Bar */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-2">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-3 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar en descripción de transacciones..."
                            className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <SelectValue placeholder="Tipo" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="ingreso">🟢 Ingresos</SelectItem>
                            <SelectItem value="retiro">🔴 Retiros</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Transactions List */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                                <th className="px-8 py-6">Fecha & Hora</th>
                                <th className="px-8 py-6">Tipo</th>
                                <th className="px-8 py-6">Monto</th>
                                <th className="px-8 py-6">Descripción</th>
                                <th className="px-8 py-6">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((t: any) => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700 tracking-tight">
                                                {formatDateTime(t.fecha).split(' ')[0]}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {formatDateTime(t.fecha).split(' ')[1]}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            t.tipo === 'ingreso' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {t.tipo === 'ingreso' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "text-lg font-black tracking-tighter",
                                            t.tipo === 'ingreso' ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {t.tipo === 'ingreso' ? '+' : '-'} RD$ {t.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="max-w-xs xl:max-w-md">
                                            <p className="text-sm font-bold text-slate-700 leading-snug">{t.descripcion}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge className={cn(
                                            "rounded-md border-none px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                                            t.estado === 'Aprobado' ? "bg-emerald-100/50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {t.estado}
                                        </Badge>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center opacity-40 italic">
                                        No se encontraron transacciones.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden relative group">
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mt-12 -mr-12 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700", color)} />
            <CardContent className="p-8">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4", color)}>
                    {icon}
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{value}</p>
            </CardContent>
        </Card>
    );
}
