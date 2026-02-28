import { getGarantiaById } from "@/app/actions/garantias";
import { EditGarantiaClient } from "@/components/garantias/EditGarantiaClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

export const metadata = {
    title: "Editar Garantía - RMA Señal Digital",
};

export default async function EditGarantiaPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const id = parseInt(params.id);
    if (isNaN(id)) notFound();

    const garantia = await getGarantiaById(id);
    if (!garantia) notFound();

    return (
        <div className="pt-4 max-w-4xl mx-auto w-full">
            <EditGarantiaClient garantia={garantia} />
        </div>
    );
}
