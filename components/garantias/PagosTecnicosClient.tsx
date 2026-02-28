"use client";

import { useState } from "react";
import {
    DollarSign, Users, TrendingUp, Search, PlusCircle,
    ArrowLeft, Settings, FileText, ChevronRight, AlertCircle,
    Printer, CreditCard, X, User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { manualCredit, adminManualWithdrawal } from "@/app/actions/wallet";

export function PagosTecnicosClient({ tecnicos }: any) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<any>(null);

    // Form states
    const [monto, setMonto] = useState("");
    const [concepto, setConcepto] = useState("");

    const filteredTecnicos = tecnicos.filter((t: any) =>
        (t.name || t.username).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBalance = tecnicos.reduce((acc: number, t: any) => acc + t.balance, 0);
    const avgTarifa = tecnicos.filter((t: any) => t.config).length > 0
        ? tecnicos.reduce((acc: number, t: any) => acc + (t.config?.montoPorReparacion || 0), 0) / tecnicos.filter((t: any) => t.config).length
        : 0;

    const handleAction = async (actionFn: () => Promise<any>, successMsg: string) => {
        setIsLoading(true);
        try {
            const res = await actionFn();
            if (res.success) {
                toast.success(successMsg);
                resetForms();
                router.refresh();
            } else {
                toast.error(res.error || "Error al procesar la transacción");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForms = () => {
        setMonto("");
        setConcepto("");
        setSelectedTecnico(null);
        setShowCreditModal(false);
        setShowWithdrawModal(false);
    };

    const openCreditModal = (tecnico?: any) => {
        setSelectedTecnico(tecnico || null);
        setConcepto("Acreditación manual por administrador");
        setShowCreditModal(true);
    };

    const openWithdrawModal = (tecnico: any) => {
        setSelectedTecnico(tecnico);
        setConcepto("Pago semanal");
        setShowWithdrawModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 rounded-[1.5rem] text-emerald-600 shadow-xl shadow-emerald-100/50">
                        <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                            Pagos a Técnicos
                        </h1>
                        <p className="text-slate-400 font-bold flex items-center gap-2">
                            Gestión de balances y conciliación <ChevronRight className="w-4 h-4" />
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => openCreditModal()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 px-8 gap-2 font-bold text-lg shadow-lg shadow-emerald-200"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Nuevo Ingreso
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Deuda Pendiente"
                    value={`RD$ ${totalBalance.toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="bg-emerald-600"
                />
                <StatCard
                    label="Técnicos Activos"
                    value={tecnicos.length}
                    icon={<Users className="w-5 h-5" />}
                    color="bg-blue-600"
                />
                <StatCard
                    label="Tarifa Promedio"
                    value={`RD$ ${avgTarifa.toFixed(2)}`}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="bg-indigo-600"
                />
            </div>

            {/* Filters */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white p-2">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar técnico por nombre o usuario..."
                            className="h-14 pl-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus-visible:ring-slate-900/10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Technician List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredTecnicos.length > 0 ? filteredTecnicos.map((t: any) => (
                    <Card key={t.id} className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 group bg-white border border-slate-50">
                        <div className="flex flex-col lg:flex-row lg:items-center">
                            {/* Profile Section */}
                            <div className="p-8 flex items-center gap-6 flex-1 min-w-[300px]">
                                <div className="relative">
                                    <div className="h-20 w-20 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        {(t.name || t.username).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-emerald-500 border-4 border-white flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">
                                        {t.name || 'Sin nombre'}
                                    </h3>
                                    <p className="text-slate-400 font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                                        <UserIcon className="w-4 h-4 text-indigo-400" /> {t.username}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:flex items-center gap-2 px-8 py-6 lg:py-0 bg-slate-50/50 border-y lg:border-y-0 lg:border-x border-slate-100/50">
                                <div className="lg:w-48 p-4">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-2 px-1">Balance</p>
                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                        <p className="text-xl font-bold text-slate-800 tracking-tighter">
                                            RD$ {t.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                                <div className="lg:w-48 p-4">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-2 px-1 text-right lg:text-left">Tarifa / Rep.</p>
                                    {t.config ? (
                                        <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50 shadow-sm flex flex-col items-end lg:items-start overflow-hidden relative">
                                            <p className="text-xl font-bold text-emerald-600 tracking-tighter relative z-10">
                                                RD$ {t.config.montoPorReparacion.toFixed(2)}
                                            </p>
                                            <div className="absolute top-0 right-0 w-8 h-8 -mr-2 -mt-2 bg-emerald-500/10 rounded-full blur-xl" />
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-center justify-center lg:justify-start gap-2 shadow-sm">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-widest leading-none">Sin tarifa</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="p-8 lg:w-72 flex items-center justify-center lg:justify-end gap-3 bg-white">
                                <Link href={`/garantias/pagos/${t.id}/transacciones`} className="h-12 w-12">
                                    <Button
                                        variant="outline" size="icon"
                                        className="h-12 w-12 rounded-2xl border-indigo-100 bg-white text-indigo-500 hover:bg-indigo-600 hover:text-white shadow-sm transition-all duration-300"
                                        title="Historial de Transacciones"
                                    >
                                        <FileText className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => openWithdrawModal(t)}
                                    variant="outline" size="icon"
                                    className="h-12 w-12 rounded-2xl border-rose-100 bg-white text-rose-500 hover:bg-rose-600 hover:text-white shadow-sm transition-all duration-300"
                                    title="Realizar Pago"
                                >
                                    <DollarSign className="w-5 h-5" />
                                </Button>
                                <Button
                                    onClick={() => openCreditModal(t)}
                                    variant="outline" size="icon"
                                    className="h-12 w-12 rounded-2xl border-emerald-100 bg-white text-emerald-500 hover:bg-emerald-600 hover:text-white shadow-sm transition-all duration-300"
                                    title="Acreditación Manual"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                </Button>
                                <Link href={`/garantias/config/pago/${t.id}`}>
                                    <Button
                                        variant="outline" size="icon"
                                        className="h-12 w-12 rounded-2xl border-slate-200 bg-white text-slate-400 hover:bg-slate-900 hover:text-white shadow-sm transition-all duration-300"
                                        title="Configuración de Pagos"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="py-24 text-center">
                        <p className="text-slate-400 font-bold italic">No se encontraron técnicos.</p>
                    </div>
                )}
            </div>

            {/* MODALS */}

            {/* Acreditar Modal */}
            <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-0 overflow-hidden sm:max-w-lg shadow-2xl bg-slate-50">
                    <div className="p-8 bg-white border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-bold text-slate-800 flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                                    <CreditCard className="w-8 h-8" />
                                </div>
                                Acreditar Pago
                            </DialogTitle>
                            <DialogDescription className="font-bold text-slate-400 mt-2">
                                Ingresar dinero al balance del técnico beneficiario.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Técnico Beneficiario</label>
                            {selectedTecnico ? (
                                <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-100">
                                        {(selectedTecnico.name || selectedTecnico.username).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg leading-none">{selectedTecnico.name || selectedTecnico.username}</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{selectedTecnico.username}</p>
                                    </div>
                                </div>
                            ) : (
                                <Select onValueChange={(val) => setSelectedTecnico(tecnicos.find((t: any) => t.id === Number(val)))}>
                                    <SelectTrigger className="h-16 bg-white border-slate-100 rounded-3xl font-bold shadow-sm px-6">
                                        <SelectValue placeholder="Seleccionar técnico..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-3xl border-slate-100">
                                        {tecnicos.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id.toString()} className="rounded-xl my-1">{t.name || t.username}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Monto (RD$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                                    <Input
                                        type="number"
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                        placeholder="0.00"
                                        className="h-16 bg-white border-slate-100 rounded-3xl pl-12 pr-6 font-bold text-2xl text-emerald-600 shadow-sm focus-visible:ring-emerald-500/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Concepto corto
                                </label>
                                <Input
                                    value={concepto}
                                    onChange={(e) => setConcepto(e.target.value)}
                                    placeholder="Motivo..."
                                    className="h-16 bg-white border-slate-100 rounded-3xl px-6 font-bold shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white border-t border-slate-100">
                        <Button
                            disabled={!selectedTecnico || !monto || isLoading}
                            onClick={() => handleAction(
                                () => manualCredit(Number(selectedTecnico.id), Number(monto)),
                                "Acreditación realizada exitosamente"
                            )}
                            className="w-full bg-slate-900 hover:bg-black text-white rounded-[2rem] h-16 font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-200"
                        >
                            Confirmar Ingreso
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Pagar/Retirar Modal */}
            <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-0 overflow-hidden sm:max-w-lg shadow-2xl bg-slate-50">
                    <div className="p-8 bg-white border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-bold text-slate-800 flex items-center gap-4">
                                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                    <DollarSign className="w-8 h-8" />
                                </div>
                                Pago al Técnico
                            </DialogTitle>
                            <DialogDescription className="font-bold text-slate-400 mt-2">
                                Registrar retiro de fondos del balance del técnico.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 -mt-12 -mr-12 rounded-full bg-emerald-500/20 blur-3xl group-hover:bg-emerald-500/40 transition-all duration-700" />
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-4 opacity-50 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    <span>Titular de Cuenta</span>
                                    <span>Fondo Disponible</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-bold tracking-tight">{selectedTecnico?.name || selectedTecnico?.username}</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-emerald-400 tracking-tighter leading-none">
                                            RD$ {selectedTecnico?.balance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Monto a Retirar (RD$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-600" />
                                    <Input
                                        type="number"
                                        value={monto}
                                        max={selectedTecnico?.balance}
                                        onChange={(e) => setMonto(e.target.value)}
                                        placeholder="0.00"
                                        className="h-16 bg-white border-slate-100 rounded-3xl pl-12 pr-6 font-bold text-2xl text-rose-600 shadow-sm focus-visible:ring-rose-500/20"
                                    />
                                </div>
                                {Number(monto) > (selectedTecnico?.balance || 0) && (
                                    <p className="text-[10px] text-rose-500 font-bold ml-1 animate-bounce flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> El monto excede el balance disponible
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Concepto / Referencia</label>
                                <Input
                                    value={concepto}
                                    onChange={(e) => setConcepto(e.target.value)}
                                    placeholder="Ej: Pago de semana #08"
                                    className="h-16 bg-white border-slate-100 rounded-3xl px-6 font-bold shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white border-t border-slate-100">
                        <Button
                            disabled={!monto || isLoading || Number(monto) > (selectedTecnico?.balance || 0)}
                            onClick={() => handleAction(
                                () => adminManualWithdrawal(Number(selectedTecnico.id), Number(monto), concepto),
                                "Pago realizado y balance actualizado"
                            )}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] h-16 font-bold text-lg shadow-xl shadow-rose-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Printer className="w-6 h-6 mr-3" /> Generar Pago & Recibo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden relative group">
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mt-12 -mr-12 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700", color)} />
            <CardContent className="p-8">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4", color)}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-bold text-slate-800 tracking-tighter mt-1">{value}</p>
            </CardContent>
        </Card>
    );
}
