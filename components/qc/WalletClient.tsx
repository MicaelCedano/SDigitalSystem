"use client";

import { useState } from "react";
import {
    Wallet, ArrowUpRight, TrendingUp, TrendingDown,
    Calendar, CheckCircle2, AlertTriangle, DollarSign,
    Download, Clock, Info, PiggyBank, ArrowRightLeft, Plus,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { requestWithdrawal, manualCredit, transferBetweenAccounts, createWalletAccount } from "@/app/actions/wallet";
import { formatDateTime, cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WalletProps {
    initialData: any;
    currentUser: any;
}

export function WalletClient({ initialData, currentUser }: WalletProps) {
    const { accounts, ingresos, retiros, saldoTotal } = initialData;

    const principalAcc = accounts.find((a: any) => a.nombre === "Principal") || accounts[0];
    const savingsAccounts = accounts.filter((a: any) => a.nombre !== "Principal");

    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Transfer States
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferData, setTransferData] = useState({
        fromId: principalAcc?.id?.toString() || "",
        toId: savingsAccounts[0]?.id?.toString() || "",
        amount: ""
    });

    // New Account States
    const [isNewAccOpen, setIsNewAccOpen] = useState(false);
    const [newAccName, setNewAccName] = useState("");

    const handleWithdrawalRequest = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 2000) {
            toast.error("El monto mínimo para retirar es RD$ 2,000");
            return;
        }
        if (numAmount > (principalAcc?.saldo || 0)) {
            toast.error("No tienes suficiente saldo disponible en tu cuenta Principal");
            return;
        }

        setIsConfirmOpen(true);
    };

    const confirmWithdrawal = async () => {
        setIsLoading(true);
        setIsConfirmOpen(false);
        try {
            const result: any = await requestWithdrawal(parseFloat(amount));
            if (result.success) {
                toast.success("Solicitud de retiro procesada correctamente");
                setAmount("");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async () => {
        const numAmount = parseFloat(transferData.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Monto inválido");
            return;
        }

        setIsLoading(true);
        try {
            const result: any = await transferBetweenAccounts(
                Number(transferData.fromId),
                Number(transferData.toId),
                numAmount
            );

            if (result.success) {
                toast.success("Transferencia realizada con éxito");
                setIsTransferOpen(false);
                setTransferData({ ...transferData, amount: "" });
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al transferir");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!newAccName.trim()) {
            toast.error("Ingresa un nombre para la cuenta");
            return;
        }

        setIsLoading(true);
        try {
            const result: any = await createWalletAccount(newAccName);
            if (result.success) {
                toast.success("Cuenta creada");
                setIsNewAccOpen(false);
                setNewAccName("");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al crear cuenta");
        } finally {
            setIsLoading(false);
        }
    };

    const canWithdraw = (principalAcc?.saldo || 0) >= 2000;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6 pb-24">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent mb-1">
                        Bóveda Digital
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Gestiona tus saldos, ahorra y solicita retiros de forma segura.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setIsTransferOpen(true)}
                        className="bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 font-bold rounded-xl shadow-sm gap-2"
                    >
                        <ArrowRightLeft size={18} />
                        Transferir
                    </Button>
                    <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Acumulado</p>
                            <p className="text-sm font-black text-slate-700 font-mono">RD$ {saldoTotal.toLocaleString('en-US')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Accounts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Principal Account Card */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-100/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                        <DollarSign className="w-48 h-48 text-indigo-900" />
                    </div>

                    <div className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-600 rounded-xl">
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest text-indigo-600/60">Cuenta Principal</span>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-indigo-600 font-mono">RD$</span>
                                        <span className="text-6xl font-black text-slate-800 tracking-tighter font-mono">
                                            {principalAcc?.saldo?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold mt-1">Este es el saldo disponible para retiros inmediatos.</p>
                                </div>

                                <div className="flex gap-2">
                                    {!canWithdraw && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] font-black uppercase px-2 py-0.5">
                                            Retiro mínimo RD$ 2,000
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-black uppercase px-2 py-0.5">
                                        Cuenta Activa
                                    </Badge>
                                </div>
                            </div>

                            <div className="md:w-64 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block ml-1">Monto Retirar</label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">RD$</span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            disabled={!canWithdraw || isLoading}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="h-12 pl-10 bg-slate-50/50 border-slate-100 focus:bg-white text-lg font-black font-mono rounded-xl border-2 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleWithdrawalRequest}
                                    disabled={!canWithdraw || isLoading || parseFloat(amount) < 2000 || parseFloat(amount) > (principalAcc?.saldo || 0)}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Solicitar Retiro
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Savings Accounts Column */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Mis Ahorros</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsNewAccOpen(true)}
                            className="h-8 text-indigo-600 font-bold hover:bg-indigo-50"
                        >
                            <Plus size={16} className="mr-1" /> Nuevo
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {savingsAccounts.length > 0 ? savingsAccounts.map((acc: any) => (
                            <div key={acc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform">
                                    <PiggyBank size={80} />
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100/50 rounded-xl">
                                            <PiggyBank className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">{acc.nombre}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Ahorro</span>
                                </div>
                                <div className="font-mono text-2xl font-black text-slate-800">
                                    RD$ {acc.saldo?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-[10px] text-slate-400 font-medium">Desde {new Date(acc.fechaCreacion).toLocaleDateString()}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setTransferData({ ...transferData, fromId: acc.id.toString(), toId: principalAcc.id.toString() });
                                            setIsTransferOpen(true);
                                        }}
                                        className="h-7 text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 p-2"
                                    >
                                        Sacar Fondos
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
                                <PiggyBank className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">Crea una cuenta para </p>
                                <p className="text-xs text-slate-400">guardar tus metas de ahorro.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Tabs */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Ingresos Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-800">Historial Activo</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Fecha</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Descripción</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {ingresos.length > 0 ? ingresos.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                                                {formatDateTime(t.fecha).split(' ')[0]}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-slate-700">{t.descripcion || 'Ingreso de Pago'}</div>
                                                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t.tipo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono font-black text-indigo-600 text-sm">
                                                    +RD$ {t.monto.toLocaleString('en-US')}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center text-slate-300 font-bold italic text-sm">Sin movimientos recientes</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Retiros Column */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-slate-800">Retiros y Salidas</h3>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Fecha</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Monto</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {retiros.length > 0 ? retiros.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                                                {formatDateTime(t.fecha).split(' ')[0]}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono font-black text-slate-800 text-sm">
                                                    -RD$ {t.monto.toLocaleString('en-US')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase border",
                                                    t.estado === 'Aprobado' || t.estado === 'Completado' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                )}>
                                                    {t.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center text-slate-300 font-bold italic text-sm">Sin retiros registrados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {/* 1. Transfer Dialog */}
            <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800">Mover Dinero</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">Transfiere fondos entre tus propias cuentas internas.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Desde</label>
                                <Select value={transferData.fromId} onValueChange={(v) => setTransferData({ ...transferData, fromId: v })}>
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-100 font-bold rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id.toString()}>{a.nombre} (RD$ {a.saldo})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Hacia</label>
                                <Select value={transferData.toId} onValueChange={(v) => setTransferData({ ...transferData, toId: v })}>
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-100 font-bold rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Monto a mover</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black">RD$</span>
                                <Input
                                    type="number"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                    className="h-12 pl-12 bg-slate-50 border-slate-100 font-black text-lg rounded-xl"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsTransferOpen(false)} variant="ghost" className="font-bold text-slate-500 rounded-xl">Cancelar</Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 rounded-xl shadow-lg shadow-indigo-100"
                        >
                            Confirmar Movimiento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. New Account Dialog */}
            <Dialog open={isNewAccOpen} onOpenChange={setIsNewAccOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800">Nueva Meta de Ahorro</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">Crea una cuenta para separar fondos específicos.</DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre de la cuenta</label>
                            <Input
                                value={newAccName}
                                onChange={(e) => setNewAccName(e.target.value)}
                                className="h-12 bg-slate-50 border-slate-100 font-bold rounded-xl"
                                placeholder="Ej: Pago de Casa, Ahorro 2024..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsNewAccOpen(false)} variant="ghost" className="font-bold text-slate-500 rounded-xl">Cancelar</Button>
                        <Button
                            onClick={handleCreateAccount}
                            disabled={isLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-xl shadow-lg shadow-emerald-100"
                        >
                            Crear Cuenta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Confirm Withdrawal */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-8 text-slate-950">
                    <DialogHeader className="space-y-4">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center text-slate-800">Confirmar Retiro</DialogTitle>
                        <DialogDescription className="text-center font-medium text-slate-500 text-base leading-relaxed">
                            ¿Estás seguro de solicitar un retiro por <span className="font-bold text-slate-800">RD$ {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>? <br />
                            <span className="text-sm">Esta acción será procesada por administración y se descontará de tu cuenta Principal.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex sm:justify-center gap-4 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmOpen(false)}
                            className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={confirmWithdrawal}
                            className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all active:scale-95"
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Floating Action Button for admin (Optional/Removed here to keep clean, or keep manual credit if needed) */}
            {currentUser.role === 'admin' && (
                <div className="fixed bottom-8 right-8 z-50">
                    <Button
                        onClick={() => {
                            const val = window.prompt("Monto a acreditar manualmente (RD$):");
                            if (val && !isNaN(parseFloat(val))) {
                                manualCredit(Number(currentUser.id), parseFloat(val)).then(res => {
                                    if (res.success) toast.success("Acreditado");
                                });
                            }
                        }}
                        className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-200 px-6 font-black"
                    >
                        <Plus className="mr-2" /> Admin Acreditar
                    </Button>
                </div>
            )}
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", className)}>{children}</span>;
}
