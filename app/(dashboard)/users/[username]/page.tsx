import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import UserProfileView from "@/components/profile/UserProfileView";

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const session = await getServerSession(authOptions);
    const { username } = await params;

    if (!session) {
        redirect("/login");
    }

    // Fetch user and stats
    const user = await prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
            _count: {
                select: {
                    equipos: true,
                    garantiasAsignadas: true,
                    achievements: true,
                }
            }
        }
    });

    if (!user) {
        return notFound();
    }

    const userId = user.id;

    const [
        totalEquipos,
        enRevision,
        revisados,
        entregados,
        achievements
    ] = await Promise.all([
        prisma.equipo.count({ where: { userId } }),
        prisma.equipo.count({ where: { userId, estado: "En Revisión" } }),
        prisma.equipoHistorial.count({ where: { userId, estado: "Revisado" } }),
        prisma.lote.count({ where: { tecnicoId: userId, estado: "Cerrado" } }),
        prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } })
    ]);

    // Rank Calculation
    let ranking = 0;
    let totalTecnicos = 0;

    if (user.role === 'tecnico' || user.role === 'control_calidad' || user.role === 'tecnico_garantias') {
        const rankingData = await prisma.equipoHistorial.groupBy({
            by: ['userId'],
            where: {
                estado: "Revisado",
                user: {
                    role: { in: ['tecnico', 'control_calidad', 'tecnico_garantias'] }
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: { id: 'desc' }
            }
        });

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
        revisados,
        entregados,
        ranking,
        totalTecnicos
    };

    const unlockedAchievements = achievements.map(a => a.achievementId);
    const isOwnProfile = session.user.id === user.id.toString();

    return (
        <div className="flex-1 pb-20 fade-in-up duration-500">
            <UserProfileView
                user={user}
                stats={stats}
                unlockedAchievements={unlockedAchievements}
                isOwnProfile={isOwnProfile}
            />
        </div>
    );
}
