"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, History, MoreVertical, Trash2 } from "lucide-react";
import { EditEquipmentDialog } from "./EditEquipmentDialog";
import { EquipmentHistoryDialog } from "./EquipmentHistoryDialog";

export function EquipmentActions({ equipo }: { equipo: any }) {
    const [editOpen, setEditOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    return (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Editar Equipo"
            >
                <Edit2 size={14} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setHistoryOpen(true)}
                className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Ver Historial"
            >
                <History size={14} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Eliminar"
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
