"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateEquipment } from "@/app/actions/equipment";
import { useRouter } from "next/navigation";

interface EditEquipmentDialogProps {
    equipo: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditEquipmentDialog({ equipo, open, onOpenChange }: EditEquipmentDialogProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        imei: equipo.imei || "",
        marca: equipo.marca || "",
        modelo: equipo.modelo || "",
        storageGb: equipo.storageGb?.toString() || "",
        color: equipo.color || "",
        grado: equipo.grado || "",
        funcionalidad: equipo.funcionalidad || "Sin Verificar",
        estado: equipo.estado || "En Inventario",
        observacion: equipo.observacion || ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updateEquipment(equipo.id, formData);
            if (result.success) {
                toast.success("Equipo actualizado correctamente");
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl border-slate-100 shadow-2xl">
                <DialogHeader className="border-b border-slate-100 pb-4">
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-indigo-600" />
                        Editar Equipo #{equipo.id}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="imei" className="text-xs font-bold uppercase text-slate-500">IMEI / Serial</Label>
                        <Input
                            id="imei"
                            name="imei"
                            value={formData.imei}
                            onChange={handleChange}
                            className="bg-slate-50 border-slate-200 font-mono"
                            placeholder="Ingrese el IMEI correcto"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="marca" className="text-xs font-bold uppercase text-slate-500">Marca</Label>
                            <Input id="marca" name="marca" value={formData.marca} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modelo" className="text-xs font-bold uppercase text-slate-500">Modelo</Label>
                            <Input id="modelo" name="modelo" value={formData.modelo} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="storageGb" className="text-xs font-bold uppercase text-slate-500">Almacenamiento (GB)</Label>
                            <Input id="storageGb" name="storageGb" type="number" value={formData.storageGb} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color" className="text-xs font-bold uppercase text-slate-500">Color</Label>
                            <Input id="color" name="color" value={formData.color} onChange={handleChange} className="bg-slate-50 border-slate-200" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Grado Estético</Label>
                            <Select value={formData.grado} onValueChange={(val) => handleSelectChange("grado", val)}>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">Grado A (Excelente)</SelectItem>
                                    <SelectItem value="B">Grado B (Bueno)</SelectItem>
                                    <SelectItem value="C">Grado C (Regular)</SelectItem>
                                    <SelectItem value="D">Grado D (Malo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Funcionalidad</Label>
                            <Select value={formData.funcionalidad} onValueChange={(val) => handleSelectChange("funcionalidad", val)}>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Funcional">Funcional</SelectItem>
                                    <SelectItem value="No Funcional">No Funcional</SelectItem>
                                    <SelectItem value="Sin Verificar">Sin Verificar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Estado</Label>
                            <Select value={formData.estado} onValueChange={(val) => handleSelectChange("estado", val)}>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="En Inventario">En Inventario</SelectItem>
                                    <SelectItem value="En Revisión">En Revisión</SelectItem>
                                    <SelectItem value="Revisado">Revisado</SelectItem>
                                    <SelectItem value="Vendido">Vendido</SelectItem>
                                    <SelectItem value="Garantía">Garantía</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="observacion" className="text-xs font-bold uppercase text-slate-500">Observaciones</Label>
                        <Textarea
                            id="observacion"
                            name="observacion"
                            value={formData.observacion}
                            onChange={handleChange}
                            className="bg-slate-50 border-slate-200 min-h-[80px]"
                            placeholder="Detalles adicionales sobre el estado del equipo..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
