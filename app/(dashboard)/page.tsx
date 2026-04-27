import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cn, getProfileImageUrl } from "@/lib/utils";

import { LoteActionButtons } from "@/components/admin/LoteActionButtons";
import { LoteDetailsModal } from "@/components/admin/LoteDetailsModal";
import { getTrabajosPendientesAprobacion } from "@/app/actions/garantias";
import { PendingWorkApproval } from "@/components/garantias/PendingWorkApproval";
import { PendingImeiRequests } from "@/components/admin/PendingImeiRequests";
import {
  DollarSign,
  Package,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  User as UserIcon,
  Clock,
  ArrowUpRight,
  Medal,
  Users,
  AlertCircle,
  Briefcase,
  Smartphone,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AutoRefresh } from "@/components/layout/AutoRefresh";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const isAdmin = userRole === "admin";

  // Redirect based on role
  if (!isAdmin) {
    if (userRole === "control_calidad") {
      redirect("/qc");
    } else if (userRole === "tecnico_garantias") {
      redirect("/garantias");
    } else if (userRole === "tecnico") {
      // O a donde corresponda en Next.js para un técnico standard
      redirect("/profile");
    } else {
      // Default fallback if role is not strictly matched
      redirect("/profile");
    }
  }

  // Data fetching
  const results = await Promise.all([
    prisma.equipo.count({ where: { estado: "En Inventario" } }),
    prisma.equipo.count({ where: { estado: "En Revisión" } }),
    prisma.equipo.count({ where: { estado: "Revisado" } }),
    prisma.lote.count({ where: { estado: { in: ["Pendiente", "Abierto"] } } }),
    prisma.lote.count({ where: { estado: "Listo para Entrega" } }),
    isAdmin ? getTrabajosPendientesAprobacion() : Promise.resolve([]),
    isAdmin ? prisma.solicitudImei.findMany({
      where: { estado: "Pendiente" },
      include: { qc: { select: { id: true, name: true, username: true, profileImage: true } } },
      orderBy: { fechaCreacion: "desc" }
    }) : Promise.resolve([])
  ]);

  const [
    enInventario,
    enRevision,
    revisados,
    lotesPendientesCount,
    lotesReadyCount,
    trabajosPendientes,
    solicitudesImeiPendientes
  ] = results as [number, number, number, number, number, any[], any[]];

  // Get lotes if admin
  const lotesToReview = (isAdmin ? await prisma.lote.findMany({
    where: { estado: { in: ["Abierto", "Pendiente", "Listo para Entrega"] } },
    include: {
      tecnico: true,
      equipos: {
        select: {
          id: true,
          imei: true,
          marca: true,
          modelo: true,
          funcionalidad: true,
          grado: true,
          observacion: true,
          deviceModel: {
            select: {
              brand: true,
              modelName: true,
              storageGb: true
            }
          }
        }
      },
      _count: {
        select: { equipos: true }
      }
    },
    take: 6,
    orderBy: { fecha: "desc" }
  }) : []) as any[];

  // Accurate Rankings based on current active work and today's activity
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const qcUsers = await prisma.user.findMany({
    where: { 
      role: 'control_calidad',
      isActive: true
    },
    select: {
      id: true,
      username: true,
      name: true,
      profileImage: true,
    }
  });

  const qcPerformance = (await Promise.all(qcUsers.map(async (user) => {
    // Active work: Assigned Eq that are in lotes not yet delivered/cancelled
    const activeEquipments = await prisma.equipo.findMany({
      where: {
        userId: user.id,
        OR: [
          { loteId: null },
          { lote: { estado: { notIn: ["Entregado", "Cancelado"] } } }
        ]
      },
      select: { estado: true }
    });

    const asignados = activeEquipments.length;
    const revisadosActivos = activeEquipments.filter(e => e.estado === 'Revisado').length;

    // Daily productivity
    const entregadosHoy = await prisma.equipoHistorial.count({
      where: {
        userId: user.id,
        estado: "Revisado",
        fecha: { gte: startOfDay }
      }
    });

    // Current work: The latest activity recorded in history (either starting a review or finishing one)
    const latestHistory = await prisma.equipoHistorial.findFirst({
      where: {
        userId: user.id,
        estado: { in: ["Revisando", "Revisado", "En Revisión"] }
      },
      include: {
        equipo: {
          include: {
            deviceModel: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    const equipoActual = latestHistory?.equipo;
    
    // Validación para actividad en tiempo real:
    // 1. El último estado debe ser "Revisando"
    // 2. El equipo aún debe estar asignado a este usuario
    // 3. El estado del equipo debe seguir siendo "En Revisión" (no "Revisado" o "Entregado")
    // 4. Para evitar sesiones huérfanas de días anteriores, verificamos que no hayan pasado más de 8 horas.
    const isLive = latestHistory?.estado === "Revisando" && 
                   equipoActual?.userId === user.id &&
                   equipoActual?.estado === "En Revisión" &&
                   latestHistory?.fecha &&
                   ((new Date().getTime() - new Date(latestHistory.fecha).getTime()) < 1000 * 60 * 60 * 8);

    if (asignados === 0 && !isLive) return null;

    return {
      ...user,
      asignados,
      revisados: revisadosActivos,
      entregadosHoy,
      avance: asignados > 0 ? (revisadosActivos / asignados) * 100 : 0,
      equipoActual,
      isLive
    };
  }))).filter(u => u !== null)
    .sort((a: any, b: any) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return (b.revisados + b.entregadosHoy) - (a.revisados + a.entregadosHoy);
    })
    .slice(0, 8);

  // Recent History
  const recentHistory = await prisma.equipoHistorial.findMany({
    take: 10,
    orderBy: { fecha: "desc" },
    include: {
      equipo: {
        include: {
          deviceModel: true
        }
      },
      user: true
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <AutoRefresh intervalMs={30000} />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-800">
            Dashboard Administrativo
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Bienvenido, <span className="text-slate-900 font-bold">{session?.user?.name || session?.user?.username}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 h-11 px-6">
            <Link href="/equipos">
              <Package className="mr-2 h-4 w-4" /> Inventario
            </Link>
          </Button>
          <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5 h-11 px-6">
            <Link href="/equipos/asignar">
              <UserIcon className="mr-2 h-4 w-4" /> Asignar a CC
            </Link>
          </Button>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 h-11 px-6">
            <Link href="/#lotes-recientes">
              <Briefcase className="mr-2 h-4 w-4" /> Lotes Pendientes
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="En Inventario"
          value={enInventario.toString()}
          subtitle="Equipos disponibles"
          icon={<Package className="h-6 w-6 text-indigo-600" />}
          variant="indigo"
          badge="Inventario"
        />
        <StatsCard
          title="En Revisión"
          value={enRevision.toString()}
          subtitle="Equipos en revisión"
          icon={<Activity className="h-6 w-6 text-amber-600" />}
          variant="amber"
          badge="En Proceso"
        />
        <StatsCard
          title="Revisado"
          value={revisados.toString()}
          subtitle="Equipos revisados"
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
          variant="emerald"
          badge="Completado"
        />
      </div>

      {/* Ranking & Stats */}
      <div className="mt-8 bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Medal className="h-6 w-6 text-indigo-200" />
            <h3 className="text-xl font-bold">Estadísticas por Control de Calidad</h3>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Control de Calidad</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Actividad Live</TableHead>
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Asignados</TableHead>
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-4 text-indigo-600">Revisados</TableHead>
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Progreso Hoy</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 py-4 pr-6">Avance Lote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcPerformance.map((qc: any, index: number) => {
                  const progress = qc.avance;
                  return (
                    <TableRow key={qc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all duration-300">
                      <TableCell className="py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative group/avatar">
                            {qc.profileImage ? (
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md transition-transform group-hover/avatar:scale-105">
                                <img
                                  src={getProfileImageUrl(qc.profileImage) || ""}
                                  alt={qc.username}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-black text-sm shadow-inner">
                                {qc.username.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {index < 3 && (
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg",
                                index === 0 ? "bg-amber-400 text-amber-900" : index === 1 ? "bg-slate-300 text-slate-700" : "bg-orange-400 text-orange-800"
                              )}>
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="font-black text-slate-800 leading-tight flex items-center gap-1.5">
                              {qc.name || qc.username}
                              {qc.isLive && (
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Trabajando ahora" />
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-bold tracking-wide uppercase">@{qc.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="py-5">
                        <div className="min-w-[180px]">
                           {qc.equipoActual ? (
                             <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                               <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1 flex items-center gap-1">
                                 <Activity className="w-3 h-3" /> {qc.isLive ? 'Revisando ahora:' : 'Último revisado:'}
                               </p>
                               <div className={cn(
                                 "p-2 rounded-xl shadow-sm border transition-colors",
                                 qc.isLive ? "bg-indigo-50 border-indigo-100/50" : "bg-slate-50 border-slate-100"
                               )}>
                                 <p className="text-xs font-bold text-slate-700 truncate max-w-[160px]">
                                   {qc.equipoActual.deviceModel?.brand} {qc.equipoActual.deviceModel?.modelName}
                                 </p>
                                 <p className="text-[9px] font-bold text-indigo-400 mt-0.5 font-mono">
                                   IMEI: {qc.equipoActual.imei.slice(-6)}
                                 </p>
                               </div>
                             </div>
                           ) : (
                             <div className="flex items-center gap-2 grayscale opacity-40">
                               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                 <Clock className="w-4 h-4 text-slate-400" />
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">En espera</p>
                             </div>
                           )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-5">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-slate-400 leading-none">{qc.asignados}</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase mt-1">Lote</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center py-5">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-indigo-600 leading-none">{qc.revisados}</span>
                          <span className="text-[9px] font-black text-indigo-400 uppercase mt-1">Listo</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-5">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-emerald-600 leading-none">{qc.entregadosHoy}</span>
                          <span className="text-[9px] font-black text-emerald-500 uppercase mt-1">Hoy</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-6 py-5">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50 p-[2px] shadow-inner">
                            <div
                              className={cn("h-full rounded-full transition-all duration-1000 shadow-sm",
                                progress >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-black text-[10px] py-0 h-5 px-2 border-indigo-100">
                             {progress.toFixed(1)}%
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Solicitudes de IMEIs Pendientes */}
      {isAdmin && solicitudesImeiPendientes.length > 0 && (
        <section className="mt-8 animate-in fade-in slide-in-from-right-4 duration-1000">
          <PendingImeiRequests solicitudes={solicitudesImeiPendientes} />
        </section>
      )}

      {/* Reported Technician Work Pending Approval */}
      {isAdmin && trabajosPendientes.length > 0 && (
        <section className="mt-8 animate-in fade-in slide-in-from-right-4 duration-1000">
          <PendingWorkApproval lotes={trabajosPendientes} />
        </section>
      )}

      {/* Lotes Pendientes */}
      {isAdmin && (
        <section id="lotes-recientes" className="mt-8 animate-in slide-in-from-left-4 duration-500 scroll-mt-24">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-slate-800">Lotes Activos y Pendientes</h3>
          </div>

          {lotesToReview.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lotesToReview.map((lote) => {
                const functional = lote.equipos.filter((e: any) => e.funcionalidad === 'Funcional').length;
                const nonFunctional = lote.equipos.filter((e: any) => e.funcionalidad === 'No funcional').length;

                return (
                  <Card key={lote.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">{lote.codigo}</CardTitle>
                          <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-400 mt-1">
                            {lote.tecnico.name || lote.tecnico.username}
                          </CardDescription>
                        </div>
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                          lote.estado === "Abierto" ? "bg-indigo-100 text-indigo-700" :
                          lote.estado === "Pendiente" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                        )}>
                          {lote.estado}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Total</p>
                            <p className="text-xl font-bold text-slate-800">{lote._count.equipos}</p>
                          </div>
                          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Buenos</p>
                            <p className="text-xl font-bold text-emerald-700">{functional}</p>
                          </div>
                          <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 text-center">
                            <p className="text-[9px] text-rose-600 font-bold uppercase tracking-tighter">Malos</p>
                            <p className="text-xl font-bold text-rose-700">{nonFunctional}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pago Estimado</span>
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-indigo-600 font-mono">RD$ {(lote._count.equipos * 50).toLocaleString()}</span>
                            <LoteDetailsModal lote={lote} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-none shadow-sm bg-slate-50 border border-slate-100">
              <CardContent className="p-8 text-center">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay lotes activos o pendientes en este momento.</p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Recent History as timeline */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Actividad Reciente</h3>
        <Card className="border-none shadow-lg bg-white p-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentHistory.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-50 transition-all flex items-center justify-between group border-l-4 border-l-transparent hover:border-l-indigo-500">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-3 h-3 rounded-full shadow-sm shrink-0",
                      item.estado === "Revisado" ? "bg-emerald-500" : "bg-indigo-500"
                    )} />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-slate-700 leading-tight">
                        <span className="font-black text-slate-900">@{item.user?.username}</span> 
                        <span className="text-slate-500 px-1.5">{item.estado === "Revisado" ? "finalizó revisión de" : "actualizó estado de"}</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.equipo.deviceModel ? `${item.equipo.deviceModel.brand} ${item.equipo.deviceModel.modelName} ${item.equipo.deviceModel.storageGb ? `${item.equipo.deviceModel.storageGb}GB` : ''}` : 'Equipo sin modelo'}
                        </span>
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> IMEI: {item.equipo.imei.slice(-6)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">•</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          ID: {item.equipo.id.toString().slice(-5)}
                        </span>
                        {item.observacion && (
                           <>
                             <span className="text-[10px] font-bold text-slate-300">•</span>
                             <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 rounded truncate max-w-[200px]">
                               Obs: {item.observacion}
                             </span>
                           </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-black text-slate-600 group-hover:text-indigo-600 transition-colors">
                      {item.fecha ? new Date(item.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5">
                      {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function StatsCard({ title, value, subtitle, icon, variant, badge }: { title: string, value: string, subtitle: string, icon: React.ReactNode, variant: 'indigo' | 'amber' | 'emerald' | 'rose', badge: string }) {
  const bgColors = {
    indigo: "bg-indigo-50",
    amber: "bg-amber-50",
    emerald: "bg-emerald-50",
    rose: "bg-rose-50",
  }

  const iconBg = {
    indigo: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
  }

  const badgeColors = {
    indigo: "bg-indigo-100 text-indigo-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
  }

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110", iconBg[variant])}>
            {icon}
          </div>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", badgeColors[variant])}>
            {badge}
          </span>
        </div>

        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{value}</h3>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

