import { getTecnicoTransactions } from "@/app/actions/wallet";
import { TransaccionesTecnicoClient } from "@/components/garantias/TransaccionesTecnicoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export const metadata = {
    title: "Transacciones del Técnico - RMA Señal Digital",
};

export default async function TransaccionesTecnicoPage({ params }: { params: Promise<{ tecnicoId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const { tecnicoId: tIdStr } = await params;
    const tecnicoId = parseInt(tIdStr);
    if (isNaN(tecnicoId)) notFound();

    const data = await getTecnicoTransactions(tecnicoId);
    if (!data) notFound();

    return (
        <div className="pt-4 max-w-7xl mx-auto w-full">
            <TransaccionesTecnicoClient data={data} currentUser={session.user} />
        </div>
    );
}
