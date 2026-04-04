"use client";

import React, { useState, useRef, memo } from "react";
import { useForm, useFieldArray, useWatch, Control, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    CalendarIcon,
    Plus,
    Trash2,
    Check,
    ChevronsUpDown,
    FileSpreadsheet,
    Upload,
    AlertCircle,
    Loader2
} from "lucide-react";
import { createPurchase } from "@/app/actions/purchase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { readPurchaseExcel, ParsedExcelRow } from "@/lib/excel-parser";

// Schema matching the server action input
const formSchema = z.object({
    supplierId: z.coerce.number().min(1, "Selecciona un proveedor"),
    purchaseDate: z.date(),
    items: z.array(z.object({
        modelId: z.coerce.number(),
        quantity: z.coerce.number().min(1, "Cantidad mínima de 1"),
        imeis: z.string().min(1, "Ingresa al menos un IMEI"),
        brand: z.string().optional(),
        modelName: z.string().optional(),
        storageGb: z.coerce.number().optional(),
        color: z.string().optional().nullable(),
    })).min(1, "Agrega al menos un item")
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePurchaseFormProps {
    suppliers: { id: number; name: string }[];
    deviceModels: { id: number; brand: string; modelName: string; storageGb: number; color: string | null }[];
}

// 1. Optimized Counter Component
const TotalEquiposCounter = ({ control }: { control: Control<FormValues> }) => {
    const items = useWatch({
        control,
        name: "items"
    });
    const total = items?.reduce((acc: number, item: any) => acc + (Number(item?.quantity) || 0), 0) || 0;
    return <>{total}</>;
};

// 2. Optimized Row Component
const PurchaseItemRow = memo(({
    index,
    control,
    remove,
    deviceModels,
    setValue
}: {
    index: number;
    control: Control<FormValues>;
    remove: (index: number) => void;
    deviceModels: CreatePurchaseFormProps['deviceModels'];
    setValue: UseFormReturn<FormValues>['setValue'];
}) => {
    // Watch only this specific item for UI display (model, quantity)
    // We EXCLUDE imeis from the watch to avoid re-renders while typing
    const item = useWatch({
        control,
        name: `items.${index}`,
    });

    const [localImeis, setLocalImeis] = useState(item?.imeis || "");
    const debounceTimerRef = useRef<any>(null);

    // Initial sync
    React.useEffect(() => {
        if (item?.imeis !== localImeis && !debounceTimerRef.current) {
            setLocalImeis(item?.imeis || "");
        }
    }, [item?.imeis]);

    const handleImeiChange = (val: string) => {
        setLocalImeis(val);

        // Debounce the update to the form state
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setValue(`items.${index}.imeis`, val, { shouldValidate: true });
            debounceTimerRef.current = null;
        }, 400); // 400ms delay for maximum fluidity
    };

    const lines = localImeis.split('\n').filter((l: string) => l.trim()).length;
    const declaredQty = Number(item?.quantity) || 0;
    const isMismatch = lines > 0 && lines !== declaredQty;
    const isNewModel = item?.modelId === 0;

    return (
        <TableRow
            className={cn(
                "group border-slate-50 transition-colors",
                isNewModel ? "bg-indigo-50/30 hover:bg-indigo-50/50" : "hover:bg-slate-50/40"
            )}
        >
            <TableCell className="text-center">
                <span className="text-xs font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">{index + 1}</span>
            </TableCell>
            <TableCell>
                {isNewModel ? (
                    <div className="flex items-center gap-3 px-3 py-2 border border-indigo-100 bg-white rounded-xl shadow-sm">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm italic">{item?.brand} {item?.modelName}</span>
                                <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black h-4 px-1">NUEVO</Badge>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">{item?.storageGb}GB {item?.color && `• ${item?.color}`}</span>
                        </div>
                    </div>
                ) : (
                    <FormField
                        control={control}
                        name={`items.${index}.modelId`}
                        render={({ field: selectField }: { field: any }) => (
                            <FormItem>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full h-12 justify-between font-bold rounded-xl bg-transparent border-slate-100 hover:border-indigo-200 text-slate-700 text-sm transition-all",
                                                    !selectField.value && "text-slate-400 font-medium"
                                                )}
                                            >
                                                <span className="truncate max-w-[240px]">
                                                    {selectField.value
                                                        ? (() => {
                                                            const m = deviceModels.find((model) => model.id === selectField.value);
                                                            return m ? `${m.brand} ${m.modelName} ${m.storageGb}GB${m.color ? ` - ${m.color}` : ''}` : "Modelo..."
                                                        })()
                                                        : "Buscar modelo..."}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40 text-indigo-500" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 rounded-2xl border-none shadow-2xl shadow-indigo-100/50" align="start">
                                        <Command>
                                            <div className="p-2 border-b border-slate-50">
                                                <CommandInput placeholder="Filtrar por marca o modelo..." className="h-10 border-none bg-slate-50 rounded-lg" />
                                            </div>
                                            <CommandList className="max-h-[300px]">
                                                <CommandEmpty className="p-4 text-xs italic text-slate-400">No se encontró el modelo.</CommandEmpty>
                                                <CommandGroup>
                                                    {deviceModels.map((model) => (
                                                        <CommandItem
                                                            key={model.id}
                                                            value={`${model.brand} ${model.modelName} ${model.storageGb} ${model.color || ''}`}
                                                            onSelect={() => setValue(`items.${index}.modelId`, model.id)}
                                                            className="rounded-lg mb-1 h-11 px-3 aria-selected:bg-indigo-50 aria-selected:text-indigo-700"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4 text-indigo-500", model.id === selectField.value ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm">{model.brand} {model.modelName}</span>
                                                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">{model.storageGb}GB {model.color && `• ${model.color}`}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage className="text-[10px] font-bold text-rose-500" />
                            </FormItem>
                        )}
                    />
                )}
            </TableCell>
            <TableCell>
                <FormField
                    control={control}
                    name={`items.${index}.quantity`}
                    render={({ field: qtyField }: { field: any }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    {...qtyField}
                                    className="h-12 w-24 mx-auto rounded-xl bg-slate-50/50 border-slate-100 font-bold text-slate-700 text-center focus:bg-white focus:border-indigo-200 transition-all"
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold text-rose-500" />
                        </FormItem>
                    )}
                />
            </TableCell>
            <TableCell>
                <FormItem className="relative">
                    <FormControl>
                        <Textarea
                            placeholder="Pega o escribe IMEIs..."
                            className={cn(
                                "min-h-[60px] max-h-[120px] py-3 rounded-xl bg-slate-50/50 border-slate-100 font-mono text-[11px] focus:bg-white focus:border-indigo-200 transition-all resize-none shadow-inner",
                                isMismatch && "border-amber-200 bg-amber-50/30"
                            )}
                            value={localImeis}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleImeiChange(e.target.value)}
                        />
                    </FormControl>
                    <div className="absolute right-3 bottom-3 flex items-center gap-2 pointer-events-none">
                        {isMismatch && (
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-bold animate-pulse">
                                DIFERENCIA
                            </Badge>
                        )}
                        <Badge variant="secondary" className={cn(
                            "bg-white/80 border-slate-100 text-[10px] font-bold",
                            isMismatch ? "text-amber-600" : "text-slate-400"
                        )}>
                            {lines} IMEIs
                        </Badge>
                    </div>
                </FormItem>
            </TableCell>
            <TableCell className="text-center">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </TableCell>
        </TableRow>
    );
});

