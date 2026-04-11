
"use client";

import { useState } from "react";
import {
    ArrowLeft, Calendar, DollarSign, TrendingUp, TrendingDown,
    RefreshCw, Filter, Download, ArrowUpCircle, ArrowDownCircle, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TechnicianHistoryClientProps {
    data: any;
}

export function TechnicianHistoryClient({ data }: TechnicianHistoryClientProps) {
    const { tecnico, wallet, ingresos, retiros, totalGanado, totalRetirado } = data;
    const [activeTab, setActiveTab] = useState<'all' | 'ingresos' | 'retiros'>('all');

    const allTransactions = [...ingresos, ...retiros].sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    const filteredTransactions = activeTab === 'all'
        ? allTransactions
        : activeTab === 'ingresos' ? ingresos : retiros;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleExport = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(`Historial de Pagos`, 14, 22);
        
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text(`${tecnico.name || tecnico.username}`, 14, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Fecha de reporte: ${new Date().toLocaleDateString()}`, 14, 38);
        doc.text(`Balance Total: RD$ ${wallet?.saldo?.toLocaleString() || '0'}`, 14, 43);

        const tableColumn = ["Fecha", "Hora", "Tipo", "Concepto / Detalle", "Monto (RD$)", "Estado"];
        const tableRows: any[] = [];

        filteredTransactions.forEach((t: any) => {
            const fecha = new Date(t.fecha).toLocaleDateString();
            const hora = new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isIngreso = t.tipo.toLowerCase().includes('ingreso');
            const montoStr = `${isIngreso ? '+' : '-'}RD$ ${t.monto.toLocaleString()}`;
            
            tableRows.push([
                fecha,
                hora,
                t.tipo,
                t.descripcion || 'Sin descripción',
                montoStr,
                t.estado
            ]);
        });

        autoTable(doc, {
            startY: 50,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { 
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
            },
            didParseCell: function(data) {
                if (data.section === 'body') {
                    const isIngreso = data.row.raw[2].toString().toLowerCase().includes('ingreso');
                    const estado = data.row.raw[5];

                    if (data.column.index === 4) { // Monto
                        data.cell.styles.textColor = isIngreso ? [5, 150, 105] : [225, 29, 72];
                        data.cell.styles.fontStyle = 'bold';
                    }
                    if (data.column.index === 2) { // Tipo
                        data.cell.styles.textColor = isIngreso ? [5, 150, 105] : [225, 29, 72];
                        data.cell.styles.fontStyle = 'bold';
                    }
                    if (data.column.index === 5) { // Estado
                        if (estado === 'Completado' || estado === 'Aprobado') {
                            data.cell.styles.textColor = [5, 150, 105];
                        } else if (estado === 'Rechazado' || estado === 'Cancelado') {
                            data.cell.styles.textColor = [225, 29, 72];
                        } else {
                            data.cell.styles.textColor = [217, 119, 6];
                        }
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        doc.save(`Pagos_${tecnico.username}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pagos">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Historial de <span className="text-indigo-600">{tecnico.name || tecnico.username}</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Detalle completo de transacciones y estados de cuenta.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleExport} variant="outline" className="rounded-2xl font-black text-xs uppercase tracking-widest bg-white border-slate-100 hover:bg-slate-50 transition-colors">
                        <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-4 py-2 rounded-xl font-black text-[10px] uppercase">
                        ID: {tecnico.id}
                    </Badge>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
                    <div className="p-8 relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                <DollarSign className="w-6 h-6 text-indigo-300" />
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-none">Saldo Global</Badge>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Balance Actual Total</p>
                        <h2 className="text-4xl font-black tracking-tighter">RD$ {wallet?.saldo?.toLocaleString() || '0'}</h2>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ganado</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">RD$ {totalGanado.toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                        <ArrowUpCircle className="w-3 h-3 text-emerald-500" /> Acumulado histórico
                    </p>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <TrendingDown className="w-6 h-6 text-rose-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Retirado/Penalidades</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">RD$ {totalRetirado.toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1">
                        <ArrowDownCircle className="w-3 h-3 text-rose-500" /> Salidas de la cuenta
                    </p>
                </Card>
            </div>

            {/* Accounts breakdown */}
            <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 px-2">
                    <RefreshCw className="w-5 h-5 text-indigo-600" /> Desglose por Cuentas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {wallet?.accounts.map((acc: any) => (
                        <Card key={acc.id} className="rounded-3xl border-slate-100 shadow-sm p-5 hover:border-indigo-100 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none mb-1">{acc.nombre}</p>
                                    <Badge variant="outline" className="text-[8px] font-black uppercase py-0 px-2 border-slate-200 text-slate-500">
                                        {acc.tipo}
                                    </Badge>
                                </div>
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    acc.color === 'blue' ? 'bg-indigo-500' : 'bg-slate-300'
                                )}></div>
                            </div>
                            <p className="text-xl font-black text-slate-800 font-mono">RD$ {acc.saldo.toLocaleString()}</p>
                        </Card>
                    ))}
                    {(!wallet?.accounts || wallet.accounts.length === 0) && (
                        <p className="text-slate-400 italic text-sm p-4">No se encontraron cuentas bancarias configuradas.</p>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                    <h3 className="text-xl font-black text-slate-800">Historial Detallado</h3>

                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                activeTab === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => setActiveTab('ingresos')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                activeTab === 'ingresos' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Ingresos
                        </button>
                        <button
                            onClick={() => setActiveTab('retiros')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                activeTab === 'retiros' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Retiros
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha y Hora</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalle / Concepto</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Monto</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredTransactions.map((t: any) => {
                                    const isIngreso = t.tipo.toLowerCase().includes('ingreso');
                                    const isPenalty = t.descripcion?.toUpperCase().includes('PENALIDAD');

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700">{new Date(t.fecha).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(t.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[9px] font-black uppercase border-none",
                                                    isIngreso ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                )}>
                                                    {t.tipo}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-sm font-black",
                                                        isPenalty ? "text-rose-600" : "text-slate-800"
                                                    )}>
                                                        {t.descripcion || 'Sin descripción'}
                                                    </span>
                                                    {t.loteId && <span className="text-[10px] text-slate-400 font-bold">Lote ID: {t.loteId}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={cn(
                                                    "text-base font-black font-mono",
                                                    isIngreso ? "text-emerald-600" : "text-slate-800"
                                                )}>
                                                    {isIngreso ? '+' : '-'}RD$ {t.monto.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex items-center justify-center">
                                                    <Badge className={cn(
                                                        "rounded-full px-3 py-1 text-[9px] font-black border-none",
                                                        t.estado === 'Completado' || t.estado === 'Aprobado'
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : t.estado === 'Rechazado' || t.estado === 'Cancelado'
                                                                ? "bg-rose-50 text-rose-700"
                                                                : "bg-amber-50 text-amber-700"
                                                    )}>
                                                        {t.estado}
                                                    </Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-6 bg-slate-50 rounded-full">
                                                    <RefreshCw className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-black text-lg">No hay transacciones que mostrar</p>
                                                <p className="text-slate-300 font-bold text-sm">Prueba cambiando los filtros o verifica más tarde.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sync Alert if needed */}
            {(wallet?.accounts.length === 1 && Math.abs((wallet.accounts[0].saldo || 0) - (wallet.saldo || 0)) > 1) && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
                    <div>
                        <h4 className="font-black text-amber-900 leading-none mb-1">Inconsistencia de Saldo Detectada</h4>
                        <p className="text-xs font-medium text-amber-700">
                            El saldo global del wallet (RD$ {wallet.saldo.toLocaleString()}) no coincide con el saldo de la cuenta principal (RD$ {wallet.accounts[0].saldo.toLocaleString()}).
                            Esto puede deberse a penalidades aplicadas antes de la sincronización de cuentas.
                        </p>
                        <Button variant="outline" className="mt-4 border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl font-black text-[10px] uppercase h-9">
                            Sincronizar ahora
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

