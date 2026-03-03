"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    ClipboardList,
    Trophy,
    Wallet,
    User as UserIcon,
    Settings,
    Shield,
    LogOut,
    ChevronDown,
    ChevronFirst,
    ChevronLast,
    Smartphone,
    Umbrella,
    Wrench,
    Bell,
    Package
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { cn, getProfileImageUrl } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { getUnreadCount } from '@/app/actions/notifications';
import { useEffect } from 'react';

const Sidebar = ({ initialUser, forceShow = false }: { initialUser?: any, forceShow?: boolean }) => {
    const { data: session } = useSession();
    const user = initialUser || session?.user;
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        admin: true,
        qc: false,
        garantias: false
    });
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            const count = await getUnreadCount();
            setUnreadCount(count);
        };
        fetchUnread();
        // Polling cada 30 segundos
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleSection = (section: string) => {
        if (collapsed) {
            setCollapsed(false);
            setOpenSections(prev => ({ ...prev, [section]: true }));
        } else {
            setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
        }
    };

    const role = user?.role?.toLowerCase() || '';
    const isAdmin = role === 'admin';
    const isAlmacen = role === 'almacen' || user?.canManageOrders === true;
    const isQC = role === 'control_calidad' || isAdmin;
    const isGarantiaTec = role === 'tecnico_garantias' || isAdmin;

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    forceShow ? "flex" : "hidden md:flex",
                    "flex-col bg-[#0f172a] shadow-2xl relative overflow-hidden transition-all duration-300 ease-in-out z-50 flex-shrink-0",
                    !forceShow && "m-4 rounded-3xl border border-white/10",
                    collapsed ? "w-20" : "w-72"
                )}
                style={{ height: forceShow ? '100%' : 'calc(100vh - 2rem)' }}
            >
                {/* Toggle Button - Hide on forceShow/Mobile */}
                {!forceShow && (
                    <div className={cn("absolute z-50", collapsed ? "left-0 right-0 top-4 flex justify-center" : "right-4 top-4")}>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCollapsed(!collapsed)}
                            className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all"
                        >
                            {collapsed ? <ChevronLast size={16} /> : <ChevronFirst size={16} />}
                        </Button>
                    </div>
                )}

                {/* Logo Header - Hide on forceShow as MobileNav provides its own header */}
                {!forceShow && (
                    <div className={cn("flex items-center border-b border-white/5 relative z-10 transition-all duration-300", collapsed ? "h-20 justify-center pt-8" : "h-24 px-8")}>
                        <div className="relative group cursor-pointer flex-shrink-0">
                            <Shield className={cn("text-indigo-500 relative z-10 transform group-hover:scale-110 transition-transform duration-300", collapsed ? "h-8 w-8" : "h-10 w-10 mr-3")} />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col justify-center overflow-hidden animate-in fade-in duration-300">
                                <span className="text-2xl font-black tracking-tighter text-white leading-none">SDigitalSystem</span>
                                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-[0.3em] leading-none mt-1">System</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Content */}
                <nav className={cn("flex-1 overflow-y-auto py-6 space-y-4 relative z-10", collapsed ? "px-2" : "px-4")}>
                    {isAdmin && (
                        <div className="space-y-1">
                            <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === '/'} collapsed={collapsed} user={user} />

                            <div className="pt-2">
                                <SectionHeader
                                    icon={<Briefcase size={18} />}
                                    label="Administración"
                                    isOpen={openSections.admin}
                                    onClick={() => toggleSection('admin')}
                                    collapsed={collapsed}
                                />
                                {openSections.admin && !collapsed && (
                                    <div className="mt-2 ml-3 pl-3 border-l border-white/5 space-y-1 animate-in slide-in-from-left-2 duration-300">
                                        <SubNavItem href="/users" label="Usuarios" />
                                        <SubNavItem href="/compras" label="Compras" />
                                        <SubNavItem href="/equipos" label="Inventario" />
                                        <SubNavItem href="/equipos/asignar-manual" label="Asignar por IMEI" />
                                        <SubNavItem href="/compras/proveedores" label="Proveedores" />
                                        <SubNavItem href="/compras/modelos" label="Modelos" />
                                        <SubNavItem href="/admin/pagos" label="Gestión de Pagos" />
                                        <SubNavItem href="/admin/penalidades" label="Historial Penalidades" />
                                        <SubNavItem href="/garantias" label="Garantías" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(isAdmin || isAlmacen) && (
                        <NavItem href="/pedidos" icon={<Package size={20} />} label="Pedidos Almacén" active={pathname === '/pedidos'} collapsed={collapsed} user={user} />
                    )}

                    {(isQC || isAdmin) && (
                        <div className="space-y-1">
                            {!collapsed && <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-4 mb-2 pl-4">Panel de Calidad</div>}
                            {isQC && !isAdmin && <NavItem href="/qc" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === '/qc'} collapsed={collapsed} user={user} />}
                            <NavItem href="/ranking" icon={<Trophy size={20} />} label="Ranking" active={pathname === '/ranking'} collapsed={collapsed} user={user} />
                            {isQC && !isAdmin && <NavItem href="/wallet" icon={<Wallet size={20} />} label="Mi Wallet" active={pathname === '/wallet'} collapsed={collapsed} user={user} />}
                        </div>
                    )}

                    {(isGarantiaTec || isAdmin) && (
                        <div className="space-y-1">
                            {!collapsed && <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-4 mb-2 pl-4">Servicio Técnico</div>}

                            <div className="pt-2">
                                <SectionHeader
                                    icon={<Umbrella size={18} />}
                                    label="Garantías"
                                    isOpen={openSections.garantias}
                                    onClick={() => toggleSection('garantias')}
                                    collapsed={collapsed}
                                />
                                {openSections.garantias && !collapsed && (
                                    <div className="mt-2 ml-3 pl-3 border-l border-white/5 space-y-1 animate-in slide-in-from-left-2 duration-300">
                                        <SubNavItem href="/garantias" label="Dashboard" />
                                        <SubNavItem href="/garantias/proveedores" label="Proveedores" />
                                        {isAdmin && <SubNavItem href="/garantias/pagos" label="Pagos Técnicos" />}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={cn("pt-6 border-t border-white/5", collapsed ? "flex flex-col items-center gap-2" : "")}>
                        {!collapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Sistema</p>}
                        <NavItem href="/notificaciones" icon={<Bell size={18} />} label="Notificaciones" active={pathname === '/notificaciones'} collapsed={collapsed} badge={unreadCount} user={user} />
                        <NavItem href="/profile" icon={<UserIcon size={18} />} label="Mi Perfil" active={pathname === '/profile'} collapsed={collapsed} user={user} />
                        <NavItem href="/settings" icon={<Settings size={18} />} label="Ajustes" active={pathname === '/settings'} collapsed={collapsed} user={user} />
                    </div>
                </nav>

                <div className={cn("border-t border-white/5 relative z-10 bg-black/20 backdrop-blur-md transition-all duration-300", collapsed ? "p-3 flex flex-col items-center gap-3" : "p-6")}>
                    {!collapsed && (
                        <div className="flex items-center gap-4 mb-5">
                            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg overflow-hidden shrink-0">
                                {user?.image ? (
                                    <img
                                        src={getProfileImageUrl(user.image) || ""}
                                        alt={user?.username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    user?.username?.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <p className="text-sm font-bold text-white truncate">{user?.name || user?.username}</p>
                                <p className="text-[10px] text-indigo-400 truncate uppercase font-bold tracking-wider">
                                    {user?.role?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    )}


                    <Button
                        variant="ghost"
                        className={cn("text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all rounded-xl font-bold tracking-wide", collapsed ? "w-9 h-9 p-0 justify-center" : "w-full justify-start h-10")}
                        onClick={() => signOut()}
                    >
                        <LogOut className={cn("h-4 w-4", !collapsed && "mr-3")} />
                        {!collapsed && "Cerrar Sesión"}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    );
};

// Helper Components
const NavItem = ({ href, icon, label, active, collapsed, badge, user }: { href: string; icon: React.ReactNode; label: string; active?: boolean; collapsed?: boolean; badge?: number; user?: any }) => {
    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={href} className="flex justify-center mb-2 group">
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 relative overflow-hidden",
                            active ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                        )}>
                            {href === '/profile' && user?.image ? (
                                <img
                                    src={getProfileImageUrl(user.image) || ""}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                icon
                            )}
                            {badge && badge > 0 ? (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white shadow-lg border-2 border-[#0f172a]">
                                    {badge > 9 ? '+' : badge}
                                </span>
                            ) : null}
                        </div>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Link href={href} className="block mb-1 group">
            <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition-all duration-300 cursor-pointer relative",
                active ? "bg-indigo-600/10 text-indigo-400 font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}>
                {href === '/profile' && user?.image ? (
                    <div className="h-5 w-5 rounded-full overflow-hidden shrink-0">
                        <img
                            src={getProfileImageUrl(user.image) || ""}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                    </div>
                ) : (
                    icon
                )}
                <span className="truncate">{label}</span>
                {badge && badge > 0 ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-lg">
                        {badge}
                    </span>
                ) : null}
            </div>
        </Link>
    );
};

const SubNavItem = ({ href, label }: { href: string; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} className="block mb-1">
            <div className={cn(
                "flex items-center justify-between px-3 py-2 mx-1 rounded-lg transition-all duration-300 cursor-pointer",
                isActive ? "text-white font-bold bg-white/5" : "text-slate-500 hover:text-indigo-300 hover:bg-white/5"
            )}>
                <span className="truncate text-sm">{label}</span>
            </div>
        </Link>
    );
};

const SectionHeader = ({ icon, label, isOpen, onClick, collapsed }: { icon: React.ReactNode; label: string; isOpen: boolean; onClick: () => void; collapsed?: boolean }) => {
    if (collapsed) return null;
    return (
        <button
            className={cn(
                "w-full flex items-center justify-between mb-1 px-3 py-2 mx-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 group cursor-pointer",
                isOpen && "text-white bg-white/5"
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-bold text-sm tracking-wide">{label}</span>
            </div>
            <ChevronDown size={14} className={cn("transition-transform duration-300", !isOpen && "-rotate-90")} />
        </button>
    );
};

export default Sidebar;
