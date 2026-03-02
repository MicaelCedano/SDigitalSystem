"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Smartphone,
    AlertCircle,
    ImageIcon,
    Save
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { reviewEquipment } from "@/app/actions/qc";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ReviewEquipmentModalProps {
    equipo: any;
    isOpen: boolean;
    onClose: () => void;
    deviceModels: any[];
}

export function ReviewEquipmentModal({ equipo, isOpen, onClose, deviceModels }: ReviewEquipmentModalProps) {
    // States
    const [modelo, setModelo] = useState("");
    const [funcionalidad, setFuncionalidad] = useState("");
    const [grado, setGrado] = useState("");
    const [observacion, setObservacion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Wrong Model handling
    const [isWrongModel, setIsWrongModel] = useState(false);
    const [selectedDeviceModelId, setSelectedDeviceModelId] = useState<string>("0");

    // Sync state when equipment changes
    useEffect(() => {
        if (equipo) {
            setModelo(equipo.modelo || equipo.marca || "");
            setFuncionalidad(equipo.funcionalidad || "");
            setGrado(equipo.grado || "");
            setObservacion(equipo.observacion || "");
            setIsWrongModel(false);
            setSelectedDeviceModelId(equipo.deviceModelId?.toString() || "0");
        }
    }, [equipo, isOpen]);

    const handleDeviceModelChange = (val: string) => {
        setSelectedDeviceModelId(val);
        const selModel = deviceModels.find(m => m.id.toString() === val);
        if (selModel) {
            setModelo(selModel.fullName);
        } else {
            setModelo(equipo?.marca || "");
        }
    };

    const activeDeviceModel = useMemo(() => {
        if (selectedDeviceModelId !== "0" && selectedDeviceModelId !== equipo?.deviceModelId?.toString()) {
            return deviceModels.find(m => m.id.toString() === selectedDeviceModelId);
        }
        return equipo?.deviceModel;
    }, [selectedDeviceModelId, deviceModels, equipo]);

    const previewImageFilename = activeDeviceModel?.imageFilename || equipo?.imageFilename;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await reviewEquipment(equipo.id, {
                modelo,
                funcionalidad,
                grado,
                observacion,
                deviceModelId: selectedDeviceModelId !== "0" ? parseInt(selectedDeviceModelId) : null
            });

            if (result.success) {
                toast.success("Equipo revisado correctamente");
                router.refresh();
                onClose();
            } else {
                toast.error(result.error || "Error al guardar la revisión");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    if (!equipo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-2xl border-none bg-white shadow-2xl">
                <DialogHeader className="bg-gradient-to-br from-indigo-600 to-blue-500 p-4 text-white relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Smartphone className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black tracking-tight text-white capitalize">Revisar Equipo</DialogTitle>
                            <p className="text-indigo-100 text-[11px] font-medium mt-0.5 opacity-90">Completa la info técnica del dispositivo.</p>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white">
                    {/* Device Summary Card */}
                    <div className="flex gap-1.5 justify-between items-start">
                        <div className="flex flex-col gap-1 flex-1 pr-3">
                            <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-2">IMEI</Label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-center shadow-sm select-all font-bold text-[13px]">
                                {equipo.imei}
                            </div>

                            <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mt-1.5 px-1">Marca Original</Label>
                            <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-[12px] shadow-sm font-bold">
                                <Smartphone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                {equipo.marca || '-'}
                            </div>

                            {(equipo.storageGb || equipo.color) && (
                                <>
                                    <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest mt-1.5 px-1">Detalles</Label>
                                    <div className="flex gap-2 text-[11px] font-bold">
                                        {equipo.storageGb && (
                                            <div className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg">
                                                {equipo.storageGb} GB
                                            </div>
                                        )}
                                        {equipo.color && (
                                            <div className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg">
                                                {equipo.color}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Image Preview Block */}
                        <div className="flex justify-center items-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-xl border border-slate-200 p-2 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                                {previewImageFilename ? (
                                    <img
                                        src={previewImageFilename.startsWith('http') ? previewImageFilename : `/device-images/${previewImageFilename}`}
                                        alt={modelo || 'Equipo'}
                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="text-center text-slate-400 flex flex-col items-center">
                                        <ImageIcon className="w-6 h-6 mb-1" />
                                        <span className="text-[9px] font-bold">Sin imagen</span>
                                    </div>
                                )}
                                {equipo.color && (
                                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/80 backdrop-blur-sm rounded text-[9px] text-white font-medium">
                                        {equipo.color}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100"></div>

                    {/* Editable Fields */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-slate-900">Modelo Identificado</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="wrong-model" checked={isWrongModel} onCheckedChange={(checked) => setIsWrongModel(!!checked)} />
                                    <label htmlFor="wrong-model" className="text-[10px] font-bold text-rose-500 cursor-pointer flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> ¿Modelo Erróneo?
                                    </label>
                                </div>
                            </div>

                            <Input
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                className="h-10 rounded-xl border-slate-200 bg-white text-[12px] font-bold text-slate-900 placeholder:text-slate-400"
                                placeholder="Ej: iPhone 11, Samsung S21..."
                                required
                                disabled={!isWrongModel}
                            />

                            {isWrongModel && (
                                <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-1">Seleccionar Modelo Correcto (Maestro)</Label>
                                    <Select value={selectedDeviceModelId} onValueChange={handleDeviceModelChange}>
                                        <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-[12px] font-bold text-slate-900">
                                            <SelectValue placeholder="Seleccionar modelo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0" className="text-slate-500 italic text-xs">-- Ninguno o Manual --</SelectItem>
                                            {deviceModels.map((m) => (
                                                <SelectItem key={m.id} value={m.id.toString()} className="text-xs">
                                                    {m.fullName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-slate-900">Funcionalidad</Label>
                                <Select value={funcionalidad} onValueChange={setFuncionalidad} required>
                                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-[12px] font-bold text-slate-900">
                                        <SelectValue placeholder="Estado..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Funcional" className="text-emerald-600 text-xs">✅ Funcional</SelectItem>
                                        <SelectItem value="No funcional" className="text-rose-600 text-xs">❌ No Funcional</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-slate-900">Grado Estético</Label>
                                <Select value={grado} onValueChange={setGrado}>
                                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-[12px] font-bold text-slate-900">
                                        <SelectValue placeholder="Grado..." />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                        <SelectItem value="A" className="text-xs">A (Excelente)</SelectItem>
                                        <SelectItem value="B" className="text-xs">B (Bueno)</SelectItem>
                                        <SelectItem value="C" className="text-xs">C (Regular)</SelectItem>
                                        <SelectItem value="D" className="text-xs">D (Malo)</SelectItem>
                                        <SelectItem value="E" className="text-xs">E (Defectuoso)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-900">Observaciones</Label>
                            <Textarea
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                className="resize-none rounded-xl border-slate-200 bg-white text-[12px] font-bold text-slate-900 min-h-[60px]"
                                placeholder="Detalles sobre el equipo..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-9 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50 text-[12px]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 font-bold flex gap-1.5 text-[12px]"
                        >
                            <Save className="w-4 h-4" /> Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
