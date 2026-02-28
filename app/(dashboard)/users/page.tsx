
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CreateUserDialog from "@/components/users/CreateUserDialog";
import UsersTableClient from "@/components/users/UsersTableClient";
import {
    Shield,
    UserPlus,
    Users as UsersIcon,
    Mail,
    MoreVertical,
    Search,
    Trash2,
    Edit2,
    CheckCircle2,
    Briefcase,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Role check - Only admin can manage users
    if (session.user.role !== 'admin') {
        redirect("/");
    }

    // Fetch users with counts
    const users = await prisma.user.findMany({
        orderBy: { id: "asc" },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            canCreateGarantias: true,
            profileImage: true,
            _count: {
                select: {
                    garantiasAsignadas: true,
                    equipos: true,
                }
            }
        }
    });

    // Calculate basic stats for the cards
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const techCount = users.filter(u => u.role.includes('tecnico')).length;
    const activeToday = Math.floor(totalUsers * 0.8); // Mock data for now

    return (
        <div className="flex-1 space-y-8 relative z-10 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <UsersIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Gestión de Personal
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Administra permisos, roles y accesos del sistema
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CreateUserDialog />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="TOTAL USUARIOS"
                    value={totalUsers}
                    icon={<UsersIcon className="h-12 w-12 text-indigo-100" />}
                    iconSmall={<UsersIcon className="h-5 w-5 text-indigo-500" />}
                    color="indigo"
                />
                <StatCard
                    title="ADMINISTRADORES"
                    value={adminCount}
                    icon={<Shield className="h-12 w-12 text-emerald-100" />}
                    iconSmall={<Shield className="h-5 w-5 text-emerald-500" />}
                    color="emerald"
                />
                <StatCard
                    title="TÉCNICOS"
                    value={techCount}
                    icon={<Briefcase className="h-12 w-12 text-amber-100" />}
                    iconSmall={<Briefcase className="h-5 w-5 text-amber-500" />}
                    color="amber"
                />
                <StatCard
                    title="ACTIVOS HOY"
                    value={activeToday}
                    icon={<Activity className="h-12 w-12 text-pink-100" />}
                    iconSmall={<Activity className="h-5 w-5 text-pink-500" />}
                    color="purple"
                />
            </div>

            {/* Main Content Area */}
            <UsersTableClient users={users} />
        </div>
    );
}

function StatCard({ title, value, icon, iconSmall, color }: { title: string, value: number, icon: any, iconSmall: any, color: 'indigo' | 'emerald' | 'amber' | 'purple' }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
                    <div className={cn("hidden group-hover:flex animate-in fade-in zoom-in duration-300",
                        color === 'indigo' ? "text-indigo-500" :
                            color === 'emerald' ? "text-emerald-500" :
                                color === 'amber' ? "text-amber-500" : "text-purple-500"
                    )}>
                        {iconSmall}
                    </div>
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight">
                    {value}
                </div>
            </div>
        </div>
    )
}
