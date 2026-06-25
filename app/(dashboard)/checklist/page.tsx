import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChecklistClient } from "@/components/checklist/ChecklistClient";

export const metadata = {
    title: "Checklist de Revisión - RMA Señal Digital",
};

export default async function ChecklistPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "admin" && session.user.role !== "control_calidad")) {
        redirect("/login");
    }

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full">
            <ChecklistClient />
        </div>
    );
}
