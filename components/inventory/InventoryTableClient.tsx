"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Palette, CheckCircle2, XCircle, Users } from "lucide-react";
import { InventoryPagination } from "@/components/inventory/InventoryPagination";
import { EquipmentActions } from "@/components/inventory/EquipmentActions";
import { cn, formatDateTime } from "@/lib/utils";
import { assignToQualityControl } from "@/app/actions/equipment";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface InventoryTableClientProps {
    equipos: any[];
    totalItems: number;
    skip: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
    query: string;
    qcUsers: { id: number; name: string | null; username: string }[];
}

export function InventoryTableClient({
    equipos,
    totalItems,
    skip,
    itemsPerPage,
    totalPages,
    currentPage,
    query,
    qcUsers
}: InventoryTableClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(query);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedQcId, setSelectedQcId] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);

    // Sync search input with URL query prop
    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`?q=${searchTerm.trim()}&page=1`);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select those that are "En Inventario" since those are the ones we can assign
            setSelectedIds(equipos.filter(e => e.estado === "En Inventario").map(e => e.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (checked: boolean, id: number) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleAssignFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQcId) {
            toast.error("Selecciona un Control de Calidad");
            return;
        }
        if (selectedIds.length === 0) {
            toast.error("Selecciona al menos un equipo");
            return;
        }

        setIsAssigning(true);
        const res = await assignToQualityControl(selectedIds, Number(selectedQcId));
        setIsAssigning(false);

        if (res.success) {
            toast.success(res.message);
            setIsAssignModalOpen(false);
            setSelectedIds([]);
            setSelectedQcId("");
        } else {
            toast.error(res.error);
        }
    };

    const openAssignModal = () => {
        if (selectedIds.length === 0) {
            toast.warning("Selecciona al menos un equipo de la lista");
            return;
        }
        setIsAssignModalOpen(true);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10">
            {/* Controls Bar */}
            <form onSubmit={handleSearch} className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar por IMEI, modelo, marca o grado..."
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    <Button type="button" variant="outline" className="flex-1 lg:flex-none border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 font-bold border-dashed">
                        <Palette className="mr-2 h-4 w-4" />
                        Actualizar Colores
                    </Button>
                    <Button
                        type="button"
                        onClick={openAssignModal}
                        className="flex-1 lg:flex-none bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200"
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Asignar Calidad {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </Button>
                </div>
            </form>

            {/* Info Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-medium">
                Mostrando {skip + 1}-{Math.min(skip + itemsPerPage, totalItems)} de {totalItems}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[50px] pl-6">
                                <Checkbox
                                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    checked={equipos.length > 0 && selectedIds.length === equipos.filter(e => e.estado === "En Inventario").length}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                />
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-5">Dispositivo</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-5">Detalles</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-5">Estado</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-5">Calidad</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-5">Fecha</TableHead>
                            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 py-5 pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {equipos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                    No se encontraron resultados para tu búsqueda.
                                </TableCell>
                            </TableRow>
                        ) : (
                            equipos.map((equipo) => {
                                const isAssignable = equipo.estado === "En Inventario";
                                return (
                                    <TableRow key={equipo.id} className={cn("group hover:bg-slate-50/80 border-slate-100 transition-all", selectedIds.includes(equipo.id) && "bg-indigo-50/50 hover:bg-indigo-50/80")}>
                                        <TableCell className="pl-6 py-4">
                                            <Checkbox
                                                className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                checked={selectedIds.includes(equipo.id)}
                                                onCheckedChange={(checked) => handleSelectOne(!!checked, equipo.id)}
                                                disabled={!isAssignable}
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {equipo.deviceModel?.brand} {equipo.deviceModel?.modelName || equipo.modelo}
                                                </span>
                                                <span className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <span className="text-slate-300">#</span> {equipo.imei}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                                {equipo.storageGb}GB
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-medium px-3 py-1 rounded-full border border-slate-200">
                                                {equipo.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {equipo.grado && (
                                                    <Badge className={cn(
                                                        "font-black text-[10px] px-2 py-0.5 rounded shadow-sm",
                                                        equipo.grado === 'A' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                                            equipo.grado === 'B' ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100" :
                                                                equipo.grado === 'C' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                                                                    "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                                    )}>
                                                        GRADO {equipo.grado}
                                                    </Badge>
                                                )}
                                                <div className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1",
                                                    equipo.funcionalidad === 'Funcional'
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : equipo.funcionalidad ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                                )}>
                                                    {equipo.funcionalidad === 'Funcional' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                    {equipo.funcionalidad || 'Sin Func.'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {formatDateTime(equipo.fechaIngreso)}
                                                </span>
                                                <span className="text-[10px] font-medium text-indigo-500 hover:underline cursor-pointer mt-0.5">
                                                    Compra #{equipo.purchaseId}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-4">
                                            <div className="flex flex-col items-end gap-2 text-right">
                                                <EquipmentActions equipo={equipo} />
                                                {equipo.user && (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        En: {equipo.user.name || equipo.user.username}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <InventoryPagination totalPages={totalPages} currentPage={currentPage} />
            </div>

            {/* Asignar QC Dialog */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar a Control de Calidad</DialogTitle>
                        <DialogDescription>
                            Se agruparán {selectedIds.length} equipos en un nuevo lote de revisión.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAssignFormSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <Label className="text-slate-700">Seleccionar Usuario ({qcUsers.length} disponibles)</Label>
                            <Select value={selectedQcId} onValueChange={setSelectedQcId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un analista..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {qcUsers.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-slate-400" />
                                                <span>{u.name || u.username}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isAssigning} className="bg-indigo-600 hover:bg-indigo-700">
                                {isAssigning ? "Asignando..." : "Confirmar Asignación"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
