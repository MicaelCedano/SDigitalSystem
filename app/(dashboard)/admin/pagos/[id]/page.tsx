
import { getTechnicianWalletHistory } from "@/app/actions/wallets";
import { TechnicianHistoryClient } from "@/components/admin/TechnicianHistoryClient";
import { notFound } from "next/navigation";

export default async function TechnicianPaymentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getTechnicianWalletHistory(Number(id));

    if (!data) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <TechnicianHistoryClient data={data} />
        </div>
    );
}
