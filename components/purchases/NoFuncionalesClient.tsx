"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Package, Search, Smartphone, AlertTriangle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { markAsFuncional } from "@/app/actions/equipment";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NoFuncionalesClientProps {
    pendientes: any[];
    recuperados: any[];
}

export function NoFuncionalesClient({ pendientes, recuperados }: NoFuncionalesClientProps) {
    const [tab, setTab] = useState<"pendientes" | "recuperados">("pendientes");
    const [search, setSearch] = useState("");
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const data = tab === "pendientes" ? pendientes : recuperados;

    const filtered = data.filter((e) => {
        const q = search.toLowerCase();
        return (
            e.imei?.toLowerCase().includes(q) ||
            e.modelo?.toLowerCase().includes(q) ||
            e.marca?.toLowerCase().includes(q) ||
            e.purchase?.supplier?.name?.toLowerCase().includes(q)
        );
    });

    // Group by purchase
    const grouped = filtered.reduce<Record<number, { purchase: any; equipos: any[] }>>((acc, eq) => {
        const pid = eq.purchaseId;
        if (!acc[pid]) acc[pid] = { purchase: eq.purchase, equipos: [] };
        acc[pid].equipos.push(eq);
        return acc;
    }, {});

    const handleMarkFuncional = async (equipoId: number) => {
        setLoadingId(equipoId);
        const res = await markAsFuncional(equipoId);
        setLoadingId(null);
        if (res.success) {
            toast.success("Equipo marcado como Funcional");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Error al actualizar");
        }
    };

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">Equipos No Funcionales</h1>
                <p className="text-sm text-slate-500 mt-1">Seguimiento de equipos devueltos como no funcionales por compra</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-rose-500 shrink-0" size={22} />
                    <div>
                        <p className="text-2xl font-black text-rose-700">{pendientes.length}</p>
                        <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Pendientes</p>
                    </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                    <div>
                        <p className="text-2xl font-black text-emerald-700">{recuperados.length}</p>
                        <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wide">Recuperados</p>
                    </div>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                    <button
                        onClick={() => setTab("pendientes")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            tab === "pendientes" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        No Funcionales ({pendientes.length})
                    </button>
                    <button
                        onClick={() => setTab("recuperados")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            tab === "recuperados" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Recuperados ({recuperados.length})
                    </button>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Buscar IMEI, modelo, proveedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 rounded-xl border-slate-200 text-sm"
                    />
                </div>
            </div>

            {/* Content */}
            {Object.keys(grouped).length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Smartphone size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Sin equipos para mostrar</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.values(grouped).map(({ purchase, equipos }) => (
                        <div key={purchase.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Purchase Header */}
                            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Package size={16} className="text-indigo-500" />
                                    <span className="font-black text-slate-800 text-sm">
                                        Compra #{purchase.id}
                                    </span>
                                    <span className="text-slate-400 text-xs">—</span>
                                    <span className="text-sm text-slate-600 font-semibold">
                                        {purchase.supplier?.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={13} className="text-slate-400" />
                                    <span className="text-xs text-slate-500">{formatDate(purchase.purchaseDate)}</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {equipos.length} equipo{equipos.length !== 1 ? "s" : ""}
                                    </Badge>
                                </div>
                            </div>

                            {/* Equipment List */}
                            <div className="divide-y divide-slate-50">
                                {equipos.map((eq) => {
                                    const recoveredAt = tab === "recuperados" && eq.historial?.[0]?.fecha
                                        ? formatDate(eq.historial[0].fecha)
                                        : null;
                                    return (
                                        <div key={eq.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Smartphone size={16} className={cn(
                                                    "shrink-0",
                                                    tab === "pendientes" ? "text-rose-400" : "text-emerald-400"
                                                )} />
                                                <div className="min-w-0">
                                                    <p className="font-mono text-sm font-bold text-slate-800 truncate">{eq.imei}</p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {[eq.marca, eq.modelo, eq.storageGb ? `${eq.storageGb}GB` : null, eq.color]
                                                            .filter(Boolean).join(" · ")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs text-slate-400">Ingresado</p>
                                                    <p className="text-xs font-semibold text-slate-600">{formatDate(eq.fechaIngreso)}</p>
                                                </div>
                                                {tab === "pendientes" ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleMarkFuncional(eq.id)}
                                                        disabled={loadingId === eq.id || isPending}
                                                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                                                    >
                                                        {loadingId === eq.id ? "..." : "Marcar Funcional"}
                                                    </Button>
                                                ) : (
                                                    <div className="text-right">
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-bold">
                                                            Recuperado
                                                        </Badge>
                                                        {recoveredAt && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{recoveredAt}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
