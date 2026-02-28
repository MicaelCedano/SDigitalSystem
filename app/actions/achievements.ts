"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ACHIEVEMENTS_DEF } from "../lib/achievements-config";

type AchievementDefinition = {
    id: string;
    icono: string;
    titulo: string;
    descripcion: string;
    requisito: (stats: any) => boolean;
};

// Map requirements to definitions
const ACHIEVEMENTS: AchievementDefinition[] = ACHIEVEMENTS_DEF.map(def => {
    const requirements: Record<string, (s: any) => boolean> = {
        "primer_equipo": (s) => s.revisados > 0,
        "10_equipos": (s) => s.revisados >= 10,
        "25_equipos": (s) => s.revisados >= 25,
        "50_equipos": (s) => s.revisados >= 50,
        "100_equipos": (s) => s.revisados >= 100,
        "250_equipos": (s) => s.revisados >= 250,
        "500_equipos": (s) => s.revisados >= 500,
        "1000_equipos": (s) => s.revisados >= 1000,
        "5_hoy": (s) => s.revisadosHoy >= 5,
        "10_hoy": (s) => s.revisadosHoy >= 10,
        "20_hoy": (s) => s.revisadosHoy >= 20,
        "sin_penalidades_10": (s) => s.penalidades === 0 && s.revisados >= 10,
        "sin_penalidades_50": (s) => s.penalidades === 0 && s.revisados >= 50,
        "10_entregados": (s) => s.lotesEntregados >= 10,
        "50_entregados": (s) => s.lotesEntregados >= 50,
        "top_10": (s) => s.posicionRanking !== null && s.posicionRanking <= 10,
        "numero_1": (s) => s.posicionRanking === 1,
    };

    return {
        id: def.id,
        icono: def.icon,
        titulo: def.title,
        descripcion: def.desc,
        requisito: requirements[def.id] || (() => false)
    };
});


/**
 * Checks and unlocks achievements for a user.
 * @param userId User ID to check
 */
export async function checkAchievements(userId: number) {
    try {
        // 1. Fetch current stats
        const revisados = await prisma.equipoHistorial.count({
            where: { userId, estado: "Revisado" }
        });

        const lotesEntregados = await prisma.lote.count({
            where: { tecnicoId: userId, estado: "Entregado" }
        });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const revisadosHoy = await prisma.equipoHistorial.count({
            where: {
                userId,
                estado: "Revisado",
                fecha: { gte: startOfDay }
            }
        });

        const penalidades = await prisma.penalidad.count({
            where: { tecnicoId: userId }
        });

        // Calculate Ranking Position
        const ranking = await prisma.user.findMany({
            where: { role: { in: ['tecnico', 'control_calidad', 'tecnico_garantias'] } },
            select: {
                id: true,
                _count: {
                    select: { equipoHistorial: { where: { estado: 'Revisado' } } }
                }
            }
        });

        const sortedRanking = ranking.sort((a, b) => b._count.equipoHistorial - a._count.equipoHistorial);
        const posicionRanking = sortedRanking.findIndex(u => u.id === userId) + 1 || null;

        const stats = {
            revisados,
            revisadosHoy,
            lotesEntregados,
            penalidades,
            posicionRanking
        };

        // 2. Fetch already unlocked achievements
        const unlocked = await prisma.userAchievement.findMany({
            where: { userId },
            select: { achievementId: true }
        });
        const unlockedIds = new Set(unlocked.map(a => a.achievementId));

        // 3. Evaluate new achievements
        const newAchievements = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id) && a.requisito(stats));

        if (newAchievements.length > 0) {
            await prisma.$transaction(async (tx) => {
                // Save achievement records
                await tx.userAchievement.createMany({
                    data: newAchievements.map(a => ({
                        userId,
                        achievementId: a.id,
                        unlockedAt: new Date()
                    }))
                });

                // Create notifications
                await tx.notification.createMany({
                    data: newAchievements.map(a => ({
                        tecnicoId: userId,
                        tipo: 'logro_desbloqueado',
                        titulo: `¡Nuevo Logro: ${a.titulo}!`,
                        mensaje: `Has desbloqueado el logro '${a.titulo}': ${a.descripcion}. ${a.icono}`,
                        leida: false,
                        fecha: new Date()
                    }))
                });
            });


            revalidatePath("/");
            return {
                success: true,
                count: newAchievements.length,
                achievements: newAchievements.map(({ id, icono, titulo, descripcion }) => ({ id, icono, titulo, descripcion }))
            };
        }

        return { success: true, count: 0 };
    } catch (error) {
        console.error("Error checking achievements:", error);
        return { success: false, error: "Error al procesar logros" };
    }
}
