
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConduces } from "@/app/actions/garantias";
import { ConduceListClient } from "../../../components/garantias/ConduceListClient";
import { Truck } from "lucide-react";

export const metadata = {
    title: "Conduces de Envío - Señal Digital",
};

export default async function ConducesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect("/");
    }

    const conduces = await getConduces();

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-slate-900 rounded-[2rem] shadow-xl">
                    <Truck className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Conduces de Envío</h1>
                    <p className="text-slate-500 font-medium">Historial de manifiestos y despacho de equipos.</p>
                </div>
            </div>

            <ConduceListClient initialConduces={conduces} />
        </div>
    );
}
