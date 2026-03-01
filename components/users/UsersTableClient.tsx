"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, MoreVertical, Search, Shield, UserPlus, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getProfileImageUrl } from "@/lib/utils";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EditUserModal } from "./EditUserModal";

interface UsersTableClientProps {
    users: any[];
}

export default function UsersTableClient({ users }: UsersTableClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<any>(null);

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Controls Bar */}
            <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar usuario por nombre, rol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
                    />
                </div>
                <div className="px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-widest border border-slate-100">
                    {filteredUsers.length} Registros
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[80px] pl-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 py-5">Colaborador</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 py-5">Contacto</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 py-5">Rol / Permisos</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 py-5">Rendimiento</TableHead>
                            <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 py-5">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((u, idx) => (
                            <TableRow
                                key={u.id}
                                className="group hover:bg-slate-50/80 border-slate-100 transition-all"
                            >
                                <TableCell className="pl-6 py-4 font-mono text-xs text-slate-400 font-bold">
                                    #{u.id.toString().padStart(3, '0')}
                                </TableCell>
                                <TableCell className="py-4">
                                    <Link href={`/users/${u.username}`} className="flex items-center gap-3 group/link">
                                        {u.profileImage ? (
                                            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-sm group-hover/link:scale-105 transition-transform duration-300">
                                                <img
                                                    src={getProfileImageUrl(u.profileImage) || ""}
                                                    alt={u.username}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm group-hover/link:scale-105 transition-transform duration-300">
                                                {u.username.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm group-hover/link:text-indigo-600 transition-colors">
                                                {u.username}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {u.name || "Sin nombre completo"}
                                            </span>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-700 transition-colors">
                                        <Mail size={14} className="text-slate-400" />
                                        <span className="text-xs font-medium">{u.email || "No registrado"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <Badge
                                        className={cn(
                                            "font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm border",
                                            u.role === 'admin'
                                                ? "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        )}
                                    >
                                        {u.role === 'admin' ? <Shield size={10} className="mr-1" /> : <UserPlus size={10} className="mr-1" />}
                                        {u.role.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                            <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded">
                                                {u._count?.garantiasAsignadas || 0} RMA
                                            </span>
                                            <span className="bg-amber-100 text-amber-700 px-1.5 rounded">
                                                {u._count?.equipos || 0} Stock
                                            </span>
                                        </div>
                                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${Math.min(((u._count?.garantiasAsignadas || 0) / 20) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    <div className="flex items-center justify-end gap-1 opacity-100 transition-all transform duration-300">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingUser(u)}
                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                        >
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <EditUserModal
                user={editingUser}
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
            />
        </div>
    );
}
