
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/app/actions/notifications";
import { Bell, Inbox, Sparkles, User, Wallet, Package, ArrowLeft, MoreVertical, Eye, Trash2, Check, Search, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn, getProfileImageUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const notifications = await getNotifications();

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Social Style Header */}
            <div className="bg-[#0f172a] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                                <ArrowLeft className="h-7 w-7" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Bell className="h-6 w-6 text-indigo-400" />
                                <h1 className="text-4xl font-extrabold text-white tracking-tighter">Bandeja de Actividad</h1>
                            </div>
                            <p className="text-slate-400 font-medium tracking-wide">Gestiona todas tus notificaciones y alertas del sistema.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Sin leer</p>
                            <p className="text-2xl font-black text-white">{notifications.filter(n => !n.leida).length}</p>
                        </div>
                        <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 gap-2">
                            <Check className="w-4 h-4" /> Marcar Todo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter/Search Bar */}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4 flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar en notificaciones..."
                        className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-indigo-500/20"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-100 bg-white shadow-sm text-slate-500 hover:text-indigo-600 px-6 gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Este Mes</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>
            </div>

            {/* Notifications List - Social Feed Style */}
            <div className="space-y-4">
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                "group relative bg-white p-8 rounded-[2.5rem] border transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100",
                                !n.leida ? "border-indigo-100 shadow-xl shadow-indigo-500/5" : "border-slate-100"
                            )}
                        >
                            <div className="flex gap-8">
                                {/* Large Avatar/Icon */}
                                <div className="flex-shrink-0">
                                    {n.tecnico?.profileImage ? (
                                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                            <img
                                                src={getProfileImageUrl(n.tecnico.profileImage) || ""}
                                                alt="User"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl ring-1 ring-slate-100 rotate-3 group-hover:rotate-0 transition-transform duration-500",
                                            n.tipo === 'wallet' ? "bg-emerald-100 text-emerald-600" :
                                                n.tipo === 'logro' ? "bg-amber-100 text-amber-600" :
                                                    "bg-indigo-100 text-indigo-600"
                                        )}>
                                            <Inbox className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={cn(
                                                "text-xl font-black tracking-tight",
                                                !n.leida ? "text-slate-900" : "text-slate-500"
                                            )}>
                                                {n.titulo}
                                            </h3>
                                            {!n.leida && (
                                                <Badge className="bg-indigo-100 text-indigo-600 border-none rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                                                    Nuevo
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(n.fecha || new Date()), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>

                                    <p className="text-lg text-slate-600 font-medium leading-relaxed mb-6">
                                        {n.mensaje}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">
                                                <Activity className="w-3.5 h-3.5" /> {n.tipo}
                                            </div>
                                            {n.monto && (
                                                <div className="px-4 py-1.5 bg-emerald-50 rounded-xl text-emerald-600 font-black text-sm font-mono">
                                                    +RD$ {n.monto.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-white">
                                            <Button size="sm" className="bg-indigo-600 hover:bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-9 gap-2">
                                                <Eye className="w-3.5 h-3.5" /> Revisar
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 rounded-xl h-9 w-9">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-slate-200">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-xl">
                            <Inbox className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">No tienes notificaciones</h3>
                        <p className="text-slate-400 max-w-sm mx-auto">Te avisaremos cuando haya actividad relevante en tu cuenta o equipo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Activity({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
