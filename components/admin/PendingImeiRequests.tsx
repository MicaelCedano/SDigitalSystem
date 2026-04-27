"use client";

import { useState } from "react";
import { Check, X, Eye, Loader2, Smartphone, User, Clock, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

interface Solicitud {
    id: number;
    imeis: string[];
    estado: string;
    observacion: string | null;
    fechaCreacion: string | Date;
    qc: {
        id: number;
        name: string | null;
        username: string;
        profileImage?: string | null;
    };
}

export function PendingImeiRequests({ solicitudes }: { solicitudes: Solicitud[] }) {
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [viewSolicitud, setViewSolicitud] = useState<Solicitud | null>(null);
    const [rejectObs, setRejectObs] = useState("");
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const router = useRouter();

    if (!solicitudes || solicitudes.length === 0) return null;

    const handleAction = async (id: number, accion: "aprobar" | "rechazar", observacion?: string) => {
        setLoadingId(id);
        try {
            const res = await fetch(`/api/solicitudes-imei/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accion, observacion })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(accion === "aprobar" ? `✅ ${data.message}` : "Solicitud rechazada.");
                setViewSolicitud(null);
                setRejectingId(null);
                setRejectObs("");
                router.refresh();
            } else {
                toast.error(data.error || "Error al procesar solicitud.");
            }
        } catch {
            toast.error("Error de red.");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                    <Send className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Solicitudes de IMEIs Pendientes</h3>
                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-xs px-3">
                    {solicitudes.length}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {solicitudes.map((sol) => (
                    <Card key={sol.id} className="border-none shadow-xl hover:shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2.5rem] group transition-all duration-500 hover:scale-[1.02]">
                        <div className="h-2 bg-indigo-600 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </div>
                        <CardContent className="p-7">
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Solicitud #{sol.id}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        <p className="text-sm font-bold text-slate-700">{sol.qc.name || sol.qc.username}</p>
                                    </div>
                                </div>
                                <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black uppercase text-[10px] tracking-widest px-3 py-1">
                                    Pendiente
                                </Badge>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Smartphone className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equipos</p>
                                    <p className="text-sm font-black text-slate-700">{sol.imeis.length} IMEI{sol.imeis.length !== 1 ? "s" : ""}</p>
                                </div>
                            </div>

                            {sol.observacion && (
                                <p className="text-xs text-slate-500 italic bg-slate-50 rounded-xl p-3 mb-4 line-clamp-2">
                                    "{sol.observacion}"
                                </p>
                            )}

                            <div className="flex items-center gap-1.5 mb-5">
                                <Clock className="w-3 h-3 text-slate-300" />
                                <p className="text-[10px] text-slate-400">
                                    {new Date(sol.fechaCreacion).toLocaleDateString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 rounded-2xl shadow-lg shadow-emerald-100 hover:scale-105 transition-all duration-300"
                                    onClick={() => handleAction(sol.id, "aprobar")}
                                    disabled={loadingId === sol.id}
                                >
                                    {loadingId === sol.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <><Check className="w-4 h-4 mr-1.5" />Aprobar</>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewSolicitud(sol)}
                                    className="h-11 w-11 rounded-2xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setRejectingId(sol.id)}
                                    disabled={loadingId === sol.id}
                                    className="h-11 w-11 rounded-2xl border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detail Modal */}
            <Dialog open={!!viewSolicitud} onOpenChange={() => setViewSolicitud(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
                    <DialogHeader className="p-8 bg-slate-900 border-b border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Smartphone className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                    Solicitud #{viewSolicitud?.id}
                                </DialogTitle>
                                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mt-0.5">
                                    {viewSolicitud?.qc.name || viewSolicitud?.qc.username} · {viewSolicitud?.imeis.length} equipo{viewSolicitud?.imeis.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <DialogDescription className="sr-only">Detalle de la solicitud de IMEIs</DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                        {viewSolicitud?.observacion && (
                            <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Nota del revisor</p>
                                <p className="text-sm text-slate-700 italic">"{viewSolicitud.observacion}"</p>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-5">#</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-5">IMEI</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {viewSolicitud?.imeis.map((imei, i) => (
                                        <TableRow key={i} className="border-b border-slate-50">
                                            <TableCell className="py-3 px-5 text-xs font-bold text-slate-400">{i + 1}</TableCell>
                                            <TableCell className="py-3 px-5">
                                                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                    {imei}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-3">
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 font-black text-slate-400" onClick={() => setViewSolicitud(null)}>
                            Cerrar
                        </Button>
                        <Button
                            className="bg-rose-500 hover:bg-rose-600 text-white font-black px-6 rounded-2xl h-12"
                            onClick={() => { setRejectingId(viewSolicitud!.id); setViewSolicitud(null); }}
                        >
                            <X className="w-4 h-4 mr-2" />Rechazar
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl h-12 shadow-lg shadow-emerald-100"
                            onClick={() => { handleAction(viewSolicitud!.id, "aprobar"); }}
                            disabled={loadingId === viewSolicitud?.id}
                        >
                            {loadingId === viewSolicitud?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Aprobar</>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={!!rejectingId} onOpenChange={() => { setRejectingId(null); setRejectObs(""); }}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                            </div>
                            <DialogTitle className="text-xl font-black text-slate-800">Rechazar Solicitud</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-slate-500">
                            Puedes dejar un motivo para que el revisor sepa por qué fue rechazada.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        value={rejectObs}
                        onChange={e => setRejectObs(e.target.value)}
                        placeholder="Motivo del rechazo (opcional)..."
                        className="resize-none rounded-2xl border-slate-200 min-h-[100px]"
                    />

                    <div className="flex gap-3 mt-5">
                        <Button variant="ghost" className="flex-1 rounded-2xl h-12 font-black text-slate-400" onClick={() => { setRejectingId(null); setRejectObs(""); }}>
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl h-12"
                            onClick={() => handleAction(rejectingId!, "rechazar", rejectObs)}
                            disabled={loadingId === rejectingId}
                        >
                            {loadingId === rejectingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" />Confirmar Rechazo</>}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
