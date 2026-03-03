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

    // New Order Form State
    const [newOrder, setNewOrder] = useState({
        clienteNombre: "",
        detalle: "",
        observaciones: ""
    });

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
                                                        toast.info("Detalle completo: " + order.detalle);
                                                    }}
                                                >
                                                    VER DETALLES COMPLETOS
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

            {/* Create Order Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <DialogHeader className="p-10 bg-white border-b flex flex-row items-center justify-between border-slate-100">
                        <div className="space-y-1">
                            <DialogTitle className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Nuevo Pedido</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500 text-lg">Escribe todo lo que necesitas solicitar de almacén.</DialogDescription>
                        </div>
                        <div className="h-20 w-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                            <FileText className="h-10 w-10 rotate-3" />
                        </div>
                    </DialogHeader>

                    <div className="p-10 bg-slate-50 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cliente Solicitante (Nombre)</Label>
                            <Input
                                placeholder="Escribe el nombre del cliente..."
                                className="h-16 rounded-2xl border-none shadow-lg shadow-slate-200/50 bg-white font-bold text-slate-700 text-lg px-8 focus:ring-2 ring-indigo-500/20"
                                value={newOrder.clienteNombre}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, clienteNombre: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">¿Qué necesitas del almacén? (Equipos, Cantidades, etc.)</Label>
                            <Textarea
                                placeholder="Ej: 5 iPhone 13 128GB Azul, 3 Samsung S22 Ultra..."
                                className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-white min-h-[180px] font-bold p-8 text-lg text-slate-700 placeholder:text-slate-300 focus:ring-2 ring-indigo-500/20"
                                value={newOrder.detalle}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, detalle: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notas u Observaciones (Opcional)</Label>
                            <Input
                                placeholder="Nota interna..."
                                className="h-14 rounded-2xl border-none shadow-md shadow-slate-100 bg-white/80 font-medium px-6 focus:bg-white transition-colors"
                                value={newOrder.observaciones}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, observaciones: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-10 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-full font-black text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 h-14 px-10"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                            className="h-16 px-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    REGISTRANDO...
                                </>
                            ) : (
                                "CONFIRMAR SOLICITUD"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
