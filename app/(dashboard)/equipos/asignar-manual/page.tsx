
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
    Users,
    Smartphone,
    ChevronRight,
    Keyboard,
    ClipboardList
} from "lucide-react";
import { getQCUsers } from "@/app/actions/equipment";
import Link from "next/link";
import ManualAssignmentClient from "@/components/qc/ManualAssignmentClient";

export default async function ManualAssignPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        redirect("/");
    }

    const qcUsers = await getQCUsers();

    return (
        <div className="flex-1 space-y-8 relative z-10 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                        <Keyboard size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Link href="/equipos" className="text-xs font-bold uppercase tracking-wider hover:text-indigo-600 transition-colors">Inventario</Link>
                            <ChevronRight size={12} />
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Asignación Manual</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Asignación por IMEI
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            Escanea o escribe los IMEIs manualmente para crear un lote de revisión.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" className="rounded-xl border-slate-200 font-bold h-11">
                        <Link href="/equipos/asignar">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Ver Lista General
                        </Link>
                    </Button>
                </div>
            </div>

            <ManualAssignmentClient qcUsers={qcUsers} />
        </div>
    );
}

// Minimal Button shim for server component
function Button({ children, asChild, variant, className, ...props }: any) {
    const Comp = asChild ? "span" : "button";
    return <Comp className={className} {...props}>{children}</Comp>;
}
