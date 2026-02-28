
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ClientListClient } from "@/components/clientes/ClientListClient";
import { Users } from "lucide-react";

export const metadata = {
    title: "Gestión de Clientes - Señal Digital",
};

export default async function ClientesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect("/");
    }

    const clients = await prisma.cliente.findMany({
        orderBy: { nombre: 'asc' }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Directorio de Clientes</h1>
                    <p className="text-slate-500 font-medium">Administra la base de datos de clientes y distribuidores.</p>
                </div>
            </div>

            <ClientListClient initialClients={clients} />
        </div>
    );
}
