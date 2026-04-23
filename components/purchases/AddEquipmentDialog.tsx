"use client";

import { useMemo, useState } from "react";
import {
    Plus,
    Upload,
    FileSpreadsheet,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Info,
    PencilLine,
    ChevronsUpDown,
    Check
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { toast } from "sonner";
import { addEquipmentToPurchase, addManualEquipmentToPurchase } from "@/app/actions/purchase";
import { motion, AnimatePresence } from "framer-motion";

interface AddEquipmentDialogProps {
    purchaseId: number;
    purchaseNumber?: string | number;
    deviceModels: {
        id: number;
        brand: string;
        modelName: string;
        storageGb: number;
        color: string | null;
    }[];
}

export function AddEquipmentDialog({ purchaseId, purchaseNumber, deviceModels }: AddEquipmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("excel");
    const [file, setFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<string>("standard");
    const [loading, setLoading] = useState(false);
    const [manualModelId, setManualModelId] = useState<string>("");
    const [newBrand, setNewBrand] = useState("");
    const [newModelName, setNewModelName] = useState("");
    const [newStorageGb, setNewStorageGb] = useState("");
    const [newColor, setNewColor] = useState("");
    const [manualQuantity, setManualQuantity] = useState("1");
    const [manualImeis, setManualImeis] = useState("");

    const isCreatingNewModel = manualModelId === "new";
    const selectedModel = deviceModels.find((model) => model.id.toString() === manualModelId);
    const imeiCount = useMemo(
        () => manualImeis.split("\n").map((line) => line.trim()).filter(Boolean).length,
        [manualImeis]
    );

    const resetState = () => {
        setFile(null);
        setImportType("standard");
        setManualModelId("");
        setNewBrand("");
        setNewModelName("");
        setNewStorageGb("");
        setNewColor("");
        setManualQuantity("1");
        setManualImeis("");
        setActiveTab("excel");
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            resetState();
        }
    };

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

    const handleExcelSubmit = async (e: React.FormEvent) => {
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
                handleOpenChange(false);
            } else {
                toast.error(result.error || "Ocurrió un error inesperado");
            }
        } catch (error) {
            console.error("Error submitting excel form:", error);
            toast.error("Error al procesar el archivo");
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const quantity = Number(manualQuantity);
        if (!quantity || quantity < 1) {
            toast.error("La cantidad debe ser mayor a 0.");
            return;
        }

        if (!manualModelId) {
            toast.error("Selecciona un modelo o elige crear uno nuevo.");
            return;
        }

        if (imeiCount !== quantity) {
            toast.error(`La cantidad no coincide con los IMEIs: ${imeiCount} vs ${quantity}.`);
            return;
        }

        if (isCreatingNewModel && (!newBrand.trim() || !newModelName.trim() || Number(newStorageGb) < 1)) {
            toast.error("Completa marca, modelo y capacidad para crear el nuevo modelo.");
            return;
        }

        setLoading(true);
        try {
            const result = await addManualEquipmentToPurchase({
                purchaseId,
                item: {
                    modelId: isCreatingNewModel ? 0 : Number(manualModelId),
                    quantity,
                    imeis: manualImeis,
                    brand: isCreatingNewModel ? newBrand : undefined,
                    modelName: isCreatingNewModel ? newModelName : undefined,
                    storageGb: isCreatingNewModel ? Number(newStorageGb) : undefined,
                    color: isCreatingNewModel ? newColor || null : undefined,
                }
            });

            if (result.success) {
                toast.success(result.message || "Equipos agregados correctamente");
                handleOpenChange(false);
            } else {
                toast.error(result.error || "No se pudo agregar el modelo");
            }
        } catch (error) {
            console.error("Error submitting manual form:", error);
            toast.error("Error al agregar equipos manualmente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="flex-1 md:flex-none h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Equipos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl max-h-[95vh] flex flex-col">
                <div className="bg-white p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-bold text-slate-800 tracking-tight">Editar Compra</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    Agrega más equipos a la Compra #{purchaseNumber || purchaseId} con Excel o de forma manual.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
                        <TabsList className="grid grid-cols-2 h-14 rounded-[1.5rem] bg-slate-100 p-1">
                            <TabsTrigger value="excel" className="rounded-[1.2rem] font-bold data-[state=active]:bg-white">
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Excel
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="rounded-[1.2rem] font-bold data-[state=active]:bg-white">
                                <PencilLine className="h-4 w-4 mr-2" />
                                Manual
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="excel" className="space-y-8">
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
                                        <li>• Modelos inexistentes se crean automáticamente</li>
                                    </ul>
                                </div>
                            </div>

                            <form onSubmit={handleExcelSubmit} className="space-y-8">
                                <div className="space-y-4 md:space-y-6">
                                    <Label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-widest pl-1">Formato del Archivo</Label>
                                    <RadioGroup
                                        defaultValue="standard"
                                        onValueChange={setImportType}
                                        className="grid grid-cols-2 gap-3 md:gap-4"
                                    >
                                        <div className="relative">
                                            <RadioGroupItem value="standard" id="standard" className="peer sr-only" />
                                            <Label
                                                htmlFor="standard"
                                                className="flex flex-col items-center justify-center rounded-3xl border-2 border-slate-100 bg-white p-4 md:p-6 hover:bg-slate-50 hover:border-slate-200 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50/30 transition-all cursor-pointer group h-full"
                                            >
                                                <FileSpreadsheet className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-3 text-slate-400 group-hover:text-indigo-500 group-peer-data-[state=checked]:text-indigo-600 transition-colors" />
                                                <div className="text-center">
                                                    <span className="block text-xs md:text-sm font-bold text-slate-800">Estándar</span>
                                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">4+ Columnas</span>
                                                </div>
                                            </Label>
                                        </div>

                                        <div className="relative">
                                            <RadioGroupItem value="iphone" id="iphone" className="peer sr-only" />
                                            <Label
                                                htmlFor="iphone"
                                                className="flex flex-col items-center justify-center rounded-3xl border-2 border-slate-100 bg-white p-4 md:p-6 hover:bg-slate-50 hover:border-slate-200 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50/30 transition-all cursor-pointer group h-full"
                                            >
                                                <Smartphone className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-3 text-slate-400 group-hover:text-indigo-500 group-peer-data-[state=checked]:text-indigo-600 transition-colors" />
                                                <div className="text-center">
                                                    <span className="block text-xs md:text-sm font-bold text-slate-800">Smart iPhone</span>
                                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solo IMEI & Modelo</span>
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
                                            className="flex flex-col items-center justify-center h-28 md:h-40 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group-hover:shadow-lg group-hover:shadow-indigo-50/50"
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
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solo archivos .xlsx</span>
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
                                        onClick={() => handleOpenChange(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || !file}
                                        className="flex-[2] h-12 md:h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base md:text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95"
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
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-6">
                            <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-2">
                                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle className="h-3.5 w-3.5" /> Carga Manual
                                </h4>
                                <p className="text-[12px] text-amber-800 font-medium leading-relaxed">
                                    Aquí puedes sumar un modelo adicional a la compra sin usar Excel. Ingresa la cantidad y pega un IMEI por línea.
                                </p>
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Modelo</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                className="h-14 w-full justify-between rounded-2xl border-slate-200 bg-white font-bold text-slate-800 hover:bg-slate-50"
                                            >
                                                <span className="truncate text-left">
                                                    {isCreatingNewModel
                                                        ? "Crear modelo nuevo"
                                                        : selectedModel
                                                            ? `${selectedModel.brand} ${selectedModel.modelName} ${selectedModel.storageGb}GB${selectedModel.color ? ` - ${selectedModel.color}` : ""}`
                                                            : "Seleccionar un modelo existente o crear uno nuevo"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-2xl" align="start">
                                            <Command>
                                                <div className="border-b border-slate-100 p-2">
                                                    <CommandInput placeholder="Buscar por marca, modelo, GB o color..." className="h-10 rounded-xl border-none bg-slate-50" />
                                                </div>
                                                <CommandList className="max-h-[280px]">
                                                    <CommandEmpty className="p-4 text-xs text-slate-400 italic">No se encontró ningún modelo.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="crear modelo nuevo"
                                                            onSelect={() => setManualModelId("new")}
                                                            className="mx-2 my-1 rounded-xl font-bold text-indigo-600 aria-selected:bg-indigo-50 aria-selected:text-indigo-700"
                                                        >
                                                            <Check className={`mr-2 h-4 w-4 ${isCreatingNewModel ? "opacity-100" : "opacity-0"}`} />
                                                            + Crear modelo nuevo
                                                        </CommandItem>
                                                        {deviceModels.map((model) => (
                                                            <CommandItem
                                                                key={model.id}
                                                                value={`${model.brand} ${model.modelName} ${model.storageGb} ${model.color || ""}`}
                                                                onSelect={() => setManualModelId(model.id.toString())}
                                                                className="mx-2 my-1 rounded-xl aria-selected:bg-slate-50"
                                                            >
                                                                <Check className={`mr-2 h-4 w-4 text-indigo-500 ${manualModelId === model.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-sm text-slate-800">{model.brand} {model.modelName}</span>
                                                                    <span className="text-[10px] uppercase tracking-widest text-slate-400">
                                                                        {model.storageGb}GB{model.color ? ` - ${model.color}` : ""}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {isCreatingNewModel && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[2rem] border border-indigo-100 bg-indigo-50/40 p-5">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Marca</Label>
                                            <Input
                                                value={newBrand}
                                                onChange={(e) => setNewBrand(e.target.value)}
                                                placeholder="Apple, Samsung..."
                                                className="h-12 rounded-2xl border-indigo-100 bg-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Modelo</Label>
                                            <Input
                                                value={newModelName}
                                                onChange={(e) => setNewModelName(e.target.value)}
                                                placeholder="iPhone 13, S23..."
                                                className="h-12 rounded-2xl border-indigo-100 bg-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Capacidad (GB)</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={newStorageGb}
                                                onChange={(e) => setNewStorageGb(e.target.value)}
                                                placeholder="128"
                                                className="h-12 rounded-2xl border-indigo-100 bg-white font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Color</Label>
                                            <Input
                                                value={newColor}
                                                onChange={(e) => setNewColor(e.target.value)}
                                                placeholder="Midnight, Black..."
                                                className="h-12 rounded-2xl border-indigo-100 bg-white font-bold"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Cantidad</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={manualQuantity}
                                            onChange={(e) => setManualQuantity(e.target.value)}
                                            className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-center"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">IMEIs</Label>
                                        <div className="relative">
                                            <Textarea
                                                value={manualImeis}
                                                onChange={(e) => setManualImeis(e.target.value)}
                                                placeholder="Pega un IMEI por línea..."
                                                className="min-h-[150px] rounded-[1.5rem] border-slate-200 bg-white font-mono text-sm shadow-inner"
                                            />
                                            <div className="absolute right-4 bottom-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                {imeiCount} IMEIs
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                                        onClick={() => handleOpenChange(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-5 w-5" />
                                                Agregar Modelo a la Compra
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
