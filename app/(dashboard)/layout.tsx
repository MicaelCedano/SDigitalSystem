
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { NotificationsCenter } from "@/components/layout/NotificationsCenter";
import { MobileNav } from "@/components/layout/MobileNav";
import { ChatFloating } from "@/components/layout/ChatFloating";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#F3F4F6]">
            {/* Mobile Header/Nav */}
            <MobileNav user={session.user} />

            {/* Sidebar (Desktop) */}
            <Sidebar initialUser={session.user} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto md:m-4 md:ml-0 md:rounded-3xl relative z-10 transition-all duration-300">
                {/* Fixed Top Actions Bar (Desktop Only) */}
                <div className="hidden md:flex absolute top-8 right-12 z-50 items-center gap-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <NotificationsCenter />
                    </div>
                </div>

                <div className="p-4 md:p-8 h-full">
                    {children}
                </div>
            </main>

            {/* Real-time Chat Floating UI */}
            <ChatFloating currentUser={session.user} />
        </div>
    );
}
