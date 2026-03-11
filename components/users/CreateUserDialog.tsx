
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { createUser } from "@/app/actions/user";

export default function CreateUserDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const result = await createUser(formData);

        if (result?.error) {
            alert(result.error);
        } else {
            setOpen(false);
        }
        setIsLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/30">
                    <UserPlus className="w-5 h-5" />
                    <span>Nuevo Usuario</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-white border-none p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                <DialogHeader className="bg-slate-50 p-8 border-b border-slate-100 flex flex-row items-center gap-4 space-y-0">
                    <div className="p-4 bg-indigo-100 rounded-3xl shrink-0">
                        <UserPlus className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">Crear Usuario</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500 mt-1">
                            Ingresa los datos del nuevo usuario del sistema.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <form onSubmit={onSubmit} className="flex flex-col">
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                                Usuario
                            </label>
                            <input
                                id="username"
                                name="username"
                                className="flex h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                placeholder="ej. jdoe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                                Nombre Completo
                            </label>
                            <input
                                id="name"
                                name="name"
                                className="flex h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                placeholder="ej. John Doe (Opcional)"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                                Email (Opcional)
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="flex h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                placeholder="jdoe@ejemplo.com"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="flex h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="role" className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                                    Rol en el Sistema
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    defaultValue="tecnico"
                                    className="flex h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="control_calidad">Ctrl. Calidad</option>
                                    <option value="tecnico_garantias">Téc. Garantías</option>
                                    <option value="tecnico">Técnico Std</option>
                                    <option value="vendedor">Vendedor</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-14 px-8 rounded-full font-black text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center justify-center h-14 px-8 rounded-full font-black text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    CREANDO...
                                </>
                            ) : (
                                "CREAR USUARIO"
                            )}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
