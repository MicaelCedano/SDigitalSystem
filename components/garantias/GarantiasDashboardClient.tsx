"use client";

import { useState } from "react";
import {
    PlusCircle, Layers, Clock, Truck, Database, Inbox, Wrench, CheckCircle2,
    Search, Filter, UserPlus, Eye, Edit2, Trash2, AlertCircle, ChevronDown,
    ArrowUpRight, Download, MoreVertical, X, Check, DollarSign, Wallet, Trash, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { formatDateTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { asignarGarantia, updateGarantia, eliminarGarantia } from "@/app/actions/garantias";
import { PendingWorkApproval } from "./PendingWorkApproval";

interface GarantiasDashboardClientProps {
    initialGarantias: any[];
    stats: any;
    tecnicos: any[];
    currentUser: any;
    trabajosPendientes?: any[];
}

export function GarantiasDashboardClient({
    initialGarantias,
    stats,
    tecnicos,
    currentUser,
    trabajosPendientes = []
}: GarantiasDashboardClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEstado, setSelectedEstado] = useState<string>("all");
    const [selectedTecnico, setSelectedTecnico] = useState<string>("all");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (actionFn: () => Promise<any>, successMsg: string) => {
        setIsLoading(true);
        try {
            const res = await actionFn();
            if (res.success) {
                toast.success(successMsg);
                router.refresh();
            } else {
                toast.error(res.error || "Error al realizar la acción");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    // Filters & Search
    const filteredGarantias = initialGarantias.filter(g => {
        const matchesSearch =
            g.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.imeiSn.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEstado = selectedEstado === "all" || g.estado === selectedEstado;
        const matchesTecnico = selectedTecnico === "all" || g.tecnicoId?.toString() === selectedTecnico;

        return matchesSearch && matchesEstado && matchesTecnico;
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredGarantias.filter(g => g.estado === 'Pendiente de Asignación').map(g => g.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleAsignarMasivo = async (tecnicoId: string) => {
        if (!tecnicoId || selectedIds.length === 0) return;

        toast.promise(
            Promise.all(selectedIds.map(id => asignarGarantia(id, Number(tecnicoId)))),
            {
                loading: 'Asignando garantías...',
                success: 'Garantías asignadas correctamente',
                error: 'Error al asignar algunas garantías'
            }
        );
        setSelectedIds([]);
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Pendiente de Asignación': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Asignado': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Reparación': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Reparado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Terminado - Pendiente de Pago': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'Entregado': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Cancelado':
            case 'No Reparado': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        Sistema de Garantías
                    </h1>
                    <p className="text-slate-500 font-medium">Gestión integral de reparaciones y RMA</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {(currentUser.role === 'admin' || currentUser.can_create_garantias) && (
                        <>
                            <Link href="/garantias/crear">
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all gap-2 h-11 px-6">
                                    <PlusCircle className="w-5 h-5" />
                                    Nueva Garantía
                                </Button>
                            </Link>
                            <Link href="/garantias/lote">
                                <Button variant="outline" className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-11 px-6 gap-2">
                                    <Layers className="w-5 h-5" />
                                    Masivo
                                </Button>
                            </Link>
                        </>
                    )}
                    <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 gap-2">
                        <Truck className="w-5 h-5" />
                        Proveedores
                    </Button>
                </div>
            </div>

            {/* Pending Approvals (Admin Only) */}
            {currentUser.role === 'admin' && <PendingWorkApproval lotes={trabajosPendientes} />}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total"
                    value={stats.total}
                    subtitle="Garantías registradas"
                    icon={<Database className="w-6 h-6" />}
                    color="blue"
                />
                {currentUser.role === 'tecnico_garantias' ? (
                    <StatCard
                        title="Mi Balance"
                        value={`RD$ ${stats.balance.toLocaleString()}`}
                        subtitle="Saldo disponible"
                        icon={<Wallet className="w-6 h-6" />}
                        color="emerald"
                    />
                ) : (
                    <StatCard
                        title="Pendientes"
                        value={stats.pendientesAsignacion}
                        subtitle="Por asignar técnico"
                        icon={<Inbox className="w-6 h-6" />}
                        color="amber"
                    />
                )}
                <StatCard
                    title="En Taller"
                    value={stats.asignadas + stats.enReparacion}
                    subtitle="Siendo reparadas"
                    icon={<Wrench className="w-6 h-6" />}
                    color="indigo"
                />
                <StatCard
                    title="Completadas"
                    value={stats.reparadas + stats.entregadas}
                    subtitle="Reparadas y entregadas"
                    icon={<CheckCircle2 className="w-6 h-6" />}
                    color="emerald"
                />
            </div>

            {/* Filters Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por IMEI, cliente o código..."
                            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-indigo-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="w-full md:w-auto min-w-[180px]">
                            <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="Estado" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Estados</SelectItem>
                                    <SelectItem value="Pendiente de Asignación">Pendiente</SelectItem>
                                    <SelectItem value="Asignado">Asignado</SelectItem>
                                    <SelectItem value="En Reparación">En Reparación</SelectItem>
                                    <SelectItem value="Reparado">Reparado</SelectItem>
                                    <SelectItem value="Entregado">Entregado</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-auto min-w-[180px]">
                            <Select value={selectedTecnico} onValueChange={setSelectedTecnico}>
                                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-slate-400" />
                                        <SelectValue placeholder="Técnico" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Técnicos</SelectItem>
                                    {tecnicos.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.name || t.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="ghost"
                            className="h-12 px-6 rounded-2xl text-slate-500 hover:text-slate-900 transition-colors"
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedEstado("all");
                                setSelectedTecnico("all");
                            }}
                        >
                            Limpiar
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions Menu */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-indigo-600 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 text-white">
                            <Badge variant="secondary" className="bg-white/20 text-white border-none rounded-lg px-2 py-1">
                                {selectedIds.length}
                            </Badge>
                            <span className="font-bold text-sm">Seleccionados</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Select onValueChange={handleAsignarMasivo}>
                                <SelectTrigger className="h-10 bg-white/10 border-white/20 text-white rounded-xl min-w-[200px] hover:bg-white/20 transition-all">
                                    <SelectValue placeholder="Asignar a técnico..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tecnicos.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.name || t.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 rounded-xl"
                                onClick={() => setSelectedIds([])}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                <TableHead className="w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredGarantias.filter(g => g.estado === 'Pendiente de Asignación').length}
                                    />
                                </TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-wider h-14">Cód / Fecha</TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-wider h-14">Cliente / Equipo</TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-wider h-14">Estado</TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-wider h-14">Técnico</TableHead>
                                <TableHead className="text-[11px] font-black uppercase text-slate-400 tracking-wider h-14">Problema</TableHead>
                                <TableHead className="text-right text-[11px] font-black uppercase text-slate-400 tracking-wider h-14">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGarantias.length > 0 ? filteredGarantias.map((g) => (
                                <TableRow key={g.id} className="group hover:bg-slate-50/80 transition-all border-b border-slate-50 h-20">
                                    <TableCell className="text-center">
                                        {g.estado === 'Pendiente de Asignación' ? (
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                                checked={selectedIds.includes(g.id)}
                                                onChange={() => handleSelectRow(g.id)}
                                            />
                                        ) : (
                                            <div className="flex justify-center">
                                                <div className="w-4 h-4 rounded border border-slate-100 bg-slate-50/50" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-800 text-sm whitespace-nowrap">{g.codigo}</div>
                                        <div className="text-[11px] text-slate-400 font-medium">
                                            {formatDateTime(g.fechaRecepcion).split(' ')[0]}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-700 text-sm truncate max-w-[150px]">{g.cliente}</div>
                                        <div className="flex gap-1.5 mt-1">
                                            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-500 font-mono py-0 h-4">
                                                {g.imeiSn}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase", getStatusColor(g.estado))}>
                                            {g.estado}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {g.tecnico ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-inner">
                                                    {(g.tecnico.name || g.tecnico.username)[0].toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 truncate max-w-[100px]">
                                                    {g.tecnico.name || g.tecnico.username}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                Sin Asignar
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-slate-500 font-medium max-w-[200px] truncate" title={g.problema}>
                                            {g.problema}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <Link href={`/garantias/${g.id}`}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/garantias/${g.id}/editar`}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-10 w-10 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            {currentUser.role === 'admin' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar esta garantía?')) {
                                                            handleAction(() => eliminarGarantia(g.id), "Garantía eliminada");
                                                        }
                                                    }}
                                                    className="h-10 w-10 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                <Inbox className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-500 font-black">No se encontraron garantías</p>
                                                <p className="text-slate-400 text-xs">Prueba ajustando los filtros o crea una nueva.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Pagination summary */}
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">
                    <span>Mostrando {filteredGarantias.length} de {initialGarantias.length} registros</span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Sistema en línea</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
            <div className={cn("absolute -top-4 -right-4 w-24 h-24 opacity-[0.03] rotate-12 transition-transform group-hover:scale-125 group-hover:-rotate-12", colors[color])}>
                {icon}
            </div>
            <div className="flex justify-between items-start mb-6">
                <div className={cn("p-3.5 rounded-2xl border", colors[color])}>
                    {icon}
                </div>
                <Badge variant="outline" className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase", colors[color])}>
                    {title}
                </Badge>
            </div>
            <div className="text-4xl font-black text-slate-800 mb-1 tracking-tighter tabular-nums">{value}</div>
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{subtitle}</div>
        </div>
    );
}
