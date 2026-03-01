"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, History, MoreVertical, Trash2, Eye } from "lucide-react";
import { EditEquipmentDialog } from "./EditEquipmentDialog";
import { EquipmentHistoryDialog } from "./EquipmentHistoryDialog";
import { toast } from "sonner";

export function EquipmentActions({ equipo }: { equipo: any }) {
    const [editOpen, setEditOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const handleOpenHistory = () => {
        setHistoryOpen(true);
        // Instant feedback
        toast.info("Abriendo expediente...", {
            description: `Cargando historial del IMEI ${equipo.imei}`,
            duration: 2000
        });
    };

    return (
        <div className="flex items-center justify-end gap-2 transition-all duration-300">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenHistory}
                className="h-8 px-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all font-bold gap-1.5"
                title="Ver Expediente"
            >
                <Eye size={14} />
                <span className="text-[10px] uppercase">Expediente</span>
            </Button>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-100"
                title="Editar Equipo"
            >
                <Edit2 size={14} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Eliminar"
                onClick={() => toast.error("Función de elminicón no habilitada aún")}
            >
                <Trash2 size={14} />
            </Button>

            <EditEquipmentDialog
                equipo={equipo}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            {/* Convert ID to number just in case */}
            <EquipmentHistoryDialog
                equipmentId={Number(equipo.id)}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
            />
        </div>
    );
}
