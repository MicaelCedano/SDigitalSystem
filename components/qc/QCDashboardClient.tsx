"use client";

import { useState } from "react";
import {
    Clock, CheckCircle2, XCircle, Search, Smartphone,
    Play, Edit2, Lock, Award, Package, DollarSign, AlertCircle, Cpu, Bell, X, Info, Send
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReviewEquipmentModal } from "@/components/qc/ReviewEquipmentModal";
import { cn } from "@/lib/utils";
import { submitLoteForReview } from "@/app/actions/lotes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QCDashboardProps {
    initialData: any;
    currentUser: any;
}

export function QCDashboardClient({ initialData, currentUser }: QCDashboardProps) {
    const [activeTab, setActiveTab] = useState("hoy");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterState, setFilterState] = useState("todos");

    // Modal State
    const [selectedEquipo, setSelectedEquipo] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const router = useRouter();

    const openReviewModal = (equipo: any) => {
        setSelectedEquipo(equipo);
        setIsReviewOpen(true);
    };

    const handleSubmitLote = async (loteId: number) => {
        const res = await submitLoteForReview(loteId);
        if (res.success) {
            toast.success("Lote entregado correctamente");
            router.refresh();
        } else {
            toast.error(res.error || "Error al entregar lote");
        }
    };

    const {
        saldoPrincipal, cantidadPendientes, totalFuncionales, totalNoFuncionales,
        globalInventario, globalEnRevision, equipos, lotesAbiertos, topGlobal, topDia, topMes,
        notificaciones, mensajeBienvenida, totalRevisados
    } = initialData;

    // Filter Logic
    const filteredEquipos = equipos.filter((eq: any) => {
        const matchesSearch =
            (eq.imei?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (eq.marca?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (eq.modelo?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filterState === "pendientes") matchesFilter = eq.estado === "En Revisión";
        if (filterState === "funcionales") matchesFilter = eq.funcionalidad === "Funcional";
        if (filterState === "no_funcionales") matchesFilter = eq.funcionalidad === "No funcional";
        if (filterState === "completados") matchesFilter = eq.estado === "Revisado";

        return matchesSearch && matchesFilter;
    });

    const renderRankingTab = (data: any[]) => {
        if (!data || data.length === 0) {
            return <div className="text-center py-8 text-slate-400 text-sm">Sin datos para mostrar</div>;
        }
        return (
            <div className="space-y-3">
                {data.map((stats, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-transparent'}`}>
                        <div className="shrink-0 relative">
                            {i === 0 && <span className="absolute -top-2 -right-2 text-base animate-bounce">👑</span>}
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md transition-transform hover:scale-110",
                                i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : i === 1 ? 'bg-slate-400' : 'bg-indigo-400'
                            )}>
                                {stats.tecnico?.profileImage ? (
                                    <img src={`/profiles/${stats.tecnico.profileImage}`} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    (stats.tecnico?.name?.substring(0, 1) || stats.tecnico?.username?.substring(0, 1) || "?")
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate">{stats.tecnico?.name || stats.tecnico?.username || "Usuario"}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Técnico QC</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-indigo-600 font-mono leading-none">{stats.count}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Equipos</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-500 slide-in-from-bottom-4">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent mb-1">
                        Dashboard de Calidad
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Hola, <span className="font-bold text-slate-800">{currentUser.name || currentUser.username}</span>.
                        <span className="text-slate-300 mx-2">|</span>
                        <span className="text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md text-sm">{cantidadPendientes} Pendientes</span>
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-100 flex items-center gap-3 w-fit">
                    <div className="p-2 bg-emerald-100/50 rounded-xl">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Principal</p>
                        <p className="text-xl font-black text-emerald-700 font-mono leading-none">RD$ {saldoPrincipal.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Motivational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-rose-200 group">
                    <div className="absolute -right-4 -top-8 opacity-10 group-hover:opacity-20 transition-opacity rotate-12 duration-500">
                        <Package className="w-40 h-40 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase backdrop-blur-sm border border-white/10">Prioridad Alta</span>
                            <AlertCircle className="w-4 h-4 text-white/80 animate-pulse" />
                        </div>
                        <h3 className="text-white/90 text-[13px] font-bold uppercase tracking-widest mt-4">Inventario Global para Revisar</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-5xl font-black tracking-tighter">{globalInventario}</span>
                            <span className="text-sm font-bold opacity-80 uppercase">Equipos</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#5C67E6] to-indigo-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200 group">
                    <div className="absolute -right-4 -top-8 opacity-10 group-hover:opacity-20 transition-opacity rotate-12 duration-500">
                        <Cpu className="w-40 h-40 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase backdrop-blur-sm border border-white/10">En Proceso Global</span>
                        </div>
                        <h3 className="text-white/90 text-[13px] font-bold uppercase tracking-widest mt-4">Siendo Revisados Ahora</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-5xl font-black tracking-tighter">{globalEnRevision}</span>
                            <span className="text-sm font-bold opacity-80 uppercase">Equipos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Panels */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Rankings Panel */}
                <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" /> Liderazgo
                        </h3>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button onClick={() => setActiveTab("hoy")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === 'hoy' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Hoy</button>
                            <button onClick={() => setActiveTab("mes")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === 'mes' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Mes</button>
                            <button onClick={() => setActiveTab("global")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${activeTab === 'global' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Global</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {activeTab === "hoy" && renderRankingTab(topDia)}
                        {activeTab === "mes" && renderRankingTab(topMes)}
                        {activeTab === "global" && renderRankingTab(topGlobal)}
                    </div>
                </div>

                {/* Quick Stats Panel */}
                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-amber-50 rounded-2xl">
                                <Clock className="w-6 h-6 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">Por Revisar</span>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-slate-800 leading-none">{cantidadPendientes}</p>
                            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Equipos Pendientes</h4>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Listos</span>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-slate-800 leading-none">{totalFuncionales}</p>
                            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Funcionales</h4>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-rose-50 rounded-2xl">
                                <XCircle className="w-6 h-6 text-rose-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">Rechazados</span>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-slate-800 leading-none">{totalNoFuncionales}</p>
                            <h4 className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">No Funcionales</h4>
                        </div>
                    </div>
                </div>

            </div>

            {/* Equipment Filter & List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2 flex flex-col relative overflow-hidden">
                <div className="p-4 bg-white z-10 rounded-t-3xl border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar por IMEI, Marca o Modelo..."
                            className="pl-10 h-[46px] bg-slate-50 border-slate-200 focus:bg-white rounded-xl text-[13px] font-medium w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setFilterState("todos")} className={`px-4 h-[40px] rounded-xl text-xs font-bold transition-all border ${filterState === 'todos' ? 'bg-[#5C67E6] text-white border-[#5C67E6] shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'}`}>Todos</button>
                        <button onClick={() => setFilterState("pendientes")} className={`px-4 h-[40px] rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${filterState === 'pendientes' ? 'bg-[#5C67E6] text-white border-[#5C67E6] shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'}`}>Pendientes <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md text-[10px]">{cantidadPendientes}</span></button>
                        <button onClick={() => setFilterState("funcionales")} className={`px-4 h-[40px] rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${filterState === 'funcionales' ? 'bg-[#5C67E6] text-white border-[#5C67E6] shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'}`}>Funcionales <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md text-[10px]">{totalFuncionales}</span></button>
                        <button onClick={() => setFilterState("no_funcionales")} className={`px-4 h-[40px] rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${filterState === 'no_funcionales' ? 'bg-[#5C67E6] text-white border-[#5C67E6] shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'}`}>No Funcionales <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md text-[10px]">{totalNoFuncionales}</span></button>
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-[#F8FAFC]/80 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em]">
                                <th className="px-6 py-4 rounded-tl-xl w-[250px]">Dispositivo</th>
                                <th className="px-6 py-4 w-[180px]">IMEI</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Condición</th>
                                <th className="px-6 py-4">Observación</th>
                                <th className="px-6 py-4 rounded-tr-xl text-right w-[150px]">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80 bg-white">
                            {filteredEquipos.length > 0 ? filteredEquipos.map((eq: any) => (
                                <tr key={eq.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-[13px] leading-tight">{eq.modelo || eq.deviceModel?.fullName || eq.marca || 'Desconocido'}</div>
                                                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                    {eq.storageGb ? `${eq.storageGb}GB ${eq.color ? '• ' + eq.color : ''}` : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-[12px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                            <span className="text-slate-400 font-normal mr-0.5">#</span>{eq.imei}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full inline-flex items-center gap-1.5 ${eq.estado === 'En Revisión' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                                            eq.estado === 'Revisado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                                                eq.estado === 'Entregado' ? 'bg-blue-50 text-blue-700 border border-blue-100/50' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {eq.estado === 'En Revisión' ? <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> :
                                                eq.estado === 'Revisado' ? <CheckCircle2 className="w-3 h-3" /> : null}
                                            {eq.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {eq.funcionalidad ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${eq.funcionalidad === 'Funcional' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    eq.funcionalidad === 'No funcional' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                        'bg-slate-50 text-slate-600'
                                                    }`}>
                                                    {eq.funcionalidad}
                                                </span>
                                                {eq.grado && <span className="text-[10px] font-black text-slate-400 uppercase">Grado: {eq.grado}</span>}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[12px] font-medium text-slate-500 truncate max-w-[200px]" title={eq.observacion || ''}>
                                            {eq.observacion || '-'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {eq.estado === 'En Revisión' ? (
                                            <Button
                                                size="sm"
                                                onClick={() => openReviewModal(eq)}
                                                className="bg-[#5C67E6] hover:bg-[#4E58D0] text-white shadow-md shadow-indigo-200 h-8 text-[12px] font-bold rounded-lg w-full flex justify-center gap-1.5"
                                            >
                                                <Play className="w-3 h-3" /> Revisar
                                            </Button>
                                        ) : eq.estado === 'Revisado' && eq.lote?.estado !== 'Entregado' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openReviewModal(eq)}
                                                className="border-slate-200 text-slate-600 hover:bg-slate-50 h-8 text-[12px] font-bold rounded-lg w-full flex justify-center gap-1.5"
                                            >
                                                <Edit2 className="w-3 h-3" /> Editar
                                            </Button>
                                        ) : (
                                            <div className="flex justify-end pr-4 text-slate-300">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-600 text-[15px]">No se encontraron equipos</p>
                                        <p className="text-[13px] mt-1 font-medium text-slate-500 mb-4 block">Intenta ajustando los filtros o el buscador.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Vista Cards Mobile */}
                <div className="md:hidden space-y-4 p-4 mb-4">
                    {filteredEquipos.length > 0 ? filteredEquipos.map((eq: any) => (
                        <div key={eq.id} className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4 transition-all hover:border-indigo-300">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">{eq.modelo || eq.deviceModel?.fullName || eq.marca || 'Desconocido'}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {eq.storageGb ? `${eq.storageGb}GB ${eq.color ? '• ' + eq.color : ''}` : 'N/A'}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${eq.estado === 'En Revisión' ? 'bg-amber-100 text-amber-700' :
                                    eq.estado === 'Revisado' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-slate-200 text-slate-700'
                                    }`}>
                                    {eq.estado}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-xs font-mono text-slate-600 mb-4 bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-400">IMEI:</span>
                                <span className="font-bold">{eq.imei}</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-1">
                                    {eq.funcionalidad ? (
                                        <>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${eq.funcionalidad === 'Funcional' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {eq.funcionalidad}
                                            </span>
                                            {eq.grado && <span className="text-[10px] font-black text-slate-400">Grado: {eq.grado}</span>}
                                        </>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Sin revisar</span>
                                    )}
                                </div>

                                <div>
                                    {eq.estado === 'En Revisión' ? (
                                        <Button
                                            size="sm"
                                            onClick={() => openReviewModal(eq)}
                                            className="bg-[#5C67E6] hover:bg-[#4E58D0] text-white shadow-md shadow-indigo-200 h-9 px-4 text-[13px] font-bold rounded-lg flex gap-1.5"
                                        >
                                            <Play className="w-3.5 h-3.5" /> Revisar
                                        </Button>
                                    ) : eq.estado === 'Revisado' && eq.lote?.estado !== 'Entregado' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openReviewModal(eq)}
                                            className="border-slate-200 text-slate-600 h-9 px-4 text-[13px] font-bold rounded-lg flex gap-1.5"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Editar
                                        </Button>
                                    ) : (
                                        <span className="text-slate-300 p-2"><Lock className="w-4 h-4" /></span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-slate-400">
                            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-600 text-[14px]">No se encontraron equipos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gestión de Lotes Abiertos */}
            {lotesAbiertos && lotesAbiertos.length > 0 && (
                <div className="space-y-6 mt-8">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-500" /> Gestión de Lotes Abiertos
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lotesAbiertos.map((lote: any) => {
                            const equiposLote = lote.equipos || [];
                            const todosRevisados = equiposLote.length > 0 && equiposLote.every((eq: any) => eq.estado === 'Revisado' || eq.estado === 'Entregado');
                            const revisados = equiposLote.filter((eq: any) => eq.estado === 'Revisado');
                            const funcionales = revisados.filter((eq: any) => eq.funcionalidad === 'Funcional');
                            const noFuncionales = revisados.filter((eq: any) => eq.funcionalidad === 'No funcional');

                            return (
                                <div key={lote.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-lg transition-all duration-300">
                                    <div className={`px-6 py-4 border-b border-slate-100/50 ${lote.estado === 'Pendiente' ? 'bg-amber-50' :
                                        lote.estado === 'Listo para Entrega' ? 'bg-indigo-50' :
                                            (lote.estado === 'Abierto' && todosRevisados) ? 'bg-emerald-50' : 'bg-slate-50'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <div className="font-black text-[15px] text-slate-800">Lote {lote.codigo}</div>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${lote.estado === 'Pendiente' ? 'bg-white text-amber-700 border-amber-200' :
                                                lote.estado === 'Listo para Entrega' ? 'bg-white text-indigo-700 border-indigo-200' :
                                                    (lote.estado === 'Abierto' && todosRevisados) ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
                                                }`}>
                                                {lote.estado}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="block text-2xl font-black text-slate-800 leading-none">{revisados.length}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Revisados</span>
                                            </div>
                                            <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                                                <span className="block text-2xl font-black text-emerald-600 leading-none">{funcionales.length}</span>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 block">Funcional</span>
                                            </div>
                                            <div className="text-center p-3 bg-rose-50 rounded-2xl border border-rose-100/50">
                                                <span className="block text-2xl font-black text-rose-600 leading-none">{noFuncionales.length}</span>
                                                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-1 block">No Func.</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {lote.estado === 'Pendiente' && (
                                                <>
                                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50 mb-1">
                                                        <p className="text-[12px] font-bold text-amber-800 flex items-center gap-2">
                                                            <Info className="w-4 h-4" /> Esperando confirmación admin.
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" className="w-full h-11 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[13px] rounded-xl flex items-center gap-2">
                                                        <Edit2 className="w-4 h-4" /> Editar Lote
                                                    </Button>
                                                </>
                                            )}

                                            {lote.estado === 'Listo para Entrega' && (
                                                <>
                                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100/50 mb-1">
                                                        <p className="text-[12px] font-bold text-indigo-800 flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4" /> Marcado como listo.
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button className="h-11 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200 text-white font-bold text-[13px] rounded-xl flex items-center gap-2">
                                                            <Send className="w-4 h-4" /> Entregar
                                                        </Button>
                                                        <Button variant="outline" className="h-11 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[13px] rounded-xl flex items-center gap-2">
                                                            <Edit2 className="w-4 h-4" /> Editar
                                                        </Button>
                                                    </div>
                                                </>
                                            )}

                                            {lote.estado === 'Abierto' && todosRevisados && (
                                                <>
                                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100/50 mb-1">
                                                        <p className="text-[12px] font-bold text-emerald-800 flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4" /> ¡Revisión completada!
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleSubmitLote(lote.id)}
                                                        className="w-full h-11 bg-[#5C67E6] hover:bg-[#4E58D0] shadow-md shadow-indigo-200 text-white font-bold text-[13px] rounded-xl flex items-center gap-2 justify-center"
                                                    >
                                                        <Send className="w-4 h-4" /> Entregar Administrador
                                                    </Button>
                                                </>
                                            )}

                                            {lote.estado === 'Abierto' && !todosRevisados && (
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-1">
                                                    <p className="text-[12px] font-bold text-slate-500 flex items-center justify-center gap-2">
                                                        Faltan {(equiposLote.length - revisados.length)} por revisar.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal */}
            <ReviewEquipmentModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                equipo={selectedEquipo}
                deviceModels={initialData.deviceModels || []}
            />
        </div>
    );
}
