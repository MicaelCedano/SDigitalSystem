import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ChevronRight, Send } from "lucide-react";
import Link from "next/link";
import SolicitarImeisClient from "@/components/qc/SolicitarImeisClient";

export default async function SolicitarImeisPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'control_calidad') {
        redirect("/");
    }

    return (
        <div className="flex-1 space-y-8 relative z-10 pb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Send size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Link href="/qc" className="text-xs font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors">Mi Panel</Link>
                            <ChevronRight size={12} />
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Solicitar IMEIs</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Solicitar Equipos</h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Ingresa los IMEIs que quieres revisar y envía la solicitud al admin.
                        </p>
                    </div>
                </div>
            </div>

            <SolicitarImeisClient />
        </div>
    );
}
