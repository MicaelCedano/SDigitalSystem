
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
    Package,
    Users,
    ChevronRight,
    Search,
    Filter,
    ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryTableClient } from "@/components/inventory/InventoryTableClient";
import { getQCUsers } from "@/app/actions/equipment";
import Link from "next/link";

export default async function AssignQCPage({
    searchParams,
}: {
    searchParams: { q?: string; page?: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        redirect("/");
    }

    const query = searchParams?.q || "";
    const currentPage = Number(searchParams?.page) || 1;
    const itemsPerPage = 20; // More items for assignment
    const skip = (currentPage - 1) * itemsPerPage;

    // We ONLY want items that are "En Inventario" (Available for assignment)
    const whereClause: any = {
        estado: "En Inventario",
        AND: [
            query
                ? {
                    OR: [
                        { imei: { contains: query, mode: "insensitive" } },
                        { modelo: { contains: query, mode: "insensitive" } },
                        { deviceModel: { modelName: { contains: query, mode: "insensitive" } } },
                        { deviceModel: { brand: { contains: query, mode: "insensitive" } } },
                    ],
                }
                : {},
        ],
    };

    const [totalItems, equipments, qcUsers] = await Promise.all([
        prisma.equipo.count({ where: whereClause }),
        prisma.equipo.findMany({
            where: whereClause,
            take: itemsPerPage,
            skip: skip,
            orderBy: { id: "desc" },
            include: {
                deviceModel: true,
                lote: true,
                purchase: true,
            },
        }),
        getQCUsers()
    ]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="flex-1 space-y-8 relative z-10 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Users size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Link href="/equipos" className="text-xs font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors">Inventario</Link>
                            <ChevronRight size={12} />
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Asignación CC</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Asignar a Control de Calidad
                        </h2>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {totalItems} equipos listos para ser auditados
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                    <ClipboardCheck size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-amber-900 text-sm">Instrucciones de Asignación</h4>
                    <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                        Selecciona los equipos de la lista de abajo y presiona el botón <b>"Asignar Calidad"</b>. Los equipos se agruparán en un lote y se le notificará al técnico seleccionado.
                    </p>
                </div>
            </div>

            <InventoryTableClient
                equipos={equipments}
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
