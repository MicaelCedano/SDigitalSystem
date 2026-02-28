
"use client";

import { useState } from "react";
import {
    Users, Search, Plus, Mail, Phone,
    MapPin, MoreVertical, Edit2, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ClientListClient({ initialClients }: { initialClients: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        nombre: "",
        telefono: "",
        email: "",
        direccion: ""
    });

    const filtered = initialClients.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // Here we would call a server action to save the client
            // For now, let's keep it simple as I don't have the action yet
            toast.success("Cliente guardado correctamente (Próximamente)");
            setShowModal(false);
        } catch (error) {
            toast.error("Error al guardar cliente");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Nombre, email o teléfono..."
                        className="pl-12 h-14 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" /> Nuevo Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((client) => (
                    <Card key={client.id} className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-2xl font-black">
                                    {client.nombre.substring(0, 2).toUpperCase()}
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-xl">
                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-4 truncate">{client.nombre}</h3>

                            <div className="space-y-3">
                                <IconDetail icon={<Phone className="w-4 h-4" />} text={client.telefono || "Sin teléfono"} />
                                <IconDetail icon={<Mail className="w-4 h-4" />} text={client.email || "Sin email"} />
                                <IconDetail icon={<MapPin className="w-4 h-4" />} text={client.direccion || "Sin dirección"} />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold border-slate-100 hover:bg-slate-50 gap-2">
                                    <Edit2 className="w-3.5 h-3.5" /> Editar
                                </Button>
                                <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold border-rose-50 text-rose-500 hover:bg-rose-50 gap-2">
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="rounded-[2.5rem] border-none p-8 sm:max-w-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Registrar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Completo / Empresa</label>
                            <Input
                                className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Teléfono</label>
                                <Input
                                    className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold"
                                    value={form.telefono}
                                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                                <Input
                                    className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dirección</label>
                            <Input
                                className="h-12 bg-slate-50 border-none rounded-2xl px-5 font-bold"
                                value={form.direccion}
                                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={!form.nombre || isLoading}
                            onClick={handleSubmit}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black"
                        >
                            Guardar Cliente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function IconDetail({ icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-center gap-3 text-slate-500 font-medium">
            <div className="text-slate-300">{icon}</div>
            <span className="text-sm truncate">{text}</span>
        </div>
    );
}
