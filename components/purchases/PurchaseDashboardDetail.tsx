"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ArrowLeft,
    Calendar,
    User,
    Package,
    Plus,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Activity,
    FileText,
    FileSpreadsheet,
    Search,
    Pencil,
    Trash2,
    Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelSummary {
    brand: string;
    model: string;
    storage: number;
    color: string | null;
    count: number;
    full_name: string;
}

interface PurchaseDetailProps {
    purchase: {
        id: number;
        purchaseDate: Date;
        supplier: { name: string } | null;
        totalQuantity: number;
        estado: string;
        functionalCount: number;
        nonFunctionalCount: number;
        reviewedCount: number;
        functionalPercentage: number;
        nonFunctionalPercentage: number;
        displayProgress: number;
        modelSummary: ModelSummary[];
        equipos: any[]; // Using any for now, but ideally strict type
    };
}

export function PurchaseDashboardDetail({ purchase }: PurchaseDetailProps) {
    const [modelSearch, setModelSearch] = useState("");
    const [equipmentSearch, setEquipmentSearch] = useState("");

    // Filter logic
    const filteredModels = purchase.modelSummary.filter(m =>
        m.full_name.toLowerCase().includes(modelSearch.toLowerCase())
    );

    const filteredEquipments = purchase.equipos.filter(e =>
        e.imei.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
        (e.deviceModel?.modelName || "").toLowerCase().includes(equipmentSearch.toLowerCase()) ||
        (e.deviceModel?.brand || "").toLowerCase().includes(equipmentSearch.toLowerCase())
    );

    const isCompleted = purchase.estado === 'activa' && purchase.reviewedCount >= purchase.totalQuantity;

    return (
        <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" />

                <div className="space-y-4 relative z-10">
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/compras">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tighter">Compra #{purchase.id}</h1>
                                <Badge
                                    className={cn(
                                        "rounded-xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] border-none shadow-sm",
                                        purchase.estado === 'borrador' ? 'bg-amber-100 text-amber-700' :
                                            isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-600 text-white shadow-indigo-200'
                                    )}
                                >
                                    {purchase.estado === 'borrador' ? 'Borrador' : isCompleted ? 'Completado' : 'En Proceso'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 mt-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Fecha de Registro</p>
                                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                                        <Calendar className="h-4 w-4 text-indigo-400" />
                                        <span>{format(new Date(purchase.purchaseDate), "EEEE, d 'de' MMMM", { locale: es })}</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-100 hidden md:block" />
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Proveedor Externo</p>
                                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                                        <Truck className="h-4 w-4 text-indigo-400" />
                                        <span className="uppercase">{purchase.supplier?.name || "Sin Proveedor"}</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-100 hidden md:block" />
                                <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Volumen Total</p>
                                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                                        <Package className="h-4 w-4 text-indigo-400" />
                                        <span>{purchase.totalQuantity} Equipos Registrados</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto relative z-10">
                    <Button className="flex-1 md:flex-none h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="h-5 w-5 mr-2" />
                        Agregar Equipos
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 font-bold text-slate-600 gap-2 hover:bg-slate-50">
                                <MoreVertical className="h-5 w-5" />
                                <span className="hidden md:inline">Opciones Avanzadas</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 p-2 shadow-2xl">
                            <DropdownMenuItem className="rounded-xl font-bold py-3 px-4">
                                <Pencil className="w-4 h-4 mr-2" /> Editar detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold py-3 px-4 text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar compra
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* KPIs / Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Funcionales */}
                <StatCard
                    label="Funcionales"
                    value={purchase.functionalCount}
                    percentage={purchase.functionalPercentage}
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    color="emerald"
                />

                {/* No Funcionales */}
                <StatCard
                    label="No Funcionales"
                    value={purchase.nonFunctionalCount}
                    percentage={purchase.nonFunctionalPercentage}
                    icon={<XCircle className="h-6 w-6" />}
                    color="rose"
                />

                {/* Total Revisados */}
                <StatCard
                    label="Eficiencia de Revisión"
                    value={`${purchase.reviewedCount} / ${purchase.totalQuantity}`}
                    percentage={purchase.displayProgress}
                    icon={<Activity className="h-6 w-6" />}
                    color="indigo"
                />
            </div>

            {/* Reports Section */}
            <div className="space-y-1">
                <div className="flex items-center gap-3 mb-6 px-4">
                    <div className="p-2 bg-slate-900 rounded-xl text-white">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Reportes & Documentación</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ReportCategory
                        title="Lote Completo"
                        purchaseId={purchase.id}
                        filter="all"
                    />
                    <ReportCategory
                        title="Solo Funcionales"
                        purchaseId={purchase.id}
                        filter="functional"
                        color="emerald"
                    />
                    <ReportCategory
                        title="Solo No Funcionales"
                        purchaseId={purchase.id}
                        filter="non_functional"
                        color="rose"
                    />
                </div>
            </div>

            {/* Split View: Models Summary & Equipment List */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                {/* Left: Model Summary */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Truck className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Resumen por Modelo</h3>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <Input
                            placeholder="Filtrar por nombre de modelo..."
                            className="h-16 pl-12 bg-white border-slate-100 rounded-[1.5rem] font-bold text-slate-700 shadow-sm focus-visible:ring-indigo-500/20"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[60px] text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-8">#</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Especificación</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-8">Cant.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredModels.length > 0 ? (
                                    filteredModels.map((model, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/80 border-slate-50 transition-colors group">
                                            <TableCell className="font-mono text-xs text-slate-400 pl-8">{idx + 1}</TableCell>
                                            <TableCell className="py-5">
                                                <p className="font-bold text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">{model.model}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {model.brand} • {model.storage}GB • {model.color || 'N/A'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 text-white font-bold">
                                                    {model.count}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-12">
                                            <p className="text-lg font-bold text-slate-300 italic tracking-tight">No se encontraron modelos registrados.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Right: Equipment List */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Package className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Equipos Detallados</h3>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <Input
                            placeholder="Buscar por IMEI o modelo..."
                            className="h-16 pl-12 bg-white border-slate-100 rounded-[1.5rem] font-bold text-slate-700 shadow-sm focus-visible:ring-indigo-500/20"
                            value={equipmentSearch}
                            onChange={(e) => setEquipmentSearch(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[60px] text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-8">#</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Identificador IMEI</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dispositivo</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estado QC</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-8">Acc.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEquipments.length > 0 ? (
                                    filteredEquipments.map((eq, idx) => (
                                        <TableRow key={eq.id} className="hover:bg-slate-50 border-slate-50 group transition-colors">
                                            <TableCell className="font-mono text-xs text-slate-300 pl-8">{idx + 1}</TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm">
                                                    {eq.imei}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {eq.deviceModel?.brand} {eq.deviceModel?.modelName}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {eq.deviceModel?.storageGb}GB • {eq.deviceModel?.color || eq.color || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cn(
                                                        "rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none shadow-sm",
                                                        eq.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-700' :
                                                            eq.estado === 'Revisado' ? 'bg-blue-100 text-blue-700' :
                                                                eq.estado === 'Dañado' ? 'bg-rose-100 text-rose-700' :
                                                                    'bg-slate-100 text-slate-500'
                                                    )}
                                                >
                                                    {eq.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16">
                                            <p className="text-xl font-bold text-slate-200 italic">No se encontraron equipos registrados.</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Internal Helper Components for Premium Feel
function StatCard({ label, value, percentage, icon, color }: any) {
    const colors: any = {
        emerald: "bg-emerald-600 shadow-emerald-100 text-emerald-600 border-emerald-100 bg-emerald-50",
        rose: "bg-rose-600 shadow-rose-100 text-rose-600 border-rose-100 bg-rose-50",
        indigo: "bg-indigo-600 shadow-indigo-100 text-indigo-600 border-indigo-100 bg-indigo-50",
    };

    const mainColor = colors[color].split(' ')[0];
    const shadowColor = colors[color].split(' ')[1];
    const textColor = colors[color].split(' ')[2];
    const borderColor = colors[color].split(' ')[3];
    const lightBg = colors[color].split(' ')[4];

    return (
        <Card className="rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/50 overflow-hidden relative group hover:scale-[1.02] transition-all duration-500 bg-white">
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mt-12 -mr-12 rounded-full opacity-5 group-hover:opacity-15 group-hover:scale-150 transition-all duration-1000", mainColor)} />
            <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
                        <h4 className="text-4xl font-bold text-slate-800 tracking-tighter">{value}</h4>
                    </div>
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl", mainColor, "text-white")}>
                        {icon}
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className={cn("text-xs font-bold uppercase tracking-wider", textColor)}>
                            {Math.round(percentage)}% Completado
                        </span>
                    </div>
                    <Progress value={percentage} className={cn("h-2.5 rounded-full bg-slate-100")} indicatorClassName={mainColor} />
                </div>
            </CardContent>
        </Card>
    );
}

function ReportCategory({ title, purchaseId, filter, color = "indigo" }: any) {
    const bgColor = color === "indigo" ? "bg-slate-900 shadow-slate-200" : color === "emerald" ? "bg-emerald-600 shadow-emerald-100" : "bg-rose-600 shadow-rose-100";

    return (
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group">
            <div className="p-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">{title}</p>
                <div className="grid grid-cols-2 gap-3">
                    <a href={`/api/purchases/${purchaseId}/report?type=pdf&filter=${filter}`} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full h-14 rounded-2xl bg-rose-50 text-rose-600 font-bold border-none hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                            <FileText className="mr-2 h-5 w-5" /> PDF
                        </Button>
                    </a>
                    <a href={`/api/purchases/${purchaseId}/report?type=excel&filter=${filter}`} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full h-14 rounded-2xl bg-emerald-50 text-emerald-600 font-bold border-none hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <FileSpreadsheet className="mr-2 h-5 w-5" /> EXCEL
                        </Button>
                    </a>
                </div>
            </div>
            <div className={cn("h-1.5 w-full", bgColor)} />
        </Card>
    );
}

// Utility to merge classes
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
