"use client";

import { useState } from "react";
import {
    Package,
    Plus,
    Search,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Truck,
    History,
    ShoppingBag,
    User as UserIcon,
    Smartphone,
    ArrowRight,
    Loader2,
    FileText,
    Trash2,
    Printer
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { createOrder, updateOrderStatus, deleteOrder, testTelegram } from "@/app/actions/orders";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrdersClientProps {
    initialOrders: any[];
    clientes: any[];
}

export function OrdersClient({ initialOrders, clientes }: OrdersClientProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newOrder, setNewOrder] = useState({
        clienteNombre: "",
        detalle: "",
        observaciones: ""
    });

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'activos' | 'entregados'>('activos');

    const statusConfig: any = {
        'PENDIENTE': { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
        'PROCESO': { label: 'En Proceso', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: AlertCircle },
        'LISTO': { label: 'Listo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        'ENTREGADO': { label: 'Entregado', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Truck },
        'CANCELADO': { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: History },
    };

    const handleSubmitOrder = async () => {
        if (!newOrder.detalle || newOrder.detalle.length < 5) {
            toast.error("Por favor escribe el detalle de lo que necesitas pedir");
            return;
        }

        setIsSubmitting(true);
        const res = await createOrder({
            clienteNombre: newOrder.clienteNombre,
            detalle: newOrder.detalle,
            observaciones: newOrder.observaciones
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Pedido registrado correctamente");
            setIsCreateModalOpen(false);
            setNewOrder({ clienteNombre: "", detalle: "", observaciones: "" });
            router.refresh();
        } else {
            toast.error(res.error);
        }
    };

    const handleStatusUpdate = async (orderId: number, currentStatus: string) => {
        let nextStatus = "PENDIENTE";
        if (currentStatus === "PENDIENTE") nextStatus = "PROCESO";
        else if (currentStatus === "PROCESO") nextStatus = "LISTO";
        else if (currentStatus === "LISTO") nextStatus = "ENTREGADO";
        else return;

        const res = await updateOrderStatus(orderId, nextStatus);
        if (res.success) {
            toast.success(`Pedido actualizado a ${nextStatus}`);
            router.refresh();
        } else {
            toast.error(res.error);
        }
    };

    const handleDeleteOrder = async (orderId: number) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.")) return;

        const res = await deleteOrder(orderId);
        if (res.success) {
            toast.success("Pedido eliminado correctamente");
            setIsDetailsOpen(false);
            router.refresh();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 gap-6">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 md:h-20 md:w-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3 transition-transform hover:rotate-0">
                        <Package className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 ml-1">Módulo de Almacén</span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-tight">Pedidos</h2>
                        <p className="text-slate-400 font-medium text-sm">Gestiona las solicitudes activas de mercancía.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {session?.user?.role === 'admin' && (
                        <Button
                            variant="ghost"
                            onClick={async () => {
                                const res = await testTelegram();
                                if (res.success) toast.success("Prueba de Telegram enviada");
                                else toast.error(`Error: ${res.error}`);
                            }}
                            className="rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-14 px-6 border border-slate-100 transition-all flex items-center gap-2"
                        >
                            <AlertCircle className="h-4 w-4" />
                            TEST BOT
                        </Button>
                    )}
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 md:flex-none rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs tracking-[0.15em] h-14 px-8 shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                    >
                        <Plus className="mr-2 h-6 w-6" />
                        NUEVO PEDIDO
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 bg-white/50 p-2 rounded-2xl w-fit border border-slate-100">
                <Button
                    variant={activeTab === 'activos' ? "default" : "ghost"}
                    onClick={() => setActiveTab('activos')}
                    className={cn(
                        "rounded-xl px-6 font-bold text-xs tracking-tighter transition-all",
                        activeTab === 'activos' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    PENDIENTES ({initialOrders.filter(o => o.status !== 'ENTREGADO' && o.status !== 'CANCELADO').length})
                </Button>
                <Button
                    variant={activeTab === 'entregados' ? "default" : "ghost"}
                    onClick={() => setActiveTab('entregados')}
                    className={cn(
                        "rounded-xl px-6 font-bold text-xs tracking-tighter transition-all",
                        activeTab === 'entregados' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <History className="mr-2 h-4 w-4" />
                    HISTORIAL ({initialOrders.filter(o => o.status === 'ENTREGADO' || o.status === 'CANCELADO').length})
                </Button>
            </div>

            <div className="space-y-6">
                {initialOrders.filter(o => {
                    if (activeTab === 'activos') return o.status !== 'ENTREGADO' && o.status !== 'CANCELADO';
                    return o.status === 'ENTREGADO' || o.status === 'CANCELADO';
                }).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No hay pedidos registrados</h3>
                        <p className="text-slate-500">Comienza registrando lo que necesitas del almacén.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {initialOrders.filter(o => {
                            if (activeTab === 'activos') return o.status !== 'ENTREGADO' && o.status !== 'CANCELADO';
                            return o.status === 'ENTREGADO' || o.status === 'CANCELADO';
                        }).map((order) => {
                            const StatusIcon = statusConfig[order.status].icon;
                            return (
                                <Card key={order.id} className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all group bg-white border border-slate-50 overflow-hidden relative">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-900/5 rounded-full transition-transform group-hover:scale-150"></div>
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Status Column */}
                                        <div className={cn(
                                            "w-full lg:w-48 p-8 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-slate-100 transition-colors",
                                            order.status === 'LISTO' ? 'bg-emerald-50/30' :
                                                order.status === 'PROCESO' ? 'bg-indigo-50/30' : 'bg-slate-50/30'
                                        )}>
                                            <div className={cn(
                                                "w-16 h-16 rounded-3xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm",
                                                statusConfig[order.status].color
                                            )}>
                                                <StatusIcon className="h-8 w-8" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estado</span>
                                            <Badge className={cn("rounded-full font-black text-[10px] uppercase border", statusConfig[order.status].color)}>
                                                {statusConfig[order.status].label}
                                            </Badge>
                                        </div>

                                        {/* Data Column */}
                                        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                                                        {order.codigo}
                                                    </span>
                                                    <span className="text-slate-300 text-xs">|</span>
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDateTime(order.fechaCreacion)}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                                    <UserIcon className="h-5 w-5 text-indigo-500" />
                                                    {order.clienteNombre || order.cliente?.nombre || 'Cliente General'}
                                                </h3>
                                                <p className="text-slate-400 text-sm font-medium mt-1">
                                                    Pedido por: <span className="text-slate-600 font-bold">{order.usuario.name || order.usuario.username}</span>
                                                </p>
                                            </div>

                                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative group-hover:bg-slate-100/50 transition-colors">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 absolute -top-3 left-4 bg-white px-2 border border-slate-100 rounded-full">Detalle del Pedido</span>
                                                <p className="text-slate-700 text-sm font-bold line-clamp-3 leading-relaxed">
                                                    {order.detalle}
                                                </p>
                                                {order.observaciones && (
                                                    <p className="text-indigo-500 text-[11px] mt-3 font-medium italic">
                                                        Nota: {order.observaciones}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col lg:items-end gap-3">
                                                {session?.user?.id && (session.user.role === 'admin' || session.user.role === 'almacen' || session.user.canManageOrders === true) && order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                                                    <Button
                                                        onClick={() => handleStatusUpdate(order.id, order.status)}
                                                        className="rounded-full bg-slate-900 hover:bg-black text-white px-8 font-black text-xs h-12 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
                                                    >
                                                        {order.status === 'PENDIENTE' && 'ACEPTAR PEDIDO'}
                                                        {order.status === 'PROCESO' && 'MARCAR COMO LISTO'}
                                                        {order.status === 'LISTO' && 'ENTREGAR MERCANCIA'}
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        className="text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] transition-colors"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                    >
                                                        EXPLORAR
                                                    </Button>
                                                    {session?.user?.role === 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            onClick={() => handleDeleteOrder(order.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-5xl w-[95vw] rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white focus:outline-none">
                    {selectedOrder && (
                        <div className="flex flex-col h-full max-h-[90vh]">
                            {/* Header Section */}
                            <div className="p-8 md:p-10 bg-white border-b border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                                    <div className="flex items-center gap-8">
                                        <div className={cn(
                                            "h-20 w-20 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200 border border-slate-50 transition-transform hover:rotate-3",
                                            selectedOrder.status === 'LISTO' ? 'bg-emerald-50 text-emerald-600' :
                                                selectedOrder.status === 'PROCESO' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'
                                        )}>
                                            {(() => {
                                                const Icon = statusConfig[selectedOrder.status].icon;
                                                return <Icon className="h-10 w-10" />;
                                            })()}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expediente</span>
                                                <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-lg font-mono tracking-widest">
                                                    {selectedOrder.codigo}
                                                </span>
                                                <Badge className={cn("rounded-full font-black text-[10px] uppercase px-4 py-1.5 border-none shadow-sm ml-2", statusConfig[selectedOrder.status].color)}>
                                                    {statusConfig[selectedOrder.status].label}
                                                </Badge>
                                            </div>
                                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-800 leading-none">
                                                {selectedOrder.clienteNombre || selectedOrder.cliente?.nombre || 'Cliente General'}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Solicitado por</span>
                                                    <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                                                        <UserIcon className="h-4 w-4 text-indigo-500" />
                                                        {selectedOrder.usuario.name || selectedOrder.usuario.username}
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Fecha de Registro</span>
                                                    <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                                                        <Clock className="h-4 w-4 text-indigo-500" />
                                                        {formatDateTime(selectedOrder.fechaCreacion)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedOrder.status !== 'ENTREGADO' && selectedOrder.status !== 'CANCELADO' && (
                                        <Button
                                            onClick={() => {
                                                handleStatusUpdate(selectedOrder.id, selectedOrder.status);
                                                setIsDetailsOpen(false);
                                            }}
                                            className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 group shrink-0"
                                        >
                                            {selectedOrder.status === 'PENDIENTE' && 'ACEPTAR PEDIDO'}
                                            {selectedOrder.status === 'PROCESO' && 'MARCAR COMO LISTO'}
                                            {selectedOrder.status === 'LISTO' && 'ENTREGAR MERCANCIA'}
                                            <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 bg-slate-50/50">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                    {/* Left Side: Order Items/Detail */}
                                    <div className="lg:col-span-12 xl:col-span-7 flex">
                                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col w-full relative overflow-hidden group">
                                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-600/5 rounded-full transition-transform group-hover:scale-110"></div>

                                            <div className="flex items-center justify-between mb-8 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                                        <ShoppingBag className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Desglose Técnico</h3>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Especificaciones del Pedido</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/80 rounded-[2rem] p-8 md:p-10 border border-slate-100 relative min-h-[200px] flex-1">
                                                <div className="absolute top-6 right-8 opacity-[0.03]">
                                                    <Plus className="w-24 h-24 text-slate-900" />
                                                </div>
                                                <div className="text-slate-800 text-xl md:text-2xl font-black leading-relaxed whitespace-pre-wrap font-mono tracking-tighter relative z-10">
                                                    {selectedOrder.detalle}
                                                </div>
                                            </div>

                                            {selectedOrder.observaciones && (
                                                <div className="mt-8 p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex gap-5">
                                                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-100">
                                                        <AlertCircle className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-1">Notas del Técnico</p>
                                                        <p className="text-slate-700 text-sm md:text-base font-bold leading-relaxed">{selectedOrder.observaciones}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Side: Timeline/History */}
                                    <div className="lg:col-span-12 xl:col-span-5 flex">
                                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-slate-100 w-full relative overflow-hidden group">
                                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-slate-900/5 rounded-full transition-transform group-hover:scale-110"></div>

                                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                                    <History className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Actividad</h3>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Seguimiento de tiempos</p>
                                                </div>
                                            </div>

                                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[27px] before:-translate-x-px before:h-full before:w-1 before:bg-slate-100 before:rounded-full">
                                                {selectedOrder.historial?.map((item: any, idx: number) => (
                                                    <div key={item.id} className="relative flex items-start gap-8 pl-14">
                                                        <div className={cn(
                                                            "absolute left-0 mt-0.5 h-14 w-14 rounded-2xl border-4 border-white flex items-center justify-center -translate-x-px shadow-xl z-10 transition-all group/item hover:scale-110",
                                                            idx === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            <div className={cn("h-2.5 w-2.5 rounded-full bg-current", idx === 0 && "animate-pulse")} />
                                                        </div>
                                                        <div className="pt-1">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                                                                <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{item.estadoNuevo}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-1 mt-3">
                                                                <p className="text-[11px] text-slate-500 font-bold flex items-center gap-2">
                                                                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                                    {item.usuario.name || item.usuario.username}
                                                                </p>
                                                                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">
                                                                    {formatDateTime(item.fecha)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 md:p-10 bg-white border-t border-slate-100 flex flex-wrap md:flex-nowrap items-center justify-between gap-6">
                                <div className="flex gap-4 w-full md:w-auto">
                                    {session?.user?.role === 'admin' && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDeleteOrder(selectedOrder.id)}
                                            className="flex-1 md:flex-none rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-16 px-8 border border-transparent hover:border-rose-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                            <span>ELIMINAR</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsDetailsOpen(false)}
                                        className="flex-1 md:flex-none rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-16 px-10 border border-transparent hover:border-slate-100 transition-all"
                                    >
                                        CERRAR
                                    </Button>
                                </div>
                                <Button
                                    className="w-full md:w-auto rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] h-16 px-12 shadow-2xl shadow-slate-900/20 transition-all hover:scale-105 flex items-center justify-center gap-3 shrink-0"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-5 w-5" />
                                    <span>IMPRIMIR</span>
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 mx-4 bg-white">
                    <DialogHeader className="p-8 md:p-10 bg-white border-b flex flex-row items-center justify-between border-slate-100 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl"></div>
                        <div className="space-y-1 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Almacén Digital</span>
                            <DialogTitle className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Nuevo Pedido</DialogTitle>
                            <DialogDescription className="font-medium text-slate-400 text-sm md:text-base">Registra tu solicitud de mercancía.</DialogDescription>
                        </div>
                        <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200 rotate-3 transition-transform hover:rotate-0">
                            <ShoppingBag className="h-8 w-8" />
                        </div>
                    </DialogHeader>

                    <div className="p-8 md:p-10 bg-slate-50/50 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cliente Solicitante</Label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <Input
                                    placeholder="¿Para quién es este pedido?"
                                    className="h-16 rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white font-bold text-slate-700 text-lg px-14 focus:ring-4 ring-indigo-500/10 transition-all placeholder:text-slate-300"
                                    value={newOrder.clienteNombre}
                                    onChange={(e) => setNewOrder(prev => ({ ...prev, clienteNombre: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Detalle del Pedido</Label>
                            <Textarea
                                placeholder="Escribe aquí los productos y cantidades..."
                                className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white min-h-[180px] font-bold p-8 text-lg text-slate-700 placeholder:text-slate-300 focus:ring-4 ring-indigo-500/10 transition-all"
                                value={newOrder.detalle}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, detalle: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Observaciones (Opcional)</Label>
                            <Input
                                placeholder="Nota rápida para el almacén..."
                                className="h-14 rounded-xl border-none shadow-md shadow-slate-100 bg-white/80 font-bold px-6 focus:bg-white transition-all text-sm text-indigo-600 placeholder:text-slate-300"
                                value={newOrder.observaciones}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, observaciones: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 md:p-10 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="w-full sm:w-auto rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-slate-50 h-14 px-10 transition-all"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto h-16 md:h-20 px-12 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg md:text-xl shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    <span>ENVIANDO...</span>
                                </>
                            ) : (
                                <>
                                    <span>CONFIRMAR PEDIDO</span>
                                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
