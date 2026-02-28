
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Smartphone,
    Plus,
    Download,
    Search,
    Package,
    Clock,
    CheckSquare,
    Database,
    Pencil,
    History,
    RefreshCw,
    ShoppingBag,
    Palette,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryPagination } from "@/components/inventory/InventoryPagination";
import { cn } from "@/lib/utils";
import { EquipmentActions } from "@/components/inventory/EquipmentActions";
import { InventoryTableClient } from "@/components/inventory/InventoryTableClient";
import { getQCUsers } from "@/app/actions/equipment";

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: { q?: string; status?: string; page?: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const query = searchParams?.q || "";
    // const status = searchParams?.status || "all"; // Not used in this specific view for now, usually
    const currentPage = Number(searchParams?.page) || 1;
    const itemsPerPage = 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Construct Where Clause
    const whereClause: any = {
        AND: [
            // status !== "all" ? { estado: status } : {}, // Keep simple for now matching logic
            query
                ? {
                    OR: [
                        { imei: { contains: query, mode: "insensitive" } },
                        { modelo: { contains: query, mode: "insensitive" } },
                        { lote: { codigo: { contains: query, mode: "insensitive" } } },
                        { deviceModel: { modelName: { contains: query, mode: "insensitive" } } },
                        { deviceModel: { brand: { contains: query, mode: "insensitive" } } },
                    ],
                }
                : {},
        ],
    };

    // Parallel Data Fetching
    const [totalItems, equipos, stats] = await Promise.all([
        prisma.equipo.count({ where: whereClause }),
        prisma.equipo.findMany({
            where: whereClause,
            take: itemsPerPage,
            skip: skip,
            orderBy: { id: "desc" },
            include: {
                deviceModel: true,
                lote: true,
                purchase: true, // Need purchase info
                user: true // Need user info for "En: [User]"
            },
        }),
        Promise.all([
            prisma.equipo.count(),
            prisma.equipo.count({ where: { estado: 'En Inventario' } }),
            prisma.equipo.count({ where: { estado: 'En Revisión' } }),
            prisma.equipo.count({ where: { estado: 'Revisado' } })
        ])
    ]);

    const [totalEquipos, inStock, inRevision, reviewed] = stats;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const qcUsers = await getQCUsers();

    return (
        <div className="flex-1 space-y-8 relative z-10 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Package size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Inventario de Equipos
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Gestiona y monitorea el stock de dispositivos
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold shadow-sm">
                        <ShoppingBag className="mr-2 h-4 w-4 text-slate-500" />
                        Ver Compras
                    </Button>
                    <Button className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Compra
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="TOTAL EQUIPOS"
                    value={totalEquipos}
                    icon={<Database className="h-12 w-12 text-indigo-100" />}
                    iconSmall={<Database className="h-5 w-5 text-indigo-500" />}
                    color="indigo"
                />
                <StatCard
                    title="EN INVENTARIO"
                    value={inStock}
                    icon={<Package className="h-12 w-12 text-emerald-100" />}
                    iconSmall={<Package className="h-5 w-5 text-emerald-500" />}
                    color="emerald"
                />
                <StatCard
                    title="EN REVISIÓN"
                    value={inRevision}
                    icon={<Clock className="h-12 w-12 text-amber-100" />}
                    iconSmall={<Clock className="h-5 w-5 text-amber-500" />}
                    color="amber"
                />
                <StatCard
                    title="REVISADO"
                    value={reviewed}
                    icon={<CheckSquare className="h-12 w-12 text-indigo-100" />}
                    iconSmall={<CheckSquare className="h-5 w-5 text-indigo-400" />}
                    color="purple"
                />
            </div>

            <InventoryTableClient
                equipos={equipos}
                totalItems={totalItems}
                skip={skip}
                itemsPerPage={itemsPerPage}
                totalPages={totalPages}
                currentPage={currentPage}
                query={query}
                qcUsers={qcUsers}
            />
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
