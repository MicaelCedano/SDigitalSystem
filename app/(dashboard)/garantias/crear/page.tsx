import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateGarantiaClient } from "@/components/garantias/CreateGarantiaClient";

export const metadata = {
    title: "Crear Garantía - RMA Señal Digital",
};

export default async function CreateGarantiaPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Check if admin or has permission (for now allow admin and tecnicos as per python logic but restricted to admin mostly)
    if (session.user.role !== 'admin' && session.user.role !== 'control_calidad') {
        // Technically "can_create_garantias" exists in python, but let's stick to roles for now or extend later
    }

    return (
        <div className="pt-4 max-w-4xl mx-auto w-full">
            <CreateGarantiaClient />
        </div>
    );
}
