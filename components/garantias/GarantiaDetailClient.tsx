"use client";

import { useState } from "react";
import {
    Smartphone, User, Calendar, Shield, Activity,
    ArrowLeft, Wrench, CheckCircle2, XCircle,
    Clock, Tag, Layers, AlertTriangle, FileText,
    History, UserPlus, Truck, Send, Check, X,
    DollarSign, Briefcase, ChevronRight, Edit2, Trash2, Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    asignarGarantia, iniciarReparacion, completarReparacion,
    aprobarGarantia, rechazarGarantia, cancelarGarantia,
    eliminarGarantia, marcarComoEntregado, confirmarEntrega,
    enviarAProveedor, recibirDeProveedor
} from "@/app/actions/garantias";

interface GarantiaDetailClientProps {
    garantia: any;
    equipoHistorial: any[];
    tecnicos: any[];
    suppliers: any[];
    currentUser: any;
}

export function GarantiaDetailClient({
    garantia,
    equipoHistorial,
    tecnicos,
    suppliers,
    currentUser
}: GarantiaDetailClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Modals state
    const [showAsignarModal, setShowAsignarModal] = useState(false);
    const [showRepararModal, setShowRepararModal] = useState(false);
    const [showRechazoModal, setShowRechazoModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEnviarModal, setShowEnviarModal] = useState(false);
    const [showRecibirModal, setShowRecibirModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Form states
    const [selectedTecnico, setSelectedTecnico] = useState<string>("");
    const [diagnostico, setDiagnostico] = useState("");
    const [solucion, setSolucion] = useState("");
    const [razonRechazo, setRazonRechazo] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");
    const [obsProveedor, setObsProveedor] = useState("");
    const [resultadoProveedor, setResultadoProveedor] = useState("Reparado");

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

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Pendiente de Asignación': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Asignado': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'En Reparación': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Pendiente de Aprobación': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Reparado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Enviado a Proveedor': return 'bg-slate-800 text-slate-100 border-slate-700';
            case 'Pendiente Confirmación Entrega': return 'bg-sky-100 text-sky-700 border-sky-200';
            case 'Entregado': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Cancelado':
            case 'No Reparado': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Usado para Piezas': return 'bg-slate-200 text-slate-700 border-slate-300';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const isAdmin = currentUser.role === 'admin';

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/garantias">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/80 border border-slate-100 shadow-sm hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                Garantía {garantia.codigo}
                            </h1>
                            <Badge className={cn("rounded-full border px-3 py-1 text-[10px] font-black uppercase", getStatusColor(garantia.estado))}>
                                {garantia.estado}
                            </Badge>
                        </div>
                        <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> Registrada el {formatDateTime(garantia.fechaRecepcion)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link href={`/garantias/${garantia.id}/editar`}>
                        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-11 px-6 gap-2 font-bold">
                            <Edit2 className="w-4 h-4" />
                            Editar
                        </Button>
                    </Link>
                    {isAdmin && (
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(true)}
                            className="rounded-xl border-rose-100 text-rose-600 hover:bg-rose-50 h-11 px-6 gap-2 font-bold"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-6 shadow-2xl flex flex-wrap items-center gap-4 border border-slate-700">
                <div className="flex-1 flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Acciones Disponibles</p>
                        <p className="text-white font-bold text-sm">Garantía en estado {garantia.estado}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Admin Actions */}
                    {isAdmin && (
                        <>
                            {garantia.estado === 'Pendiente de Asignación' && (
                                <Button
                                    onClick={() => setShowAsignarModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none"
                                >
                                    <UserPlus className="w-4 h-4" /> Asignar Técnico
                                </Button>
                            )}
                            {garantia.estado === 'Pendiente de Aprobación' && (
                                <>
                                    <Button
                                        onClick={() => handleAction(() => aprobarGarantia(garantia.id), "Garantía aprobada y pago procesado")}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none"
                                    >
                                        <Check className="w-4 h-4" /> Aprobar & Pagar
                                    </Button>
                                    <Button
                                        onClick={() => setShowRechazoModal(true)}
                                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none"
                                    >
                                        <X className="w-4 h-4" /> Rechazar
                                    </Button>
                                </>
                            )}
                            {garantia.estado === 'Pendiente Confirmación Entrega' && (
                                <Button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Confirmar Entrega
                                </Button>
                            )}
                        </>
                    )}

                    {/* Technician & Admin can send to supplier */}
                    {(isAdmin || garantia.tecnicoId === Number(currentUser.id)) && (
                        <>
                            {(garantia.estado === 'Asignado' || garantia.estado === 'En Reparación') && (
                                <Button
                                    onClick={() => setShowEnviarModal(true)}
                                    className="bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none shadow-lg"
                                >
                                    <Truck className="w-4 h-4" /> Proveedor Externo
                                </Button>
                            )}
                            {garantia.estado === 'Enviado a Proveedor' && (
                                <Button
                                    onClick={() => setShowRecibirModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none shadow-lg"
                                >
                                    <Inbox className="w-4 h-4" /> Recibir de Proveedor
                                </Button>
                            )}
                        </>
                    )}

                    {/* Technician specific */}
                    {garantia.tecnicoId === Number(currentUser.id) && (
                        <>
                            {garantia.estado === 'Asignado' && (
                                <Button
                                    onClick={() => handleAction(() => iniciarReparacion(garantia.id), "Iniciaste la reparación")}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none shadow-lg shadow-indigo-900/20"
                                >
                                    <Wrench className="w-4 h-4" /> Iniciar Reparación
                                </Button>
                            )}
                            {garantia.estado === 'En Reparación' && (
                                <Button
                                    onClick={() => setShowRepararModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none shadow-lg shadow-emerald-900/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Completar Trabajo
                                </Button>
                            )}
                            {garantia.estado === 'Reparado' && (
                                <Button
                                    onClick={() => handleAction(() => marcarComoEntregado(garantia.id), "Garantía marcada como entregada")}
                                    className="bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold h-11 px-6 gap-2 border-none shadow-lg shadow-sky-900/20"
                                >
                                    <Truck className="w-4 h-4" /> Marcar Entregado
                                </Button>
                            )}
                        </>
                    )}

                    {garantia.estado !== 'Entregado' && garantia.estado !== 'Cancelado' && (
                        <Button
                            onClick={() => handleAction(() => cancelarGarantia(garantia.id), "Garantía reiniciada")}
                            variant="ghost"
                            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl font-bold h-11 px-6"
                        >
                            Reiniciar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Info Card */}
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden group">
                        <CardHeader className="px-8 pt-8 pb-4 border-b border-slate-50">
                            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:rotate-12 transition-transform">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                Detalle del Equipo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                            <InfoItem label="Cliente" value={garantia.cliente} icon={<User className="w-4 h-4 text-slate-400" />} />
                            <InfoItem label="IMEI / SN" value={garantia.imeiSn} icon={<Shield className="w-4 h-4 text-slate-400" />} isMono />
                            <InfoItem label="Marca" value={garantia.marca || "N/A"} icon={<Tag className="w-4 h-4 text-slate-400" />} />
                            <InfoItem label="Modelo" value={garantia.modelo || "N/A"} icon={<Layers className="w-4 h-4 text-slate-400" />} />

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Problema Reportado
                                </label>
                                <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100 text-sm font-medium text-slate-700 leading-relaxed">
                                    {garantia.problema}
                                </div>
                            </div>

                            {garantia.observaciones && (
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" /> Observaciones Iniciales
                                    </label>
                                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 text-sm font-medium text-slate-500 leading-relaxed italic">
                                        {garantia.observaciones}
                                    </div>
                                </div>
                            )}

                            {(garantia.diagnostico || garantia.solucionAplicada) && (
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest ml-1">Diagnóstico Técnico</label>
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 text-sm font-bold text-indigo-900">
                                            {garantia.diagnostico || "---"}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-emerald-400 tracking-widest ml-1">Solución Realizada</label>
                                        <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-sm font-bold text-emerald-900">
                                            {garantia.solucionAplicada || "---"}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline History */}
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
                        <CardHeader className="px-8 pt-8 pb-4 border-b border-slate-50 bg-slate-50/50">
                            <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <History className="w-5 h-5 text-slate-400" />
                                Bitácora de Movimientos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="relative space-y-8">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />

                                {garantia.historialCambios?.map((it: any, idx: number) => (
                                    <div key={idx} className="relative pl-12">
                                        <div className={cn(
                                            "absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white shadow-sm ring-4 ring-slate-50",
                                            idx === 0 ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                                        )} />
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className={cn("text-[9px] font-black px-2 py-0 h-4 rounded-md uppercase border", getStatusColor(it.estadoNuevo))}>
                                                    {it.estadoNuevo}
                                                </Badge>
                                                {it.estadoAnterior && (
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <ChevronRight className="w-3 h-3" /> {it.estadoAnterior}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-400">{formatDateTime(it.fechaCambio)}</span>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-sm font-bold text-slate-700 leading-snug">{it.observacion}</p>
                                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                                <User className="w-3 h-3" /> Realizado por {it.usuario.name || it.usuario.username}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden text-white bg-slate-900 border-none">
                        <CardHeader className="px-8 pt-8 pb-0">
                            <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <UserCard label="Admin" name={garantia.admin.name || garantia.admin.username} isDark />
                            <UserCard label="Técnico" name={garantia.tecnico?.name || garantia.tecnico?.username} isPrimary isDark />
                            {garantia.supplier && <UserCard label="Proveedor" name={garantia.supplier.name} icon={<Truck className="w-4 h-4" />} isDark />}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
                        <CardHeader className="px-8 pt-8 pb-4 border-b border-slate-50">
                            <CardTitle className="text-lg font-black flex items-center gap-3">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Historial IMEI
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[400px] overflow-y-auto">
                                {equipoHistorial.length > 0 ? equipoHistorial.map((h, i) => (
                                    <div key={i} className="px-8 py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase text-indigo-600">
                                                {h.estado}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {formatDateTime(h.fecha).split(' ')[0]}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 line-clamp-2 leading-tight">
                                            {h.observacion || "---"}
                                        </p>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center opacity-40">
                                        <Shield className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin Antecedentes</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* MODALS */}

            {/* Asignar Técnico */}
            <Dialog open={showAsignarModal} onOpenChange={setShowAsignarModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Asignar Técnico</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <Select value={selectedTecnico} onValueChange={setSelectedTecnico}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {tecnicos.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name || t.username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={!selectedTecnico || isLoading}
                            onClick={() => {
                                handleAction(() => asignarGarantia(garantia.id, Number(selectedTecnico)), "Asignación exitosa");
                                setShowAsignarModal(false);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black text-lg"
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enviar a Proveedor */}
            <Dialog open={showEnviarModal} onOpenChange={setShowEnviarModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Enviar a Proveedor</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold">
                                <SelectValue placeholder="Seleccionar Proveedor..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {suppliers.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Notas para el envío..."
                            value={obsProveedor}
                            onChange={(e) => setObsProveedor(e.target.value)}
                            className="min-h-[100px] bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold focus-visible:ring-slate-900/10"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={!selectedSupplier || isLoading}
                            onClick={() => {
                                handleAction(() => enviarAProveedor(garantia.id, Number(selectedSupplier), obsProveedor), "Enviado a proveedor");
                                setShowEnviarModal(false);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black"
                        >
                            Enviar Equipo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Recibir de Proveedor */}
            <Dialog open={showRecibirModal} onOpenChange={setShowRecibirModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-md shadow-2xl text-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Recibir de Proveedor</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <Select value={resultadoProveedor} onValueChange={setResultadoProveedor}>
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold">
                                <SelectValue placeholder="Estado Resultado..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="Reparado">✅ Reparado</SelectItem>
                                <SelectItem value="No Reparado">❌ No Reparado</SelectItem>
                                <SelectItem value="Usado para Piezas">⚙️ Usado para Piezas</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Comentarios del proveedor..."
                            value={obsProveedor}
                            onChange={(e) => setObsProveedor(e.target.value)}
                            className="min-h-[100px] bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={isLoading}
                            onClick={() => {
                                handleAction(() => recibirDeProveedor(garantia.id, resultadoProveedor, undefined, obsProveedor), "Recibido satisfactoriamente");
                                setShowRecibirModal(false);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black"
                        >
                            Confirmar Recepción
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmar Entrega Admin */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-emerald-600">Confirmar Entrega</DialogTitle>
                        <DialogDescription className="font-bold">
                            ¿Confirmas que el cliente ha recibido su equipo satisfactoriamente?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="ghost" className="flex-1 rounded-2xl" onClick={() => setShowConfirmModal(false)}>No, aún no</Button>
                        <Button
                            className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 font-black"
                            onClick={() => {
                                handleAction(() => confirmarEntrega(garantia.id), "Garantía entregada y finalizada");
                                setShowConfirmModal(false);
                            }}
                        >
                            Sí, Entregado
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-rose-600">Eliminar Garantía</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">
                            Esta acción es irreversible. Se eliminará todo el historial y registros.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6">
                        <Button
                            variant="ghost"
                            className="rounded-2xl h-12 px-6 font-bold"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-14 px-8 font-black"
                            onClick={() => {
                                handleAction(() => eliminarGarantia(garantia.id), "Eliminado correctamente");
                                router.push("/garantias");
                            }}
                        >
                            Confirmar Eliminación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Technical Forms (Reparar/Rechazar) */}
            <Dialog open={showRepararModal} onOpenChange={setShowRepararModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800">Finalizar Trabajo</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Diagnóstico Final</label>
                            <Textarea
                                value={diagnostico}
                                onChange={(e) => setDiagnostico(e.target.value)}
                                placeholder="Qué encontraste..."
                                className="min-h-[100px] bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Solución</label>
                            <Textarea
                                value={solucion}
                                onChange={(e) => setSolucion(e.target.value)}
                                placeholder="Qué hiciste..."
                                className="min-h-[100px] bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={!diagnostico || !solucion || isLoading}
                            onClick={() => {
                                handleAction(() => completarReparacion(garantia.id, { diagnostico, solucionAplicada: solucion }), "Enviado a revisión");
                                setShowRepararModal(false);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-black"
                        >
                            Enviar a Aprobación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rechazo Modal */}
            <Dialog open={showRechazoModal} onOpenChange={setShowRechazoModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-rose-600 tracking-tight">Rechazar Trabajo</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <Textarea
                            value={razonRechazo}
                            onChange={(e) => setRazonRechazo(e.target.value)}
                            placeholder="Motivo del rechazo..."
                            className="min-h-[140px] bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={!razonRechazo || isLoading}
                            onClick={() => {
                                handleAction(() => rechazarGarantia(garantia.id, razonRechazo), "Rechazado satisfactoriamente");
                                setShowRechazoModal(false);
                            }}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-14 font-black shadow-lg"
                        >
                            Confirmar Rechazo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

function InfoItem({ label, value, icon, isMono }: any) {
    return (
        <div className="space-y-1.5 flex flex-col items-start">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                {icon} {label}
            </p>
            <p className={cn(
                "font-black text-slate-800",
                isMono ? "font-mono text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-100" : "text-base tracking-tight"
            )}>
                {value}
            </p>
        </div>
    );
}

function UserCard({ label, name, icon, isPrimary, isDark }: any) {
    return (
        <div className={cn(
            "p-5 rounded-3xl border transition-all flex items-center gap-4",
            isPrimary ? "bg-indigo-600 shadow-xl shadow-indigo-500/20 border-none" : (isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")
        )}>
            <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black",
                isPrimary ? "bg-white text-indigo-600" : (isDark ? "bg-white/10 text-white" : "bg-white text-slate-400 shadow-sm")
            )}>
                {icon ? icon : (name ? name[0].toUpperCase() : "?")}
            </div>
            <div>
                <p className={cn("text-[9px] font-black uppercase tracking-widest", isPrimary || isDark ? "text-slate-400" : "text-slate-300")}>{label}</p>
                <p className={cn("text-sm font-black truncate max-w-[140px]", isPrimary || isDark ? "text-white" : "text-slate-700")}>
                    {name || "---"}
                </p>
            </div>
        </div>
    );
}
