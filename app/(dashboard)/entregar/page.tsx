import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldAlert, Smartphone } from "lucide-react";

import { EntregarEquiposClient } from "@/components/entregar/EntregarEquiposClient";
import { getQCUsers } from "@/app/actions/equipment";

export const metadata = {
    title: "Entregar Equipos - RMA Señal Digital",
};

export default async function EntregarEquiposPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Must be admin or control calidad
    if (session.user.role !== 'admin' && session.user.role !== 'control_calidad') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
                <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black text-slate-800">Acceso Denegado</h2>
                <p className="text-slate-500 mt-2">No tienes permisos para acceder a esta área.</p>
            </div>
        );
    }

    const qcUsers = await getQCUsers();

    return (
        <div className="flex flex-1 flex-col p-8 lg:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-500 relative z-10 w-full mb-10 pb-10">
            {/* Header Módulo */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-indigo-100/50">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 drop-shadow-sm flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        Entregar Equipos (QC)
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-2 tracking-wide flex items-center gap-2">
                        Verifica y procesa los equipos revisados a través de IMEI.
                    </p>
                </div>
            </header>

            {/* Main Area */}
            <div className="pt-4 max-w-7xl mx-auto w-full">
                <EntregarEquiposClient qcUsers={qcUsers} />
            </div>
        </div>
    );
}
