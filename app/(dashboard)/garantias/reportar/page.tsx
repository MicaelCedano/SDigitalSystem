
import { Metadata } from "next";
import { Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportWorkForm } from "@/components/garantias/ReportWorkForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Reportar Trabajo | Servicio Técnico",
};

export default async function ReportarTrabajoPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'tecnico_garantias') {
        redirect("/garantias");
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000" />

                <div className="flex items-center gap-6 relative z-10">
                    <Link href="/garantias">
                        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                            <ArrowLeft className="h-7 w-7" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Zap className="h-6 w-6 text-amber-500" />
                            <h1 className="text-4xl font-bold text-slate-800 tracking-tighter">Reportar Trabajo</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Registra equipos reparados para solicitar tu pago y guardar el historial.</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="px-6 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Servicio Técnico</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-50 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-96 h-96 -mb-48 -mr-48 bg-slate-50 rounded-full opacity-50" />
                <div className="relative z-10">
                    <ReportWorkForm />
                </div>
            </div>
        </div>
    );
}
