import { getAllPenalties } from "@/app/actions/admin-payments";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PenaltiesViewClient } from "@/components/admin/PenaltiesViewClient";

export const metadata = {
    title: "Todas las Penalidades - RMA Señal Digital",
};

export default async function AllPenaltiesPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/login");
    }

    const data = await getAllPenalties();

    if (!data) {
        return (
            <div className="p-10 text-center">
                <p className="text-rose-500 font-bold">Error al cargar las penalidades.</p>
            </div>
        );
    }

    return (
        <div className="pt-4 max-w-[1400px] mx-auto w-full px-4 md:px-0">
            <PenaltiesViewClient data={data} />
        </div>
    );
}
