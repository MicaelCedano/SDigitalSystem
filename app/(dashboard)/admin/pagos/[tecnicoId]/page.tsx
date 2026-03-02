import { getTecnicoTransactions } from "@/app/actions/wallet";
import { TransaccionesTecnicoClient } from "@/components/garantias/TransaccionesTecnicoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export const metadata = {
    title: "Historial de Pagos del Técnico - RMA Señal Digital",
};

export default async function AdminTecnicoPaymentsPage({ params }: { params: Promise<{ tecnicoId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "admin") {
        notFound();
    }

    const { tecnicoId: tecnicoIdParam } = await params;
    const tecnicoId = parseInt(tecnicoIdParam);
    if (isNaN(tecnicoId)) notFound();

    const data = await getTecnicoTransactions(tecnicoId);
    if (!data) notFound();

    return (
        <div className="pt-4 max-w-7xl mx-auto w-full">
            <TransaccionesTecnicoClient data={data} currentUser={session.user} backHref="/admin/pagos" />
        </div>
    );
}
