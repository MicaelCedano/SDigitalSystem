"use client";

import { useState } from "react";
import { Award, CheckCircle2, Package, Smartphone, Edit2, Medal, Trophy, Star, Zap, Shield, Crown, Clock, Mail } from "lucide-react";
import { cn, getProfileImageUrl } from "@/lib/utils";

import ProfileForm from "./ProfileForm";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS_DEF } from "@/app/lib/achievements-config";

interface UserProfileViewProps {
    user: any;
    stats: {
        totalEquipos: number;
        enRevision: number;
        revisados: number;
        entregados: number;
        ranking: number;
        totalTecnicos: number;
    };
    unlockedAchievements: string[];
    isOwnProfile: boolean;
}



export default function UserProfileView({ user, stats, unlockedAchievements, isOwnProfile }: UserProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="space-y-6">
                <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                    Volver al Perfil
                </Button>
                <ProfileForm user={user} />
            </div>
        );
    }

    // Determine unlocked vs locked locally if user.role isn't admin
    // For admin, we just unlock everything basically or default to empty
    const unlocked = user.role === 'admin'
        ? ACHIEVEMENTS_DEF
        : ACHIEVEMENTS_DEF.filter(a => unlockedAchievements.includes(a.id));

    const locked = user.role === 'admin'
        ? []
        : ACHIEVEMENTS_DEF.filter(a => !unlockedAchievements.includes(a.id));

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Banner superior */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-800">
                {/* Decoration effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8">
                    {/* Foto de perfil con corona flotante (si aplica) */}
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-white/20 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                            {user.profileImage ? (
                                <img
                                    src={getProfileImageUrl(user.profileImage) || ""}
                                    alt={user.username}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-5xl font-black">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {stats.ranking === 1 && (
                            <div className="absolute -top-8 -right-8 text-6xl animate-bounce" style={{ filter: "drop-shadow(0 0 15px rgba(251,191,36,0.8))" }}>
                                👑
                            </div>
                        )}
                        {stats.ranking > 0 && (
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white/20 text-sm">
                                #{stats.ranking}
                            </div>
                        )}
                    </div>

                    {/* Info de usuario */}
                    <div className="flex-1 text-center md:text-left text-white">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h1 className="text-4xl md:text-5xl font-black drop-shadow-md tracking-tight">
                                {user.name || user.username}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                            <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl font-bold border border-white/10">
                                @{user.username}
                            </span>
                            {user.email && (
                                <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </span>
                            )}
                            {(user.role === 'tecnico' || user.role === 'control_calidad') && stats.ranking > 0 && (
                                <span className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 rounded-xl font-black shadow-lg">
                                    Top {stats.ranking} / {stats.totalTecnicos}
                                </span>
                            )}
                            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl font-bold border border-white/10 uppercase tracking-widest text-xs">
                                {user.role.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Editar */}
                    {isOwnProfile && (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 font-bold px-6 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
                        >
                            <Edit2 className="w-5 h-5 mr-2" />
                            Editar Perfil
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats (si aplica) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="TOTAL"
                    value={stats.totalEquipos}
                    icon={<Smartphone className="w-8 h-8 opacity-50 text-white" />}
                    color="from-blue-600 to-indigo-600"
                />
                <StatCard
                    title="EN PROCESO"
                    value={stats.enRevision}
                    icon={<Clock className="w-8 h-8 opacity-50 text-white" />}
                    color="from-amber-500 to-orange-600"
                />
                <StatCard
                    title="COMPLETADOS"
                    value={stats.revisados}
                    icon={<CheckCircle2 className="w-8 h-8 opacity-50 text-white" />}
                    color="from-emerald-500 to-green-600"
                />
                <StatCard
                    title="ENTREGADOS"
                    value={stats.entregados}
                    icon={<Package className="w-8 h-8 opacity-50 text-white" />}
                    color="from-pink-500 to-rose-600"
                />
            </div>

            {/* Logros (Grid de Tarjetas Negras) */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-5 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-amber-300" />
                        LOGROS
                    </h3>
                    <span className="bg-black/20 text-white px-4 py-1 rounded-full font-bold text-sm backdrop-blur-md">
                        {unlocked.length} / {unlocked.length + locked.length}
                    </span>
                </div>

                <div className="p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {/* Unlocked */}
                    {unlocked.length > 0 && (
                        <div className="mb-8">
                            <h4 className="flex items-center gap-2 text-sm font-black text-emerald-400 mb-4 tracking-widest uppercase">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Desbloqueados
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {unlocked.map((logro) => (
                                    <div key={logro.id} className="bg-slate-800/50 rounded-2xl p-4 border border-emerald-500/20 hover:border-emerald-500/50 transition-colors group flex gap-4">
                                        <div className="text-4xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                            {logro.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-white mb-1 leading-tight">{logro.title}</h5>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-slate-400">{logro.desc}</p>
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Locked */}
                    {locked.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-black text-slate-500 mb-4 tracking-widest uppercase">
                                <span className="w-2 h-2 rounded-full bg-slate-500" />
                                Bloqueados
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {locked.map((logro) => (
                                    <div key={logro.id} className="bg-slate-800/20 rounded-2xl p-4 border border-slate-800 opacity-60 flex gap-4 grayscale scale-95">
                                        <div className="text-4xl opacity-50">
                                            {logro.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-bold text-slate-400 mb-1 leading-tight">{logro.title}</h5>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-slate-500">{logro.desc}</p>
                                                <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded ml-2 uppercase tracking-tighter">
                                                    Bloqueado
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <div className={cn("rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:scale-105 transition-transform duration-300", "bg-gradient-to-br", color)}>
            <div className="absolute -right-4 -top-4 opacity-20 scale-150 rotate-12 transition-transform duration-500 group-hover:scale-[2] group-hover:rotate-45">
                {icon}
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                    <span className="text-5xl font-black text-white">{value}</span>
                </div>
                <div className="text-xs font-black text-white/80 uppercase tracking-widest">
                    {title}
                </div>
            </div>
        </div>
    );
}
