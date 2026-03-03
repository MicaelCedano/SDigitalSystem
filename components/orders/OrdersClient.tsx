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
    FileText
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
import { createOrder, updateOrderStatus } from "@/app/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OrdersClientProps {
    initialOrders: any[];
    clientes: any[];
}

export function OrdersClient({ initialOrders, clientes }: OrdersClientProps) {
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Package className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Listado de Pedidos</h2>
                        <p className="text-slate-500 font-medium">Gestiona las solicitudes activas de mercancía.</p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-16 px-8 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="mr-2 h-6 w-6" />
                    NUEVO PEDIDO
                </Button>
            </div>

            <div className="space-y-6">
                {initialOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No hay pedidos registrados</h3>
                        <p className="text-slate-500">Comienza registrando lo que necesitas del almacén.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {initialOrders.map((order) => {
                            const StatusIcon = statusConfig[order.status].icon;
                            return (
                                <Card key={order.id} className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all group bg-white border border-slate-50 overflow-hidden">
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
                                                {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                                                    <Button
                                                        onClick={() => handleStatusUpdate(order.id, order.status)}
                                                        className="rounded-full bg-slate-900 hover:bg-black text-white px-8 font-black text-xs h-12 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
                                                    >
                                                        {order.status === 'PENDIENTE' && 'ACEPTAR PEDIDO'}
                                                        {order.status === 'PROCESO' && 'MARCAR COMO LISTO'}
                                                        {order.status === 'LISTO' && 'ENTREGAR MERCANCÍA'}
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    className="text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] transition-colors"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                >
                                                    EXPLORAR PEDIDO
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl rounded-[3rem] border-none p-0 overflow-hidden shadow-2xl bg-slate-50">
                    {selectedOrder && (
                        <div className="flex flex-col">
                            {/* Header Section */}
                            <div className="bg-white p-10 border-b border-slate-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-lg",
                                            statusConfig[selectedOrder.status].color
                                        )}>
                                            {(() => {
                                                const Icon = statusConfig[selectedOrder.status].icon;
                                                return <Icon className="h-10 w-10" />;
                                            })()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge className="bg-slate-900 text-white font-mono px-3 py-1 rounded-lg text-xs">
                                                    {selectedOrder.codigo}
                                                </Badge>
                                                <Badge className={cn("rounded-full font-black text-[10px] uppercase px-3", statusConfig[selectedOrder.status].color)}>
                                                    {statusConfig[selectedOrder.status].label}
                                                </Badge>
                                            </div>
                                            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                                {selectedOrder.clienteNombre || selectedOrder.cliente?.nombre || 'Cliente General'}
                                            </h2>
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                    <UserIcon className="h-4 w-4 text-indigo-500" />
                                                    {selectedOrder.usuario.name || selectedOrder.usuario.username}
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                    <Clock className="h-4 w-4 text-indigo-500" />
                                                    {formatDateTime(selectedOrder.fechaCreacion)}
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
                                            className="h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-105"
                                        >
                                            AVANZAR ESTADO
                                            <ArrowRight className="ml-2 h-6 w-6" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                {/* Left Side: Order Items/Detail */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                                <ShoppingBag className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Desglose del Pedido</h3>
                                        </div>

                                        <div className="prose prose-slate max-w-none">
                                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 min-h-[150px]">
                                                <p className="text-slate-800 text-lg font-bold leading-relaxed whitespace-pre-wrap">
                                                    {selectedOrder.detalle}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedOrder.observaciones && (
                                            <div className="mt-8 p-6 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-4">
                                                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-1">Notas de Almacén</p>
                                                    <p className="text-amber-700 font-medium">{selectedOrder.observaciones}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Timeline/History */}
                                <div className="space-y-8">
                                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="p-3 bg-slate-900 rounded-2xl text-white">
                                                <History className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Crono-Flujo</h3>
                                        </div>

                                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-200 before:to-transparent">
                                            {selectedOrder.historial?.map((item: any, idx: number) => (
                                                <div key={item.id} className="relative flex items-center justify-between gap-4 pl-10">
                                                    <div className={cn(
                                                        "absolute left-0 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center -translate-x-1/2 shadow-md",
                                                        idx === 0 ? "bg-indigo-600" : "bg-slate-200"
                                                    )}>
                                                        {idx === 0 && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-black text-slate-800 uppercase">{item.estadoNuevo}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">
                                                            Por: <span className="font-bold text-slate-700">{item.usuario.name || item.usuario.username}</span>
                                                        </p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                                                            {formatDateTime(item.fecha)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 bg-white border-t border-slate-100">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="rounded-full font-black text-xs uppercase tracking-[0.2em] text-slate-400 h-14 px-10"
                                >
                                    CERRAR VISTA
                                </Button>
                                <Button
                                    className="rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] h-14 px-10"
                                    onClick={() => window.print()}
                                >
                                    IMPRIMIR COMPROBANTE
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-xl rounded-[2rem] border-none p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 mx-4">
                    <DialogHeader className="p-6 md:p-8 bg-white border-b flex flex-row items-center justify-between border-slate-100">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase">Nuevo Pedido</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500 text-sm md:text-base">Registra tu solicitud para almacén.</DialogDescription>
                        </div>
                        <div className="h-12 w-12 md:h-16 md:w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <FileText className="h-6 w-6 md:h-8 md:w-8 rotate-3" />
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 bg-slate-50 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cliente Solicitante</Label>
                            <Input
                                placeholder="Nombre del cliente..."
                                className="h-12 md:h-14 rounded-xl border-none shadow-md shadow-slate-200/50 bg-white font-bold text-slate-700 text-sm md:text-base px-6 focus:ring-2 ring-indigo-500/20"
                                value={newOrder.clienteNombre}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, clienteNombre: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Detalle del Pedido</Label>
                            <Textarea
                                placeholder="Ej: 5 iPhone 13, 3 Samsung S22..."
                                className="rounded-2xl border-none shadow-md shadow-slate-200/50 bg-white min-h-[120px] md:min-h-[150px] font-bold p-6 text-sm md:text-base text-slate-700 placeholder:text-slate-300 focus:ring-2 ring-indigo-500/20"
                                value={newOrder.detalle}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, detalle: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Observaciones (Opcional)</Label>
                            <Input
                                placeholder="Nota rápida..."
                                className="h-12 rounded-xl border-none shadow-sm shadow-slate-100 bg-white/80 font-medium px-6 focus:bg-white transition-colors text-sm"
                                value={newOrder.observaciones}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, observaciones: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="w-full sm:w-auto rounded-full font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 h-12 px-8"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base md:text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ENVIANDO...
                                </>
                            ) : (
                                "CONFIRMAR"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
