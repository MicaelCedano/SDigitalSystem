"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Shield, Lock, Trash2 } from "lucide-react";
import { updateUserAdmin } from "@/app/actions/user";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface EditUserModalProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Initial states based on user
    const [role, setRole] = useState(user?.role || "tecnico");
    const [canCreateGarantias, setCanCreateGarantias] = useState(user?.canCreateGarantias || false);
    const [canManageOrders, setCanManageOrders] = useState(user?.canManageOrders || false);
    const [password, setPassword] = useState("");

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append("role", role);
        formData.append("canCreateGarantias", canCreateGarantias.toString());
        formData.append("canManageOrders", canManageOrders.toString());
        if (password) {
            formData.append("password", password);
        }

        const result = await updateUserAdmin(user.id, formData);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Usuario actualizado correctamente.");
            onClose();
        }
        setIsLoading(false);
    }

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl rounded-2xl p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Shield className="w-5 h-5" />
                            </span>
                            Editar Usuario
                        </DialogTitle>
                        <DialogDescription className="text-amber-100/90 text-[13px] font-medium mt-1">
                            Modificando permisos y seguridad para <span className="font-bold text-white">{user.username}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-6 bg-slate-50">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[12px] font-bold text-slate-700">Rol del Usuario</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="h-[46px] rounded-xl border-slate-200 bg-white text-[13px] font-medium text-slate-900">
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-slate-900 border-slate-200 shadow-xl">
                                    <SelectItem value="admin" className="focus:bg-slate-100 cursor-pointer text-slate-900 focus:text-slate-900 hover:text-slate-900">Administrador</SelectItem>
                                    <SelectItem value="control_calidad" className="focus:bg-slate-100 cursor-pointer text-slate-900 focus:text-slate-900 hover:text-slate-900">Control de Calidad</SelectItem>
                                    <SelectItem value="tecnico_garantias" className="focus:bg-slate-100 cursor-pointer text-slate-900 focus:text-slate-900 hover:text-slate-900">Técnico de Garantías</SelectItem>
                                    <SelectItem value="tecnico" className="focus:bg-slate-100 cursor-pointer text-slate-900 focus:text-slate-900 hover:text-slate-900">Técnico Standard</SelectItem>
                                    <SelectItem value="vendedor" className="focus:bg-slate-100 cursor-pointer text-slate-900 focus:text-slate-900 hover:text-slate-900">Vendedor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            {(role === "control_calidad" || role === "tecnico_garantias" || role === "admin") && (
                                <div className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <Checkbox
                                        id="canCreate"
                                        checked={canCreateGarantias}
                                        onCheckedChange={(checked) => setCanCreateGarantias(checked as boolean)}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1 leading-none">
                                        <label htmlFor="canCreate" className="text-[13px] font-bold text-slate-700 cursor-pointer">
                                            Permisos de Garantías/RMA
                                        </label>
                                        <p className="text-[11px] text-slate-500">
                                            Permite recibir ingresos de nuevos lotes.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Checkbox
                                    id="canManageOrders"
                                    checked={canManageOrders}
                                    onCheckedChange={(checked) => setCanManageOrders(checked as boolean)}
                                    className="mt-0.5"
                                />
                                <div className="space-y-1 leading-none">
                                    <label htmlFor="canManageOrders" className="text-[13px] font-bold text-slate-700 cursor-pointer">
                                        Permisos de Almacén/Pedidos
                                    </label>
                                    <p className="text-[11px] text-slate-500">
                                        Permite aceptar, alistar y entregar pedidos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200/60 my-2"></div>

                        <div className="space-y-1.5">
                            <Label className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                Cambiar Contraseña (Opcional)
                            </Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Escribe para cambiar la clave actual..."
                                className="h-[46px] rounded-xl border-slate-200 bg-white text-[13px] font-medium text-slate-900 placeholder:text-slate-400"
                            />
                            <p className="text-[10px] text-slate-400 font-medium">
                                Déjalo en blanco si no quieres cambiar la clave de este usuario.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 h-11 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[13px] font-bold shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Guardar Cambios
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
