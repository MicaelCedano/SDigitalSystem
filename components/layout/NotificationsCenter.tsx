
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Circle, ExternalLink, Inbox, Sparkles, User, Wallet, Package, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "@/app/actions/notifications";
import { cn, getProfileImageUrl } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export function NotificationsCenter() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    const loadData = async () => {
        const [notifs, count] = await Promise.all([
            getNotifications(),
            getUnreadCount()
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
    };

    useEffect(() => {
        loadData();
        // Polling every 30 seconds for new notifications
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        const res = await markAsRead(id);
        if (res.success) {
            loadData();
        }
    };

    const handleMarkAllAsRead = async () => {
        const res = await markAllAsRead();
        if (res.success) {
            toast.success("Todas las notificaciones leídas");
            loadData();
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.leida) {
            await handleMarkAsRead(notification.id);
        }

        if (notification.targetUrl) {
            setOpen(false);
            router.push(notification.targetUrl);
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo.toLowerCase()) {
            case 'wallet':
            case 'acreditacion':
                return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Wallet className="w-4 h-4" /></div>;
            case 'logro':
            case 'award':
                return <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Sparkles className="w-4 h-4" /></div>;
            case 'lote':
                return <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Package className="w-4 h-4" /></div>;
            default:
                return <div className="p-2 bg-slate-100 text-slate-500 rounded-xl"><Activity className="w-4 h-4" /></div>;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl bg-white/50 border border-slate-100 shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-4 ring-white animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '+9' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[420px] p-0 rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <div className="bg-[#0f172a] p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Inbox className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Actividad</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bandeja de Entrada</p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-black uppercase text-indigo-400 hover:text-white hover:bg-white/10"
                            >
                                <Check className="w-3.5 h-3.5 mr-2" /> Leer Todo
                            </Button>
                        )}
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto bg-white p-2">
                    {notifications.length > 0 ? (
                        <div className="space-y-1">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "relative flex gap-4 p-4 rounded-[1.5rem] transition-all cursor-pointer group hover:bg-slate-50",
                                        !n.leida ? "bg-indigo-50/30" : ""
                                    )}
                                >
                                    <div className="flex-shrink-0">
                                        {n.actorProfileImage ? (
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                <img
                                                    src={getProfileImageUrl(n.actorProfileImage) || ""}
                                                    alt="User"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            getIcon(n.tipo)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-sm font-black text-slate-800",
                                                !n.leida && "text-indigo-900"
                                            )}>
                                                {n.titulo}
                                            </p>
                                            {!n.leida && (
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-200" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {n.mensaje}
                                        </p>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                {formatDistanceToNow(new Date(n.fecha), { addSuffix: true, locale: es })}
                                            </span>
                                            {n.monto && (
                                                <span className="text-xs font-black text-emerald-600 font-mono">
                                                    +RD$ {n.monto.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Link decoration like a social tag */}
                                    {!n.leida && (
                                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="px-2 py-1 bg-white rounded-lg shadow-sm border border-slate-100 text-[9px] font-black uppercase text-indigo-500 flex items-center gap-1">
                                                <span>Ver Detalle</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                <Inbox className="w-8 h-8 text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-600 font-black">Tu bandeja está limpia</p>
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest leading-relaxed"> No tienes actividad reciente <br /> que requiera tu atención </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Link href="/notificaciones" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 hover:bg-white tracking-[0.2em]">
                            Ver Todas las Notificaciones
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

