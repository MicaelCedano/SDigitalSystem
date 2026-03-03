"use client";

import { useState } from "react";
import { Trophy, Award, TrendingUp, Calendar, Globe, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingProps {
    topDia: any[];
    topMes: any[];
    topGlobal: any[];
    currentUser: any;
}

export function RankingClient({ topDia, topMes, topGlobal, currentUser }: RankingProps) {
    const [activeTab, setActiveTab] = useState("mes");

    const getData = () => {
        if (activeTab === "hoy") return topDia;
        if (activeTab === "mes") return topMes;
        return topGlobal;
    };

    const data = getData();
    const topThree = data.slice(0, 3);
    const others = data.slice(3);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                            Tablero de Honor
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold max-w-xl text-lg pl-1">
                        Reconocimiento a los técnicos con mayor volumen de equipos revisados.
                        <span className="text-indigo-600 ml-1 italic">¡La excelencia es nuestra meta!</span>
                    </p>
                </div>

                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xl flex gap-1 w-fit">
                    <TabButton active={activeTab === 'hoy'} onClick={() => setActiveTab('hoy')} icon={<Calendar className="w-4 h-4" />} label="Hoy" />
                    <TabButton active={activeTab === 'mes'} onClick={() => setActiveTab('mes')} icon={<TrendingUp className="w-4 h-4" />} label="Este Mes" />
                    <TabButton active={activeTab === 'global'} onClick={() => setActiveTab('global')} icon={<Globe className="w-4 h-4" />} label="Global" />
                </div>
            </div>

            {/* Podium Section */}
            <div className="relative pt-12 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto">
                    {/* 2nd Place */}
                    <PodiumCard
                        rank={2}
                        data={topThree[1]}
                        className="md:order-1 h-[280px] bg-slate-50/50"
                        color="text-slate-400"
                        medal="🥈"
                    />

                    {/* 1st Place */}
                    <PodiumCard
                        rank={1}
                        data={topThree[0]}
                        className="md:order-2 h-[340px] bg-indigo-50/50 border-indigo-100 scale-110 z-10"
                        color="text-amber-500"
                        medal="🥇"
                    />

                    {/* 3rd Place */}
                    <PodiumCard
                        rank={3}
                        data={topThree[2]}
                        className="md:order-3 h-[240px] bg-orange-50/50"
                        color="text-orange-500"
                        medal="🥉"
                    />
                </div>
            </div>

            {/* Others List */}
            {others.length > 0 && (
                <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-12">
                    <div className="bg-slate-50/80 px-8 py-4 border-b border-slate-100">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Resto del Ranking</h4>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {others.map((item, i) => (
                            <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-6">
                                    <span className="text-xl font-black text-slate-300 w-8 group-hover:text-slate-500 transition-colors">#{i + 4}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg overflow-hidden shrink-0">
                                            {item.tecnico.profileImage ? (
                                                <img
                                                    src={item.tecnico.profileImage}
                                                    alt={item.tecnico.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                item.tecnico.name?.substring(0, 1) || item.tecnico.username?.substring(0, 1)
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-lg leading-tight">{item.tecnico.name || item.tecnico.username}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Técnico QC</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-slate-800 font-mono leading-none">{item.count}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Equipos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.length === 0 && (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Medal className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">No hay datos suficientes</h3>
                    <p className="text-slate-500 font-medium">Sigue revisando equipos para aparecer en el ranking.</p>
                </div>
            )}
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300",
                active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
        >
            {icon}
            {label}
        </button>
    );
}

function PodiumCard({ rank, data, className, color, medal }: { rank: number, data?: any, className?: string, color: string, medal: string }) {
    if (!data) return (
        <div className={cn("rounded-[2.5rem] p-8 flex flex-col items-center justify-center border border-slate-100 opacity-40", className)}>
            <div className="w-16 h-16 rounded-full bg-slate-200 mb-4" />
            <div className="h-4 w-24 bg-slate-200 rounded-full mb-2" />
            <div className="h-8 w-16 bg-slate-200 rounded-full" />
        </div>
    );

    return (
        <div className={cn(
            "rounded-[2.5rem] p-8 flex flex-col items-center justify-between border border-transparent shadow-xl transition-all duration-500 hover:translate-y-[-8px] relative overflow-hidden group",
            className
        )}>
            {/* Background Decor */}
            <div className="absolute -right-4 -top-4 text-8xl opacity-5 grayscale group-hover:grayscale-0 transition-all duration-500">
                {medal}
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10 w-full">
                <div className="relative">
                    <div className={cn(
                        "w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-transform duration-500 group-hover:scale-110",
                        rank === 1 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                            rank === 2 ? "bg-slate-400" : "bg-orange-400"
                    )}>
                        {data.tecnico.profileImage ? (
                            <img src={data.tecnico.profileImage} className="w-full h-full object-cover rounded-[2rem]" />
                        ) : (
                            data.tecnico.name?.substring(0, 1) || data.tecnico.username?.substring(0, 1)
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center text-xl">
                        {medal}
                    </div>
                </div>

                <div className="text-center">
                    <p className="font-black text-slate-800 text-xl leading-snug group-hover:text-indigo-600 transition-colors truncate w-full max-w-[180px]">
                        {data.tecnico.name || data.tecnico.username}
                    </p>
                    <p className={cn("text-xs font-black uppercase tracking-widest mt-0.5", color)}>
                        {rank === 1 ? "Campeón" : rank === 2 ? "Subcampeón" : "Tercer Puesto"}
                    </p>
                </div>
            </div>

            <div className="text-center relative z-10">
                <p className="text-5xl font-black text-slate-800 font-mono tracking-tighter group-hover:scale-110 transition-transform">
                    {data.count}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Equipos Revisados</p>
            </div>
        </div>
    );
}
