import { getConfiguracionPago, getTecnicosGarantias } from "@/app/actions/garantias";
import { ConfigurarPagoClient } from "@/components/garantias/ConfigurarPagoClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata = {
    title: "Configurar Tarifa - RMA Señal Digital",
};

export default async function ConfigurarPagoPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/garantias");
    }

    const tecnicoId = parseInt(params.id);
    if (isNaN(tecnicoId)) notFound();

    const tecnico = await prisma.user.findUnique({
        where: { id: tecnicoId },
        select: { id: true, name: true, username: true, email: true, role: true }
    });

    if (!tecnico) notFound();

    const currentConfig = await getConfiguracionPago(tecnicoId);

    return (
        <div className="pt-4 max-w-3xl mx-auto w-full">
            <ConfigurarPagoClient
                tecnico={tecnico}
                currentConfig={currentConfig}
            />
        </div>
    );
}
