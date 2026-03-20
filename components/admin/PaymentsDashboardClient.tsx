"use client";

import { useState } from "react";
import {
    DollarSign, Users, TrendingUp, Search, PlusCircle,
    ArrowLeft, Settings, FileText, ChevronRight, AlertCircle,
    Printer, CreditCard, X, User as UserIcon, CheckCircle2,
    Clock, RefreshCw, Send, ExternalLink, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markAsRedeemed, cancelWithdrawal, applyPenaltyByImei, applyExternalPenalty, getPenaltyDataByImei, revertPenalty, revertExternalPenalty } from "@/app/actions/admin-payments";
import { manualCredit, adminManualWithdrawal } from "@/app/actions/wallet";

export function PaymentsDashboardClient({ data }: { data: any }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal states
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<any>(null);

    // Form states
    const [monto, setMonto] = useState("");
    const [concepto, setConcepto] = useState("");
    const [showPayConfirmModal, setShowPayConfirmModal] = useState(false);
    const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);

    // Penalty states
    const [imeiSearch, setImeiSearch] = useState("");
    const [penaltyData, setPenaltyData] = useState<any>(null);
    const [penaltyMotivo, setPenaltyMotivo] = useState("");
    const [penaltyMonto, setPenaltyMonto] = useState("500");
    const [isSearchingImei, setIsSearchingImei] = useState(false);

    // External Penalty States
    const [showExternalPenalty, setShowExternalPenalty] = useState(false);
    const [extImei, setExtImei] = useState("");
    const [extModelo, setExtModelo] = useState("");
    const [extTecnicoId, setExtTecnicoId] = useState("");
    const [extMotivo, setExtMotivo] = useState("");
    const [extMonto, setExtMonto] = useState("");

    const { technicians, pendingRetiros, stats } = data;

    const filteredTecnicos = technicians.filter((t: any) =>
        (t.name || t.username).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMarkAsPaid = async (transactionId: number) => {
        setPendingTransactionId(transactionId);
        setShowPayConfirmModal(true);
    };

    const confirmRedeem = async () => {
        if (!pendingTransactionId) return;

        setIsProcessing(true);
        try {
            const res = await markAsRedeemed(pendingTransactionId);
            if (res.success) {
                toast.success("Pago marcado como CANJEADO con éxito");
                setShowPayConfirmModal(false);
                setPendingTransactionId(null);
                router.refresh();
            } else {
                toast.error((res as any).error || "Error al procesar");
            }
        } catch (error) {
            toast.error("Error al procesar el pago");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelWithdrawal = async (id: number) => {
        if (!confirm("¿Estás seguro de que deseas anular esta solicitud y devolver el dinero al balance?")) return;
        setIsProcessing(true);
        try {
            const res = await cancelWithdrawal(id);
            if (res.success) {
                toast.success("Solicitud anulada y dinero devuelto al balance");
                router.refresh();
            } else {
                toast.error((res as any).error || "Error al anular");
            }
        } catch (error) {
            toast.error("Ocurrió un error en la anulación");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAccreditation = async () => {
        if (!monto || parseFloat(monto) <= 0) return toast.error("Monto inválido");
        setIsProcessing(true);
        try {
            const res = await manualCredit(selectedTecnico.id, parseFloat(monto));
            if (res.success) {
                toast.success("Acreditación manual realizada con éxito");
                setShowCreditModal(false);
                setMonto("");
                router.refresh();
            } else toast.error((res as any).error);
        } catch (error) {
            toast.error("Error al acreditar");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualWithdrawal = async () => {
        if (!monto || parseFloat(monto) <= 0) return toast.error("Monto inválido");
        setIsProcessing(true);
        try {
            const res = await adminManualWithdrawal(selectedTecnico.id, parseFloat(monto), concepto);
            if (res.success) {
                toast.success("Retiro manual realizado con éxito");
                setShowWithdrawModal(false);
                setMonto("");
                setConcepto("");
                router.refresh();
            } else toast.error((res as any).error);
        } catch (error) {
            toast.error("Error al retirar");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSearchImei = async () => {
        if (!imeiSearch) return;
        setIsSearchingImei(true);
        setPenaltyData(null);
        try {
            const res = await getPenaltyDataByImei(imeiSearch);
            if (res.success) {
                setPenaltyData(res);
            } else {
                toast.error(res.error || "No se encontró información");
            }
        } catch (error) {
            toast.error("Error en la búsqueda");
        } finally {
            setIsSearchingImei(false);
        }
    };

    const handleApplyPenalty = async () => {
        if (!penaltyMotivo) return toast.error("Ingresa un motivo");
        setIsProcessing(true);
        try {
            const res = await applyPenaltyByImei(imeiSearch, penaltyMotivo, parseFloat(penaltyMonto));
            if (res.success) {
                toast.success(`Penalidad aplicada a ${(res as any).tecnico}`);
                setImeiSearch("");
                setPenaltyData(null);
                setPenaltyMotivo("");
                router.refresh();
            } else toast.error((res as any).error);
        } catch (error) {
            toast.error("Error al aplicar penalidad");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyExternalPenalty = async () => {
        if (!extImei || !extModelo || !extTecnicoId || !extMonto || !extMotivo) {
            return toast.error("Completa todos los campos");
        }
        setIsProcessing(true);
        try {
            const res = await applyExternalPenalty({
                imei: extImei,
                modelo: extModelo,
                tecnicoId: parseInt(extTecnicoId),
                monto: parseFloat(extMonto),
                motivo: extMotivo
            });
            if (res.success) {
                toast.success("Penalidad externa aplicada con éxito");
                setShowExternalPenalty(false);
                setExtImei("");
                setExtModelo("");
                setExtMotivo("");
                setExtMonto("");
                router.refresh();
            } else toast.error((res as any).error);
        } catch (error) {
            toast.error("Error al aplicar penalidad externa");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRevertPenalty = async (id: number, isExternal: boolean = false) => {
        if (!confirm("¿Estás seguro de que deseas revertir esta penalidad? El saldo será devuelto al técnico.")) return;

        setIsProcessing(true);
        try {
            const res = isExternal ? await revertExternalPenalty(id) : await revertPenalty(id);
            if (res.success) {
                toast.success("Penalidad revertida y saldo devuelto.");
                router.refresh();
            } else {
                toast.error((res as any).error || "Error al revertir");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        Gestión de Pagos
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2 tracking-wide flex items-center gap-2">
                        Control total de billeteras, retiros y penalidades.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.refresh()}
                        className="h-12 w-12 rounded-2xl border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
                    >
                        <RefreshCw className={cn("w-5 h-5", isProcessing && "animate-spin")} />
                    </Button>
                    <Link href="/garantias/config/pago">
                        <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg">
                            <Settings className="w-4 h-4" /> Configurar Tarifas
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-slate-100 p-1.5 rounded-[1.5rem] h-auto w-full md:w-auto">
                    <TabsTrigger value="overview" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 transition-all">
                        <TrendingUp className="w-4 h-4 mr-2" /> Resumen
                    </TabsTrigger>
                    <TabsTrigger value="technicians" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 transition-all">
                        <Users className="w-4 h-4 mr-2" /> Técnicos
                    </TabsTrigger>
                    <TabsTrigger value="penalties" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 transition-all">
                        <AlertCircle className="w-4 h-4 mr-2" /> Penalidades
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "Deuda Pendiente Total", val: `RD$ ${stats.totalPendingPayout.toLocaleString()}`, icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
                            { label: "Canjeado Últ. 30 días", val: `RD$ ${stats.recentEarnings.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                            { label: "Solicitudes de Retiro", val: stats.pendingRetirosCount, icon: Bell, color: "text-indigo-600", bg: "bg-indigo-50" },
                        ].map((stat, i) => (
                            <Card key={i} className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className={cn("p-4 rounded-2xl shadow-inner transition-transform group-hover:scale-110 duration-500", stat.bg, stat.color)}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                                        <p className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.val}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Solicitudes de Retiro (Baucher Flow) */}
                    {pendingRetiros.length > 0 ? (
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2">
                                <Clock className="text-indigo-500" /> Solicitudes Pendientes de Canje
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {pendingRetiros.map((retiro: any) => (
                                    <Card key={retiro.id} className="rounded-[1.5rem] border border-indigo-100 bg-white shadow-lg h-full transition-all hover:bg-slate-50 group">
                                        <CardContent className="p-5 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                    {(retiro.tecnico.name || retiro.tecnico.username).substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <Link href={`/admin/pagos/${retiro.tecnicoId}`} className="hover:underline">
                                                        <p className="font-bold text-slate-900 leading-none mb-1">
                                                            {retiro.tecnico.name || retiro.tecnico.username}
                                                        </p>
                                                    </Link>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{retiro.descripcion || "Retiro de Wallet"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-6">
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900 leading-none">RD$ {retiro.monto.toLocaleString()}</p>
                                                    <p className="text-[9px] text-indigo-400 font-bold mt-1 uppercase">Token: {retiro.secureToken?.substring(0, 8)}...</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={() => handleCancelWithdrawal(retiro.id)}
                                                        disabled={isProcessing}
                                                        variant="ghost"
                                                        className="h-12 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black flex items-center gap-2 border border-rose-100"
                                                    >
                                                        <X size={18} /> Anular
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleMarkAsPaid(retiro.id)}
                                                        disabled={isProcessing}
                                                        className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black flex items-center gap-2 shadow-lg shadow-emerald-200/50"
                                                    >
                                                        <CheckCircle2 size={18} /> Marcar como Pagado
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className="p-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No hay solicitudes de retiro pendientes.</p>
                        </div>
                    )}
                </TabsContent>



                <TabsContent value="technicians" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Técnicos Table */}
                    <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <CardTitle className="text-2xl font-black text-slate-800">Directorio de Pagos</CardTitle>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar técnico..."
                                        className="h-11 pl-10 bg-slate-50 border-none rounded-xl font-bold"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Técnico</th>
                                        <th className="pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Rol</th>
                                        <th className="pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Balance</th>
                                        <th className="pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Total Ganado</th>
                                        <th className="pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">Tarifa</th>
                                        <th className="pb-4 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTecnicos.map((tecnico: any) => (
                                        <tr key={tecnico.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs overflow-hidden">
                                                        {tecnico.profileImage ? (
                                                            <img src={tecnico.profileImage} alt={tecnico.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            (tecnico.name || tecnico.username).substring(0, 2).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{tecnico.name || tecnico.username}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tecnico.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase px-2 py-0.5 border-slate-200">
                                                    {tecnico.role.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <p className="font-black text-slate-900">RD$ {tecnico.balance.toLocaleString()}</p>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <p className="font-bold text-indigo-600">RD$ {tecnico.totalEarned.toLocaleString()}</p>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                {tecnico.config ? (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg font-black text-[10px]">
                                                        RD$ {tecnico.config.montoPorReparacion}/eq
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 font-bold">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => { setSelectedTecnico(tecnico); setShowCreditModal(true); }}
                                                        title="Acreditar Manualmente"
                                                    >
                                                        <PlusCircle size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50"
                                                        onClick={() => { setSelectedTecnico(tecnico); setShowWithdrawModal(true); }}
                                                        title="Retiro Manual"
                                                    >
                                                        <DollarSign size={16} />
                                                    </Button>
                                                    <Link href={`/admin/pagos/${tecnico.id}`}>
                                                        <Button
                                                            variant="outline" size="sm"
                                                            className="h-8 px-3 rounded-lg text-slate-600 hover:bg-slate-100 border-slate-200 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                                                            title="Ver Historial de Pagos"
                                                        >
                                                            <Clock size={12} /> Historial
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="penalties" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Penalty search by IMEI */}
                        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden p-8">
                            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                <Search className="text-indigo-600" /> Aplicar Penalidad por IMEI
                            </h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <Input
                                            value={imeiSearch}
                                            onChange={(e) => setImeiSearch(e.target.value)}
                                            placeholder="Ingresa el IMEI del equipo..."
                                            className="h-14 pl-6 bg-slate-50 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchImei()}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearchImei}
                                        disabled={isSearchingImei || !imeiSearch}
                                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100"
                                    >
                                        {isSearchingImei ? <RefreshCw className="animate-spin" /> : "Buscar Técnico"}
                                    </Button>
                                </div>

                                {penaltyData && (
                                    <div className="animate-in fade-in zoom-in-95 duration-300">
                                        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                                                        <UserIcon className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Técnico Responsable</p>
                                                        <p className="text-xl font-black text-slate-800">{penaltyData.tecnico.name || penaltyData.tecnico.username}</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase">
                                                    Última Revisión
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1">Equipo</p>
                                                    <p className="text-slate-800">{penaltyData.equipo.marca} {penaltyData.equipo.modelo}</p>
                                                </div>
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1">Observación Original</p>
                                                    <p className="text-slate-500 line-clamp-1 italic">"{penaltyData.revision.observacion || 'Sin observación'}"</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Motivo de Penalidad</label>
                                                        <Input
                                                            value={penaltyMotivo}
                                                            onChange={(e) => setPenaltyMotivo(e.target.value)}
                                                            placeholder="Ej: IMEI invertido, Pantalla rayada..."
                                                            className="h-12 bg-white border-2 border-slate-100 rounded-xl font-bold focus:border-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Monto (RD$)</label>
                                                        <Input
                                                            type="number"
                                                            value={penaltyMonto}
                                                            onChange={(e) => setPenaltyMonto(e.target.value)}
                                                            className="h-12 bg-white border-2 border-slate-100 rounded-xl font-black focus:border-indigo-500"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleApplyPenalty}
                                                    disabled={isProcessing}
                                                    className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-rose-100 transition-all active:scale-[0.98]"
                                                >
                                                    Confirmar Penalidad de RD$ {penaltyMonto}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Penalidades Externas / Acciones rápidas */}
                        <div className="space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 overflow-hidden text-white p-8 group">
                                <div className="flex flex-col h-full justify-between gap-8">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 tracking-tight">Penalidad Externa</h3>
                                        <p className="text-slate-400 font-medium text-sm">Aplica sanciones por equipos que no están en el sistema o errores administrativos.</p>
                                    </div>
                                    <Button
                                        onClick={() => setShowExternalPenalty(true)}
                                        className="h-14 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black text-lg transition-transform group-hover:scale-105 duration-300"
                                    >
                                        Crear Penalidad Manual
                                    </Button>
                                </div>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden p-8 border-l-4 border-l-indigo-600">
                                <h4 className="font-black text-slate-800 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-indigo-600" /> Nota del Sistema
                                </h4>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                    Las penalidades descuentan el saldo inmediatamente y se marcan como <span className="text-indigo-600 underline">CANJEADAS</span>. No requieren aprobación manual posterior por parte del administrador.
                                </p>
                            </Card>
                        </div>
                    </div>

                    {/* Historial de Penalidades Recientes */}
                    <div className="mt-12 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Clock className="text-rose-500" /> Historial Reciente de Penalidades
                            </h3>
                            <Link href="/admin/penalidades">
                                <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-[0.1em] text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                                    Ver Todas
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6">
                                <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center justify-between">
                                    <span>Internas (Por IMEI)</span>
                                    <Badge className="bg-slate-100 text-slate-500 border-none text-[9px]">Últimas 5</Badge>
                                </h4>
                                <div className="space-y-4">
                                    {data.recentPenalties.map((p: any) => (
                                        <div key={p.id} className="group relative flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-900 text-sm leading-none">{p.tecnico.name || p.tecnico.username}</p>
                                                    <span className="text-[10px] text-slate-400 font-medium">• {new Date(p.fecha).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">{p.equipo.modelo} - {p.equipo.imei}</p>
                                                <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                                                    <p className="text-[11px] font-bold text-rose-700 leading-tight">
                                                        <span className="opacity-50 uppercase text-[9px] mr-1">Motivo:</span>
                                                        {p.motivo}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2 ml-4">
                                                <p className="font-black text-rose-600 text-lg tracking-tighter">- RD$ {p.monto}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevertPenalty(p.id)}
                                                    disabled={isProcessing}
                                                    className="h-7 text-[9px] font-black uppercase text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg px-2"
                                                >
                                                    Deshacer
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {data.recentPenalties.length === 0 && <p className="text-center text-slate-300 py-10 font-bold italic text-sm">Sin registros recientes</p>}
                                </div>
                            </Card>

                            <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6">
                                <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center justify-between">
                                    <span>Externas (Manuales)</span>
                                    <Badge className="bg-slate-100 text-slate-500 border-none text-[9px]">Últimas 5</Badge>
                                </h4>
                                <div className="space-y-4">
                                    {data.recentExternalPenalties.map((p: any) => (
                                        <div key={p.id} className="group relative flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-900 text-sm leading-none">{p.culpable}</p>
                                                    <span className="text-[10px] text-slate-400 font-medium">• {new Date(p.fecha).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">{p.modelo} - {p.imei}</p>
                                                <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                                    <p className="text-[11px] font-bold text-amber-800 leading-tight">
                                                        <span className="opacity-50 uppercase text-[9px] mr-1">Motivo:</span>
                                                        {p.motivo}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2 ml-4">
                                                <p className="font-black text-rose-600 text-lg tracking-tighter">- RD$ {p.cantidad}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevertPenalty(p.id, true)}
                                                    disabled={isProcessing}
                                                    className="h-7 text-[9px] font-black uppercase text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg px-2"
                                                >
                                                    Deshacer
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {data.recentExternalPenalties.length === 0 && <p className="text-center text-slate-300 py-10 font-bold italic text-sm">Sin registros recientes</p>}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <Dialog open={showExternalPenalty} onOpenChange={setShowExternalPenalty}>
                <DialogContent className="rounded-[2rem] max-w-lg bg-white border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Penalidad Externa Manual</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">
                            Completa los datos para sancionar a un técnico manualmente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">IMEI (Manual)</label>
                            <Input value={extImei} onChange={(e) => setExtImei(e.target.value)} placeholder="0000000..." className="h-12 rounded-xl focus:ring-indigo-600 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Modelo</label>
                            <Input value={extModelo} onChange={(e) => setExtModelo(e.target.value)} placeholder="iPhone 13..." className="h-12 rounded-xl focus:ring-indigo-600 font-bold" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Técnico Culpable</label>
                            <Select onValueChange={setExtTecnicoId}>
                                <SelectTrigger className="h-12 rounded-xl font-bold">
                                    <SelectValue placeholder="Selecciona el técnico..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.filter((t: any) => t.role === 'control_calidad').map((t: any) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name || t.username}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto a Sancionar</label>
                            <Input type="number" value={extMonto} onChange={(e) => setExtMonto(e.target.value)} placeholder="500" className="h-12 rounded-xl focus:ring-indigo-600 font-black" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motivo</label>
                            <Input value={extMotivo} onChange={(e) => setExtMotivo(e.target.value)} placeholder="Dañó flex..." className="h-12 rounded-xl focus:ring-indigo-600 font-bold" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowExternalPenalty(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            onClick={handleApplyExternalPenalty}
                            disabled={isProcessing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black px-8 h-12 shadow-lg shadow-indigo-100"
                        >
                            Aplicar Sanción
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modals */}
            <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
                <DialogContent className="rounded-[2rem] bg-white border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Acreditar Saldo</DialogTitle>
                        <DialogDescription className="font-bold text-slate-700">
                            Ingresa el monto que deseas sumar al balance de <span className="text-indigo-600">{(selectedTecnico?.name || selectedTecnico?.username)}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Monto (RD$)</label>
                            <Input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="0.00"
                                className="h-12 rounded-xl border-slate-200 font-bold text-lg focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCreditModal(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            onClick={handleAccreditation}
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold px-8 h-12 shadow-lg shadow-emerald-200"
                        >
                            Confirmar Acreditación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                <DialogContent className="rounded-[2rem] bg-white border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Retiro Manual</DialogTitle>
                        <DialogDescription className="font-bold text-rose-600 bg-rose-50 p-4 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <span>Esto descontará dinero del balance actual del técnico. Úsalo cuando realices pagos fuera del sistema.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Monto (RD$)</label>
                            <Input
                                type="number"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="0.00"
                                className="h-12 rounded-xl border-slate-200 font-bold text-lg focus:ring-rose-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Concepto / Referencia</label>
                            <Input
                                value={concepto}
                                onChange={(e) => setConcepto(e.target.value)}
                                placeholder="Ej: Pago fuera de sistema, Penalidad, etc."
                                className="h-11 rounded-xl border-slate-200 font-medium"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowWithdrawModal(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button
                            onClick={handleManualWithdrawal}
                            disabled={isProcessing}
                            className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold px-8 h-12 shadow-lg shadow-rose-200"
                        >
                            Confirmar Retiro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showPayConfirmModal} onOpenChange={setShowPayConfirmModal}>
                <DialogContent className="rounded-[2.5rem] bg-white border-none shadow-2xl p-0 overflow-hidden max-w-md">
                    <div className="bg-emerald-600 h-32 flex items-center justify-center relative outline-none">
                        <div className="bg-white p-5 rounded-[2rem] shadow-2xl z-10">
                            <CheckCircle2 size={48} className="text-emerald-600 animate-bounce" />
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8" />
                    </div>
                    <div className="p-10 pt-8 flex flex-col items-center text-center">
                        <DialogHeader>
                            <DialogTitle className="text-4xl font-black text-slate-900 tracking-tight">
                                ¿Confirmar Pago?
                            </DialogTitle>
                            <DialogDescription className="text-lg font-bold text-slate-600 mt-4 px-2 leading-relaxed">
                                Estás a punto de marcar este baucher como <span className="text-emerald-600 underline underline-offset-4 decoration-2">PAGADO</span>. Asegúrate de haber entregado el efectivo personalmente.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="w-full bg-slate-50 rounded-3xl p-5 mt-8 border border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado Final</span>
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-lg text-[9px] font-bold uppercase">Completado</Badge>
                            </div>
                            <p className="text-xs font-bold text-slate-500 text-left">Esta acción es irreversible. El balance del técnico <span className="text-indigo-600">ya fue descontado</span> al momento de generar este baucher.</p>
                        </div>

                        <div className="flex flex-col w-full gap-3 mt-8">
                            <Button
                                onClick={confirmRedeem}
                                disabled={isProcessing}
                                className="h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transition-all active:scale-95"
                            >
                                {isProcessing ? <RefreshCw className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                                Confirmar y Canjear
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowPayConfirmModal(false)}
                                className="h-14 rounded-2xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                            >
                                Volver atrás
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-6">
                <div className={cn("p-4 rounded-2xl shadow-inner transition-transform group-hover:scale-110 duration-500", bg, color)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
                    <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
