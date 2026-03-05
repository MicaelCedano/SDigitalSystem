"use client";

import { useState } from "react";
import {
    Plus,
    Upload,
    FileSpreadsheet,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Download,
    Info
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { addEquipmentToPurchase } from "@/app/actions/purchase";
import { motion, AnimatePresence } from "framer-motion";

interface AddEquipmentDialogProps {
    purchaseId: number;
    purchaseNumber?: string | number;
}

export function AddEquipmentDialog({ purchaseId, purchaseNumber }: AddEquipmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<string>("standard");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith(".xlsx")) {
                toast.error("El archivo debe ser un Excel (.xlsx)");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Por favor selecciona un archivo Excel");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purchaseId", purchaseId.toString());
        formData.append("importType", importType);

        try {
            const result = await addEquipmentToPurchase(formData);
            if (result.success) {
                toast.success(result.message);
                setOpen(false);
                setFile(null);
            } else {
                toast.error(result.error || "Ocurrió un error inesperado");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error al procesar el archivo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Equipos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                <div className="bg-white p-8 space-y-8">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-bold text-slate-800 tracking-tight">Agregar Equipos por Excel</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">Sube un archivo para sumar equipos a la Compra #{purchaseNumber || purchaseId}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Instructions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Info className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Columnas Requeridas</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {["IMEI", "Marca", "Modelo", "GB", "Color"].map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-2">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5" /> Notas
                            </h4>
                            <ul className="text-[11px] text-blue-700 space-y-1 font-medium leading-relaxed">
                                <li>• IMEIs duplicados se omiten</li>
                                <li>• Equipos de otras compras se mueven aquí</li>
                                <li>• Modelos inexistentes se crean auto</li>
                            </ul>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-widest pl-1">Formato del Archivo</Label>
                            <RadioGroup
                                defaultValue="standard"
                                onValueChange={setImportType}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div className="relative">
                                    <RadioGroupItem value="standard" id="standard" className="peer sr-only" />
                                    <Label
                                        htmlFor="standard"
                                        className="flex flex-col items-center justify-between rounded-3xl border-2 border-slate-100 bg-white p-6 hover:bg-slate-50 hover:border-slate-200 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50/30 transition-all cursor-pointer group"
                                    >
                                        <FileSpreadsheet className="h-8 w-8 mb-3 text-slate-400 group-hover:text-indigo-500 group-peer-data-[state=checked]:text-indigo-600 transition-colors" />
                                        <div className="text-center">
                                            <span className="block text-sm font-bold text-slate-800">Estándar</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">4+ Columnas</span>
                                        </div>
                                    </Label>
                                </div>

                                <div className="relative">
                                    <RadioGroupItem value="iphone" id="iphone" className="peer sr-only" />
                                    <Label
                                        htmlFor="iphone"
                                        className="flex flex-col items-center justify-between rounded-3xl border-2 border-slate-100 bg-white p-6 hover:bg-slate-50 hover:border-slate-200 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50/30 transition-all cursor-pointer group"
                                    >
                                        <Smartphone className="h-8 w-8 mb-3 text-slate-400 group-hover:text-indigo-500 group-peer-data-[state=checked]:text-indigo-600 transition-colors" />
                                        <div className="text-center">
                                            <span className="block text-sm font-bold text-slate-800">Smart iPhone</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solo IMEI & Modelo</span>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="file-upload" className="text-sm font-bold text-slate-700 uppercase tracking-widest pl-1">Seleccionar Archivo</Label>
                            <div className="relative group">
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <Label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group-hover:shadow-lg group-hover:shadow-indigo-50/50"
                                >
                                    <AnimatePresence mode="wait">
                                        {file ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex flex-col items-center gap-2"
                                            >
                                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-2">
                                                    <CheckCircle2 className="h-8 w-8" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 max-w-[250px] truncate">{file.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-xl text-rose-500 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFile(null);
                                                    }}
                                                >
                                                    <X className="h-3 w-3 mr-1" /> Quitar archivo
                                                </Button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl mb-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    <Upload className="h-8 w-8" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">Haz clic para buscar</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solo Archivos .xlsx</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !file}
                                className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-5 w-5" />
                                        Importar Equipos
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
