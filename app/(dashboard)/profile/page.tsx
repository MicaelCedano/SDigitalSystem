import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UserProfileView from "@/components/profile/UserProfileView";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const userId = parseInt(session.user.id);

    // Fetch user and stats
    const [
        user,
        totalEquipos,
        enRevision,
        revisados,
        entregados,
        achievements
    ] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                profileImage: true,
            }
        }),
        prisma.equipo.count({ where: { userId } }),
        prisma.equipo.count({ where: { userId, estado: "En Revisión" } }),
        prisma.equipoHistorial.groupBy({
            by: ['equipoId'],
            where: { userId, estado: "Revisado" }
        }),
        prisma.lote.count({ where: { tecnicoId: userId, estado: "Cerrado" } }),
        prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } })
    ]);

    if (!user) {
        redirect("/login");
    }

    // Rank Calculation
    let ranking = 0;
    let totalTecnicos = 0;

    if (user.role === 'tecnico' || user.role === 'control_calidad' || user.role === 'tecnico_garantias') {
        const rankingDataRaw = await prisma.equipoHistorial.groupBy({
            by: ['userId', 'equipoId'],
            where: {
                estado: "Revisado",
                user: {
                    role: { in: ['tecnico', 'control_calidad', 'tecnico_garantias'] }
                }
            }
        });

        const userCounts = rankingDataRaw.reduce((acc, curr) => {
            if (curr.userId) {
                acc[curr.userId] = (acc[curr.userId] || 0) + 1;
            }
            return acc;
        }, {} as Record<number, number>);

        const rankingData = Object.entries(userCounts)
            .map(([uId, count]) => ({ userId: Number(uId), count }))
            .sort((a, b) => b.count - a.count);

        totalTecnicos = rankingData.length;
        const index = rankingData.findIndex(r => r.userId === userId);
        if (index !== -1) {
            ranking = index + 1;
        } else {
            ranking = totalTecnicos + 1; // Unranked
            totalTecnicos += 1;
        }
    }

    const stats = {
        totalEquipos,
        enRevision,
        revisados: revisados.length,
        entregados,
        ranking,
        totalTecnicos
    };

    const unlockedAchievements = achievements.map(a => a.achievementId);

    return (
        <div className="flex-1 pb-20 fade-in-up duration-500">
            <UserProfileView
                user={user}
                stats={stats}
                unlockedAchievements={unlockedAchievements}
                isOwnProfile={true}
            />
        </div>
    );
}
