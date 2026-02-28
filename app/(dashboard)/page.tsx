import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { LoteActionButtons } from "@/components/admin/LoteActionButtons";
import { LoteDetailsModal } from "@/components/admin/LoteDetailsModal";
import {
  Activity,
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
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
      redirect("/garantias/dashboard");
    } else if (userRole === "tecnico") {
      // O a donde corresponda en Next.js para un técnico standard
      redirect("/profile");
    } else {
      // Default fallback if role is not strictly matched
      redirect("/profile");
    }
  }

  // Data fetching
  const [
    enInventario,
    enRevision,
    revisados,
    lotesPendientesCount,
    lotesReadyCount
  ] = await Promise.all([
    prisma.equipo.count({ where: { estado: "En Inventario" } }),
    prisma.equipo.count({ where: { estado: "En Revisión" } }),
    prisma.equipo.count({ where: { estado: "Revisado" } }),
    prisma.lote.count({ where: { estado: "Pendiente" } }),
    prisma.lote.count({ where: { estado: "Listo para Entrega" } })
  ]);

  // Get lotes if admin
  const lotesToReview = (isAdmin ? await prisma.lote.findMany({
    where: { estado: { in: ["Pendiente", "Listo para Entrega"] } },
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

  // QC Performance (Top 5)
  const qcPerformance = await prisma.user.findMany({
    where: { role: "control_calidad" },
    select: {
      id: true,
      username: true,
      name: true,
      profileImage: true,
      _count: {
        select: {
          equipos: {
            where: { estado: "Revisado" }
          }
        }
      }
    },
    take: 5,
    orderBy: {
      equipos: {
        _count: "desc"
      }
    }
  });

  // Recent History
  const recentHistory = await prisma.equipoHistorial.findMany({
    take: 8,
    orderBy: { fecha: "desc" },
    include: {
      equipo: true,
      user: true
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
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
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Asignados</TableHead>
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-4 text-indigo-600">Revisados</TableHead>
                  <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Entregados Hoy</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 py-4 pr-6">Avance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qcPerformance.map((qc, index) => {
                  const progress = Math.min((qc._count.equipos / 100) * 100, 100);
                  return (
                    <TableRow key={qc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {qc.profileImage ? (
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                                <img
                                  src={`/profile_images/${qc.profileImage}`}
                                  alt={qc.username}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                {qc.username.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {index < 3 && (
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white",
                                index === 0 ? "bg-amber-400 text-amber-900" : index === 1 ? "bg-slate-300 text-slate-700" : "bg-orange-400 text-orange-800"
                              )}>
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{qc.name || qc.username}</p>
                            <p className="text-xs text-slate-400">@{qc.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-600">--</TableCell>
                      <TableCell className="text-center font-bold text-indigo-600 text-lg">{qc._count.equipos}</TableCell>
                      <TableCell className="text-center font-bold text-emerald-600">0</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-1000",
                                progress >= 80 ? "bg-emerald-500" : progress >= 50 ? "bg-indigo-500" : "bg-indigo-300"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-indigo-600">{progress.toFixed(1)}%</span>
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

      {/* Lotes Pendientes */}
      {isAdmin && (
        <section id="lotes-recientes" className="mt-8 animate-in slide-in-from-left-4 duration-500 scroll-mt-24">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-slate-800">Lotes Pendientes de Aprobación</h3>
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

                        <LoteActionButtons loteId={lote.id} loteCodigo={lote.codigo} />
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
                <p className="text-slate-500 font-medium">No hay lotes pendientes de aprobación en este momento.</p>
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
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.estado === "Revisado" ? "bg-emerald-500" : "bg-indigo-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        <span className="font-bold text-slate-900">@{item.user?.username}</span> {item.estado === "Revisado" ? "finalizó" : "actualizó"} <span className="font-mono text-indigo-600">{item.equipo.imei.slice(-6)}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Reference ID: {item.equipo.id.toString().slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 opacity-60 group-hover:opacity-100">
                    {item.fecha ? new Date(item.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div >
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

