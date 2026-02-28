"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Users, Smartphone, Loader2, AlertCircle, Trash2, Search, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";

interface AvailableImei {
    imei: string;
    marca: string;
    modelo: string;
    storage: string;
}

export function EntregarEquiposClient({
    qcUsers
}: {
    qcUsers: { id: number; name: string | null; username: string }[]
}) {
    const router = useRouter();
    const [imeis, setImeis] = useState("");
    const [selectedQcId, setSelectedQcId] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);

    // Right panel state
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [availableEquipments, setAvailableEquipments] = useState<AvailableImei[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const imeiList = imeis.split("\n").map(i => i.trim()).filter(i => i.length > 0);

    const fetchAvailableImeis = async (search: string = "") => {
        setIsSearching(true);
        try {
            const res = await fetch(`/api/equipment/available-imeis?search=${encodeURIComponent(search)}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setAvailableEquipments(data.imeis || []);
            }
        } catch (error) {
            console.error("Error fetching available imeis:", error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchAvailableImeis(debouncedSearch);
    }, [debouncedSearch]);

    const handleAddImei = (imei: string) => {
        if (!imeis.includes(imei)) {
            setImeis(prev => prev ? `${prev}\n${imei}` : imei);
            toast.success(`IMEI ${imei} agregado a la lista.`);
        } else {
            toast.warning(`El IMEI ${imei} ya está en la lista.`);
        }
    };

    const handleClearImeis = () => {
        setImeis("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedQcId) {
            toast.error("Selecciona un Control de Calidad");
            return;
        }

        if (imeiList.length === 0) {
            toast.error("Ingresa al menos un IMEI");
            return;
        }

        setIsAssigning(true);
        try {
            const res = await fetch("/api/equipment/assign-imeis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imeis: imeiList, qcId: Number(selectedQcId) }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(data.message);
                setImeis("");
                setSelectedQcId("");
                fetchAvailableImeis(debouncedSearch); // Refresh list
                router.refresh();
            } else {
                toast.error(data.error || "Error al asignar los equipos");
            }
        } catch (error) {
            toast.error("Error de red al intentar asignar los equipos.");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr,1.1fr] gap-6 max-w-5xl mx-auto w-full">
            {/* Left Column: Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-[20px] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-[#EEF2FC] text-[#5C67E6] font-extrabold w-8 h-8 rounded-full flex items-center justify-center text-[13px]">
                            1
                        </div>
                        <h2 className="text-[17px] font-black text-slate-800 tracking-tight">Datos de la Entrega</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Select Analista QC */}
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-bold text-[13px]">Técnico de Control de Calidad</Label>
                            <Select value={selectedQcId} onValueChange={setSelectedQcId}>
                                <SelectTrigger className="w-full bg-white border-slate-200 h-[46px] rounded-xl text-slate-800 font-medium text-[13px]">
                                    <SelectValue placeholder="Selecciona un técnico..." />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="bg-white z-50 w-[var(--radix-select-trigger-width)]">
                                    {qcUsers.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                <Users size={16} className="text-slate-400" />
                                                <span className="text-slate-800">{u.name || u.username || `Usuario ${u.id}`}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Textarea para IMEIs */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-600 font-bold text-[13px]">Listado de IMEIs</Label>
                                <span className="bg-[#F1F5F9] text-slate-500 text-[11px] font-bold px-3 py-1 rounded-full">
                                    {imeiList.length} {imeiList.length === 1 ? 'equipo' : 'equipos'}
                                </span>
                            </div>
                            <div className="relative group">
                                <Textarea
                                    rows={10}
                                    placeholder="Escanea o pega los IMEIs aquí..."
                                    className="bg-slate-50 border-slate-200 focus:bg-white resize-y font-mono text-sm text-slate-800 leading-relaxed p-4 rounded-md min-h-[200px]"
                                    value={imeis}
                                    onChange={(e) => setImeis(e.target.value)}
                                />
                                {imeis.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClearImeis}
                                        className="absolute bottom-3 right-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 w-8 h-8 rounded-md transition-colors border border-transparent hover:border-rose-100"
                                        title="Limpiar todo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2 font-medium">
                                <AlertCircle size={12} className="text-slate-300" />
                                {imeis ? "Listo para procesar" : "Esperando entrada..."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 mt-auto">
                    <Button
                        type="submit"
                        disabled={isAssigning || imeiList.length === 0 || !selectedQcId}
                        className="w-full bg-[#5260EA] hover:bg-[#4351DB] text-white font-bold h-[52px] rounded-xl shadow-sm text-[15px] transition-all"
                    >
                        {isAssigning ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Procesando...
                            </>
                        ) : (
                            <>
                                Confirmar Entrega
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 group-hover:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Right Column: Inventory Search */}
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm flex flex-col h-[500px] overflow-hidden relative">
                <div className="p-5 border-b border-slate-100 bg-white z-10">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="flex flex-1 items-center gap-2.5 text-[15px] font-black text-slate-800 tracking-tight">
                            <Search className="text-[#8B5CF6] w-[18px] h-[18px]" />
                            Buscar en Inventario
                        </h2>
                        <span className="bg-[#F1F5F9] text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Disponible
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                            <Input
                                placeholder="Buscar por IMEI, Marca o Modelo..."
                                className="pl-10 h-[46px] bg-[#F8FAFC] border-slate-100 focus:bg-white rounded-xl text-[13px] font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            className="h-[46px] px-5 rounded-xl font-bold bg-[#F1F5F9] hover:bg-slate-200 text-slate-700 border-none text-[13px]"
                            onClick={() => setSearchTerm("")}
                        >
                            Ver Todo
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {/* Header tabla */}
                    <div className="flex items-center gap-3 px-6 py-3 bg-[#F8FAFC] border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] sticky top-0 z-10 w-full min-w-[320px]">
                        <div className="w-[140px] shrink-0">IMEI</div>
                        <div className="flex-1">EQUIPO</div>
                        <div className="w-[50px] text-right shrink-0">ACCIÓN</div>
                    </div>

                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-400" />
                            <p className="font-bold text-sm tracking-wide text-indigo-900/40 uppercase">Buscando equipos...</p>
                        </div>
                    ) : availableEquipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                            </div>
                            <p className="font-bold text-slate-500 text-base">No se encontraron equipos.</p>
                            {searchTerm && <p className="text-sm font-medium text-slate-400 mt-1">Intenta con otro término.</p>}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/60 w-full min-w-[320px] pb-4">
                            {availableEquipments.map((eq) => {
                                const isSelected = imeis.includes(eq.imei);
                                return (
                                    <div key={eq.imei} className="flex items-center gap-3 px-6 py-3.5 hover:bg-[#F8FAFC] transition-colors group">
                                        <div className="w-[140px] shrink-0">
                                            <div className="font-mono text-[12px] font-medium text-slate-600 truncate bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100" title={eq.imei}>
                                                <span className="text-slate-400 mr-0.5">#</span>{eq.imei}
                                            </div>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[13px] font-bold text-slate-800 truncate" title={`${eq.marca} ${eq.modelo}`}>
                                                {eq.marca} {eq.modelo}
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                {eq.storage}
                                            </span>
                                        </div>
                                        <div className="w-[50px] flex justify-end shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAddImei(eq.imei)}
                                                disabled={isSelected}
                                                className={`h-9 w-9 p-0 rounded-xl transition-all ${isSelected
                                                    ? 'bg-emerald-500 text-white opacity-100 shadow-md shadow-emerald-200'
                                                    : 'bg-white text-slate-600 hover:bg-[#5C67E6] hover:text-white border border-slate-200 hover:border-transparent shadow-sm'
                                                    }`}
                                            >
                                                {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {availableEquipments.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-white text-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)] relative z-10">
                        <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                            Mostrando {availableEquipments.length} equipos en inventario
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