PurchaseItemRow.displayName = "PurchaseItemRow";


export function CreatePurchaseForm({ suppliers, deviceModels }: CreatePurchaseFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [dateOpen, setDateOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const submitLockRef = useRef(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            supplierId: 0,
            purchaseDate: new Date(),
            items: [{ modelId: 0, quantity: 1, imeis: "" }]
        }
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const { rows: parsedRows, errors: excelErrors } = await readPurchaseExcel(file);

            if (parsedRows.length === 0 && excelErrors.length === 0) {
                toast.error("No se encontraron datos en el Excel.");
                return;
            }

            // Group by model keys
            const grouped = new Map<string, { modelInfo: ParsedExcelRow; imeis: string[] }>();
            parsedRows.forEach(row => {
                const key = `${row.brand}-${row.modelName}-${row.storageGb}-${row.color || ''}`.toLowerCase().trim();
                if (!grouped.has(key)) {
                    grouped.set(key, { modelInfo: row, imeis: [] });
                }
                grouped.get(key)!.imeis.push(row.imei);
            });

            const newItems: FormValues['items'] = [];
            let autoDetectedCount = 0;
            let newModelsCount = 0;

            for (const [key, data] of grouped.entries()) {
                const match = deviceModels.find(m => {
                    const mKey = `${m.brand}-${m.modelName}-${m.storageGb}-${m.color || ''}`.toLowerCase().trim();
                    return mKey === key;
                });

                if (match) {
                    newItems.push({
                        modelId: match.id,
                        quantity: data.imeis.length,
                        imeis: data.imeis.join('\n')
                    });
                    autoDetectedCount++;
                } else {
                    // It's a brand new model
                    newItems.push({
                        modelId: 0, // Mark as new
                        brand: data.modelInfo.brand,
                        modelName: data.modelInfo.modelName,
                        storageGb: data.modelInfo.storageGb,
                        color: data.modelInfo.color,
                        quantity: data.imeis.length,
                        imeis: data.imeis.join('\n')
                    });
                    newModelsCount++;
                }
            }

            if (newItems.length > 0) {
                replace(newItems);
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold">¡Excel procesado con éxito!</span>
                        <span className="text-xs">{parsedRows.length} equipos cargados en {newItems.length} filas.</span>
                        {newModelsCount > 0 && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 mt-1">
                                {newModelsCount} modelos nuevos detectados (se crearán automáticamente)
                            </span>
                        )}
                    </div>
                );
            }

            // Handle Errors/Skipped rows
            if (excelErrors.length > 0) {
                toast.error(
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-auto">
                        <div className="flex items-center gap-2 font-bold text-rose-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Equipos omitidos ({excelErrors.length})</span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                            Estos equipos no se agregaron por errores en el IMEI o formato:
                        </p>
                        <ul className="text-[10px] space-y-1 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                            {excelErrors.slice(0, 10).map((err, i) => (
                                <li key={i} className="flex flex-col border-b border-rose-100/50 pb-1 last:border-0">
                                    <span className="font-bold text-rose-700">Fila {err.row}: {err.imei}</span>
                                    <span className="text-rose-500 opacity-80">{err.reason}</span>
                                </li>
                            ))}
                            {excelErrors.length > 10 && <li className="italic text-center pt-1">... y {excelErrors.length - 10} más</li>}
                        </ul>
                    </div>,
                    { duration: 8000 }
                );
            }
        } catch (error) {
            toast.error("Error crítico al procesar el Excel");
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        setLoading(true);
        for (const [index, item] of values.items.entries()) {
            const imeiCount = item.imeis.split('\n').filter(s => s.trim().length > 0).length;
            if (imeiCount !== item.quantity) {
                form.setError(`items.${index}.imeis`, {
                    type: "manual",
                    message: `Mismatch: ${imeiCount} vs ${item.quantity}`
                });
                setLoading(false);
                submitLockRef.current = false;
                toast.error(`Error en la fila #${index + 1}: La cantidad no coincide con los IMEIs.`);
                return;
            }
        }

        try {
            const res = await createPurchase(values);
            if (res.success) {
                toast.success("Compra creada exitosamente");
                router.push("/compras");
            } else {
                toast.error(res.error || "Error al crear la compra");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
            submitLockRef.current = false;
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 pb-20">
                {/* Header Section: Supplier & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/50">
                    <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Proveedor</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value ? field.value.toString() : undefined}>
                                    <FormControl>
                                        <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-bold text-slate-700">
                                            <SelectValue placeholder="Seleccionar proveedor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()} className="rounded-xl my-1">{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px] font-bold text-rose-500" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Fecha</FormLabel>
                                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("h-14 w-full pl-4 text-left font-bold rounded-2xl bg-white border-slate-100 shadow-sm", !field.value && "text-slate-400")}>
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: es })
                                                ) : (
                                                    <span>Seleccionar fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-5 w-5 text-slate-300" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl bg-white border-none z-50" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    field.onChange(date);
                                                    setDateOpen(false);
                                                }
                                            }}
                                            disabled={(date) => date > new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage className="text-[10px] font-bold text-rose-500" />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Main Table Section (The Virtual Excel) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                    <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-slate-50/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Excel Virtual de Compra</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-slate-400 font-medium tracking-tight">Gestiona los modelos e IMEIs de forma tabular</p>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Total Equipos:</span>
                                        <span className="text-xs font-black text-indigo-700">
                                            <TotalEquiposCounter control={form.control} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input type="file" accept=".xlsx" className="hidden" ref={fileInputRef} onChange={handleExcelUpload} />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={importing}
                                onClick={() => fileInputRef.current?.click()}
                                className="h-11 px-5 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-600 border-slate-200 hover:border-emerald-100 transition-all font-bold group"
                            >
                                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-500" /> : <Upload className="mr-2 h-4 w-4 text-emerald-500 transition-transform group-hover:scale-110" />}
                                Importar XLSX
                            </Button>

                            <Button
                                type="button"
                                variant="default"
                                onClick={() => append({ modelId: 0, quantity: 1, imeis: "" })}
                                className="h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all font-bold shadow-lg shadow-slate-200"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Fila
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-[80px] text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest py-5">#</TableHead>
                                    <TableHead className="min-w-[300px] font-bold text-slate-400 text-[10px] uppercase tracking-widest">Modelo del Dispositivo</TableHead>
                                    <TableHead className="w-[120px] font-bold text-slate-400 text-[10px] uppercase tracking-widest text-center">Cantidad</TableHead>
                                    <TableHead className="min-w-[400px] font-bold text-slate-400 text-[10px] uppercase tracking-widest">Listado de IMEIs</TableHead>
                                    <TableHead className="w-[80px] text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <PurchaseItemRow
                                        key={field.id}
                                        index={index}
                                        control={form.control}
                                        remove={remove}
                                        deviceModels={deviceModels}
                                        setValue={form.setValue}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {fields.length === 0 && (
                        <div className="p-20 text-center bg-slate-50/20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-50">
                                    <FileSpreadsheet className="h-8 w-8 text-slate-200" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-500 tracking-tight">El lote está vacío</p>
                                    <p className="text-xs text-slate-400">Importa un Excel o agrega filas manualmente para comenzar</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-4 text-slate-400">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-600">Validación de Lote</p>
                            <p className="text-xs italic font-medium">Se detectarán duplicados automáticamente antes de guardar.</p>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || fields.length === 0}
                        className="h-16 px-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[320px]"
                    >
                        {loading ? (
                            <span className="flex items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                Procesando...
                            </span>
                        ) : (
                            "Finalizar y Guardar Borrador"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}




