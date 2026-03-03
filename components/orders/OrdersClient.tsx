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
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    arrivals: any[];
    models: any[];
    clientes: any[];
}

export function OrdersClient({ initialOrders, arrivals, models, clientes }: OrdersClientProps) {
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Order Form State
    const [newOrder, setNewOrder] = useState({
        clienteId: "",
        observaciones: "",
        items: [{ modelId: "", cantidad: 1 }]
    });

    const statusConfig: any = {
        'PENDIENTE': { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
        'PROCESO': { label: 'En Proceso', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: AlertCircle },
        'LISTO': { label: 'Listo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
        'ENTREGADO': { label: 'Entregado', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Truck },
        'CANCELADO': { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: History },
    };

    const handleAddItem = () => {
        setNewOrder(prev => ({
            ...prev,
            items: [...prev.items, { modelId: "", cantidad: 1 }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setNewOrder(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const updatedItems = [...newOrder.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setNewOrder(prev => ({ ...prev, items: updatedItems }));
    };

    const handleSubmitOrder = async () => {
        if (newOrder.items.some(i => !i.modelId || i.cantidad < 1)) {
            toast.error("Por favor completa todos los campos del pedido");
            return;
        }

        setIsSubmitting(true);
        const res = await createOrder({
            clienteId: newOrder.clienteId ? Number(newOrder.clienteId) : undefined,
            observaciones: newOrder.observaciones,
            items: newOrder.items.map(i => ({ modelId: Number(i.modelId), cantidad: Number(i.cantidad) }))
        });
        setIsSubmitting(false);

        if (res.success) {
            toast.success("Pedido creado correctamente");
            setIsCreateModalOpen(false);
            setNewOrder({ clienteId: "", observaciones: "", items: [{ modelId: "", cantidad: 1 }] });
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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-16 px-8 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-200 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-6 w-6" />
                    CREAR NUEVO PEDIDO
                </Button>
            </div>

            <Tabs defaultValue="pedidos" className="w-full">
                <TabsList className="bg-slate-100 p-1.5 rounded-[1.5rem] h-auto mb-8">
                    <TabsTrigger
                        value="pedidos"
                        className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase text-xs tracking-widest transition-all"
                    >
                        <Package className="mr-2 h-4 w-4" />
                        Pedidos Activos
                    </TabsTrigger>
                    <TabsTrigger
                        value="novedades"
                        className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md font-black uppercase text-xs tracking-widest transition-all"
                    >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Novedades / Stock
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pedidos" className="space-y-6">
                    {initialOrders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No hay pedidos registrados</h3>
                            <p className="text-slate-500">Comienza creando un pedido para tus clientes.</p>
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
                                                "w-full lg:w-48 p-8 flex flex-col justify-center items-center text-center border-b lg:border-b-0 lg:border-r border-slate-100",
                                                order.status === 'LISTO' ? 'bg-emerald-50/30' :
                                                    order.status === 'PROCESO' ? 'bg-indigo-50/30' : 'bg-slate-50/30'
                                            )}>
                                                <div className={cn(
                                                    "w-16 h-16 rounded-3xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                                                    statusConfig[order.status].color
                                                )}>
                                                    <StatusIcon className="h-8 w-8" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estado</span>
                                                <Badge className={cn("rounded-full font-black text-[10px] uppercase", statusConfig[order.status].color)}>
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
                                                        {order.cliente?.nombre || 'Cliente General'}
                                                    </h3>
                                                    <p className="text-slate-400 text-sm font-medium mt-1">
                                                        Pedido por: <span className="text-slate-600 font-bold">{order.usuario.name || order.usuario.username}</span>
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Modelos Solicitados</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.items.map((item: any) => (
                                                            <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2 flex items-center gap-3">
                                                                <div className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                                    {item.cantidad}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">
                                                                    {item.model.brand} {item.model.modelName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col lg:items-end gap-3 px-4 py-2">
                                                    {order.status !== 'ENTREGADO' && order.status !== 'CANCELADO' && (
                                                        <Button
                                                            onClick={() => handleStatusUpdate(order.id, order.status)}
                                                            className="rounded-full bg-slate-900 hover:bg-black text-white px-6 font-black text-xs h-10 transition-all hover:scale-105"
                                                        >
                                                            {order.status === 'PENDIENTE' && 'ACEPTAR PEDIDO'}
                                                            {order.status === 'PROCESO' && 'MARCAR COMO LISTO'}
                                                            {order.status === 'LISTO' && 'MARCAR ENTREGADO'}
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest">
                                                        VER DETALLES
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="novedades" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {arrivals.map((purchase) => (
                            <Card key={purchase.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest">NUEVO STOCK</Badge>
                                            <span className="text-slate-300 text-xs">|</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compra #{purchase.id}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                            {purchase.supplier.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-2 text-slate-400 font-medium text-xs">
                                            <Clock className="h-3 w-3" />
                                            {formatDateTime(purchase.purchaseDate)}
                                        </div>
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 transition-transform group-hover:rotate-12">
                                        <ShoppingBag className="h-7 w-7" />
                                    </div>
                                </div>
                                <div className="p-8 space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Equipos Ingresados</span>
                                    <div className="space-y-3">
                                        {purchase.items.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 overflow-hidden">
                                                        {item.deviceModel.imageFilename ? (
                                                            <img
                                                                src={`/images/${item.deviceModel.imageFilename}`}
                                                                alt={item.deviceModel.modelName}
                                                                className="h-10 w-10 object-contain"
                                                                onError={(e: any) => e.target.src = '/iphone-placeholder.png'}
                                                            />
                                                        ) : (
                                                            <Smartphone className="h-6 w-6" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{item.deviceModel.brand} {item.deviceModel.modelName}</h4>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.deviceModel.storageGb}GB • {item.deviceModel.color || 'No especificado'}</p>
                                                    </div>
                                                </div>
                                                <Badge className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-900 border-none font-black text-sm">
                                                    {item.quantity}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create Order Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 bg-white border-b flex flex-row items-center justify-between border-slate-100">
                        <div className="space-y-1">
                            <DialogTitle className="text-3xl font-black text-slate-800 tracking-tight uppercase">Nuevo Pedido</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">Completa los detalles de la solicitud.</DialogDescription>
                        </div>
                        <div className="h-16 w-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600">
                            <Plus className="h-8 w-8" />
                        </div>
                    </DialogHeader>

                    <div className="p-8 bg-slate-50 space-y-6 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cliente (Opcional)</Label>
                            <Select
                                value={newOrder.clienteId}
                                onValueChange={(val) => setNewOrder(prev => ({ ...prev, clienteId: val }))}
                            >
                                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 shadow-sm font-bold text-slate-700">
                                    <SelectValue placeholder="Seleccionar Cliente..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                    <SelectItem value="0">Cliente General</SelectItem>
                                    {clientes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Equipos Solicitados</Label>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={handleAddItem}
                                    className="h-8 rounded-full border-indigo-200 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100"
                                >
                                    <Plus className="mr-1 h-3 w-3" /> Añadir Modelo
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {newOrder.items.map((item, index) => (
                                    <div key={index} className="flex gap-3 items-end bg-white p-4 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modelo</Label>
                                            <Select
                                                value={item.modelId}
                                                onValueChange={(val) => handleItemChange(index, 'modelId', val)}
                                            >
                                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-slate-700">
                                                    <SelectValue placeholder="Modelo..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                    {models.map(m => (
                                                        <SelectItem key={m.id} value={m.id.toString()}>{m.brand} {m.modelName} ({m.storageGb}GB)</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cant.</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.cantidad}
                                                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                                className="h-11 rounded-xl bg-slate-50 border-slate-100 font-bold text-slate-700 text-center"
                                            />
                                        </div>
                                        {newOrder.items.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveItem(index)}
                                                className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <History className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Observaciones</Label>
                            <Textarea
                                placeholder="Cualquier nota adicional..."
                                className="rounded-3xl border-slate-200 shadow-sm bg-white min-h-[100px] font-medium p-6"
                                value={newOrder.observaciones}
                                onChange={(e) => setNewOrder(prev => ({ ...prev, observaciones: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-white border-t border-slate-100 flex items-center justify-between sm:justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-full font-black text-xs uppercase tracking-widest text-slate-400"
                        >
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                            className="h-14 px-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-100 transition-all hover:scale-105"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ENVIANDO...
                                </>
                            ) : (
                                "CONFIRMAR PEDIDO"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
