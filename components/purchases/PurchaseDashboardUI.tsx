"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PurchaseWithProgress } from "@/app/actions/purchase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Plus,
    ShoppingCart,
    Package,
    CheckCircle2,
    FileText,
    Eye,
    Pencil,
    Activity,
    Clock,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface PurchaseDashboardUIProps {
    activePurchases: PurchaseWithProgress[];
    historyPurchases: PurchaseWithProgress[];
    draftCount: number;
}

export function PurchaseDashboardUI({ activePurchases, historyPurchases, draftCount }: PurchaseDashboardUIProps) {
    const router = useRouter();

    const stats = useMemo(() => [
        {
            title: "ACTIVAS",
            value: activePurchases.length,
            badge: "En Proceso",
            badgeColor: "bg-blue-100 text-blue-700",
            icon: Activity,
            iconColor: "text-blue-500",
            bgColor: "bg-white"
        },
        {
            title: "COMPLETADAS",
            value: historyPurchases.length,
            badge: "Historial",
            badgeColor: "bg-emerald-100 text-emerald-700",
            icon: CheckCircle2,
            iconColor: "text-emerald-500",
            bgColor: "bg-white"
        },
        {
            title: "BORRADORES",
            value: draftCount,
            badge: draftCount > 0 ? "Pendientes" : "Todo al día",
            badgeColor: draftCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
            icon: FileText,
            iconColor: "text-amber-500",
            bgColor: "bg-white",
            link: "/compras/borradores"
        }
    ], [activePurchases.length, historyPurchases.length, draftCount]);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl shadow-indigo-200/20">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-96 w-96 rounded-full bg-purple-500/20 blur-[100px]" />

                <div className="relative flex flex-col lg:flex-row items-center justify-between p-10 lg:p-14 gap-8">
                    <div className="text-white space-y-4 max-w-2xl text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Gestión de Compras</h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                            Administra adquisiciones, proveedores y seguimiento de lotes en un solo lugar con potencia y elegancia.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <Link href="/equipos" className="w-full sm:w-auto">
                            <Button size="lg" className="h-16 px-8 w-full rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border-0 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <Package className="mr-3 h-5 w-5" />
                                <span className="font-bold">Inventario</span>
                            </Button>
                        </Link>
                        <Link href="/compras/nueva" className="w-full sm:w-auto">
                            <Button size="lg" className="h-16 px-8 w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <ShoppingCart className="mr-3 h-5 w-5" />
                                <span className="font-bold text-lg">Nueva Compra</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                    <Link href={stat.link || "#"} key={i} className={`block group ${!stat.link && 'cursor-default'}`}>
                        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 h-full hover:shadow-2xl transition-all duration-500 bg-white overflow-hidden relative">
                            {/* Decorative background circle */}
                            <div className="absolute top-0 right-0 w-32 h-32 -mt-10 -mr-10 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />

                            <CardContent className="p-8 flex items-center justify-between relative z-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
                                    <div className="flex items-center gap-4">
                                        <span className="text-5xl font-bold text-slate-800 tracking-tighter">{stat.value}</span>
                                        <Badge className={cn("rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none shadow-sm", stat.badgeColor)}>
                                            {stat.badge}
                                        </Badge>
                                    </div>
                                </div>
                                <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-6", stat.iconColor, "bg-slate-50")}>
                                    <stat.icon className="h-8 w-8" strokeWidth={2} />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Active Purchases Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Activity className="h-5 w-5 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Compras en Proceso</h2>
                </div>

                {activePurchases.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-16 text-center">
                        <div className="mx-auto w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                            <Package className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">No hay compras activas</h3>
                        <p className="text-slate-400 mt-2 text-lg">Todas las compras han sido completadas o no se ha iniciado ninguna.</p>
                        <Button variant="link" className="mt-4 text-indigo-600 font-bold text-lg" onClick={() => router.push("/compras/nueva")}>
                            Crear nueva compra
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[80px] text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-10">ID</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Proveedor</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] w-[30%]">Progreso de Revisión</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-10">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activePurchases.map((purchase) => (
                                    <TableRow key={purchase.id} className="hover:bg-slate-50/80 border-slate-50 group transition-colors">
                                        <TableCell className="pl-10">
                                            <Badge className="rounded-xl px-4 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
                                                #{purchase.id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm">
                                                    {format(new Date(purchase.purchaseDate), "dd MMM, yyyy", { locale: es })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Automático</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-base tracking-tight uppercase">{purchase.supplier?.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {purchase.originalTotal} equipos registrados
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-full pr-12">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-700">{Math.round(purchase.displayProgress)}% COMPLETADO</span>
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">{purchase.completedCount}/{purchase.originalTotal}</span>
                                                </div>
                                                <Progress value={purchase.displayProgress} className="h-2.5 bg-slate-100 rounded-full" indicatorClassName="bg-indigo-500 shadow-sm" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => router.push(`/compras/${purchase.id}`)}>
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50">
                                                    <Pencil className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                                                    <FileText className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* History Section */}
            <div className="space-y-6 pt-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Historial de Compras</h2>
                </div>

                {historyPurchases.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 text-lg">No hay compras en el historial.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[80px] text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-10">ID</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Fecha</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Proveedor</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estado</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pr-10">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyPurchases.map((purchase) => (
                                    <TableRow key={purchase.id} className="hover:bg-slate-50/80 border-slate-50 group transition-colors">
                                        <TableCell className="pl-10">
                                            <span className="font-mono text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">#{purchase.id}</span>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <span className="font-bold text-slate-600 text-sm">
                                                {format(new Date(purchase.purchaseDate), "dd MMM, yyyy", { locale: es })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-800 uppercase text-base tracking-tight">{purchase.supplier?.name}</span>
                                                <Badge variant="outline" className="text-[10px] font-bold text-slate-400 rounded-lg border-slate-100 italic px-2">
                                                    {purchase.originalTotal} equipos
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-4 py-1.5 rounded-xl shadow-sm uppercase text-[10px] tracking-widest">
                                                <CheckCircle2 className="h-3 w-3 mr-2" /> Completada
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => router.push(`/compras/${purchase.id}`)}>
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                                                    <FileText className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
