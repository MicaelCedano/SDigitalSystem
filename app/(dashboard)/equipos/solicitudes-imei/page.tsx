import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Send } from "lucide-react";
import { PendingImeiRequests } from "@/components/admin/PendingImeiRequests";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function SolicitudesImeiAdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') redirect("/");

    const [pendientes, historial] = await Promise.all([
        prisma.solicitudImei.findMany({
            where: { estado: "Pendiente" },
            include: { qc: { select: { id: true, name: true, username: true, profileImage: true } } },
            orderBy: { fechaCreacion: "desc" }
        }),
        prisma.solicitudImei.findMany({
            where: { estado: { in: ["Aprobado", "Rechazado"] } },
            include: {
                qc: { select: { id: true, name: true, username: true } },
                admin: { select: { id: true, name: true, username: true } }
            },
            orderBy: { fechaResolucion: "desc" },
            take: 30
        })
    ]);

    return (
        <div className="flex-1 space-y-8 relative z-10 pb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Send size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Link href="/equipos" className="text-xs font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors">Inventario</Link>
                            <ChevronRight size={12} />
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Solicitudes de IMEIs</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Solicitudes de IMEIs</h2>
                        <p className="text-slate-500 font-medium text-sm">Gestiona las solicitudes de equipos enviadas por los revisores.</p>
                    </div>
                </div>
            </div>

            {pendientes.length > 0 ? (
                <PendingImeiRequests solicitudes={pendientes.map(s => ({ ...s, imeis: s.imeis as string[] }))} />
            ) : (
                <div className="text-center py-12 text-slate-400 font-medium">No hay solicitudes pendientes.</div>
            )}

            {historial.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-700">Historial</h3>
                    <div className="space-y-3">
                        {historial.map(sol => (
                            <Card key={sol.id} className="border-none shadow-sm rounded-2xl">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-xs font-black text-slate-400">Solicitud #{sol.id} · {sol.qc.name || sol.qc.username}</p>
                                            <p className="text-sm font-bold text-slate-700 mt-0.5">{(sol.imeis as string[]).length} IMEI{(sol.imeis as string[]).length !== 1 ? "s" : ""}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs text-slate-400 hidden md:block">
                                            {sol.fechaResolucion ? new Date(sol.fechaResolucion).toLocaleDateString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                                        </p>
                                        {sol.estado === "Aprobado"
                                            ? <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-black text-[10px] uppercase">Aprobado</Badge>
                                            : <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-black text-[10px] uppercase">Rechazado</Badge>
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
