"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getQCDashboardData() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";
    const isQC = session.user.role === "control_calidad";

    if (!isAdmin && !isQC) return null;

    try {
        // Find wallet balance (Principal)
        const wallet: any = await prisma.wallet.findFirst({
            where: { tecnicoId: userId },
            include: { accounts: { where: { nombre: "Principal" } } }
        });
        const saldoPrincipal = wallet?.accounts?.[0]?.saldo || 0;

        // Fetch stats for the current user (only for active work)
        const commonWhere: any = {
            userId: userId,
            OR: [
                { loteId: null },
                { lote: { estado: { notIn: ["Entregado", "Cancelado"] } } }
            ]
        };

        const cantidadPendientes = await prisma.equipo.count({
            where: {
                ...commonWhere,
                estado: "En Revisión"
            }
        });

        const totalRevisados = await prisma.equipo.count({
            where: {
                ...commonWhere,
                estado: "Revisado",
            }
        });

        const totalFuncionales = await prisma.equipo.count({
            where: {
                ...commonWhere,
                estado: "Revisado",
                funcionalidad: "Funcional"
            }
        });

        const totalNoFuncionales = await prisma.equipo.count({
            where: {
                ...commonWhere,
                estado: "Revisado",
                funcionalidad: "No funcional"
            }
        });

        // Global stats for motivational cards
        const globalInventario = await prisma.equipo.count({
            where: { estado: "En Inventario" }
        });

        const globalEnRevision = await prisma.equipo.count({
            where: { estado: "En Revisión" }
        });

        // Current assigned equipement
        const equipos = await prisma.equipo.findMany({
            where: {
                ...commonWhere,
                estado: { in: ["En Revisión", "Revisado"] }
            },
            include: { lote: true, deviceModel: true }
        });

        // Open lots for the user
        const lotesAbiertos = await prisma.lote.findMany({
            where: {
                tecnicoId: userId,
                estado: { in: ["Abierto", "Pendiente", "Listo para Entrega"] }
            },
            include: { equipos: { include: { deviceModel: true } } }
        });

        // Accurate Rankings based on EquipoHistorial (as in Python version)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // helper to get ranking data
        const getRanking = async (since?: Date, limit: number = 5) => {
            const adminUsers = await prisma.user.findMany({
                where: { role: 'admin' },
                select: { id: true }
            });
            const adminIds = adminUsers.map(u => u.id);

            const query = await prisma.equipoHistorial.groupBy({
                by: ['userId', 'equipoId'],
                where: {
                    estado: 'Revisado',
                    userId: {
                        not: null,
                        notIn: adminIds
                    },
                    ...(since ? { fecha: { gte: since } } : {})
                }
            });

            // Aggregate counts per user from the unique user-equipo pairs
            const userCounts = query.reduce((acc, curr) => {
                if (curr.userId) {
                    acc[curr.userId] = (acc[curr.userId] || 0) + 1;
                }
                return acc;
            }, {} as Record<number, number>);

            // Transform into an array, sort by count, and take the limit
            const topUsers = Object.entries(userCounts)
                .map(([userId, count]) => ({ userId: Number(userId), count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);

            const userIds = topUsers.map(u => u.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, username: true, profileImage: true }
            });

            return topUsers.map(tu => {
                const user = users.find(u => u.id === tu.userId);

                const getImageUrl = (img: string | null | undefined) => {
                    if (!img) return null;
                    if (img.startsWith('http')) return img;
                    const filename = img.split(/[/\\]/).pop();
                    return `/profile_images/${filename}`;
                };

                return {
                    tecnico: {
                        name: user?.name || user?.username || "Técnico",
                        username: user?.username,
                        profileImage: getImageUrl(user?.profileImage)
                    },
                    count: tu.count
                };
            });
        };

        const topDia = await getRanking(startOfDay, 3);
        const topMes = await getRanking(startOfMonth, 5);
        const topGlobal = await getRanking(undefined, 5);

        const rawDeviceModels = await prisma.deviceModel.findMany({
            orderBy: [{ brand: 'asc' }, { modelName: 'asc' }]
        });

        const deviceModels = rawDeviceModels.map(m => ({
            ...m,
            fullName: `${m.brand} ${m.modelName} ${m.storageGb}GB${m.color ? ` - ${m.color}` : ""}`
        }));

        const transformEquipo = (eq: any) => {
            if (eq.deviceModel) {
                eq.deviceModel.fullName = `${eq.deviceModel.brand} ${eq.deviceModel.modelName} ${eq.deviceModel.storageGb}GB${eq.deviceModel.color ? ` - ${eq.deviceModel.color}` : ""}`;
            }
            return eq;
        };

        return {
            saldoPrincipal,
            cantidadPendientes,
            totalRevisados,
            totalFuncionales,
            totalNoFuncionales,
            globalInventario,
            globalEnRevision,
            equipos: equipos.map(transformEquipo),
            lotesAbiertos: lotesAbiertos.map(lote => ({
                ...lote,
                equipos: lote.equipos?.map(transformEquipo) || []
            })),
            topGlobal,
            topDia,
            topMes,
            notificaciones: [], // Will add real notifications when notification system is fully verified
            deviceModels,
            mensajeBienvenida: { mensaje: "Recuerda revisar cada detalle minuciosamente. ¡Tu trabajo garantiza la calidad de RMA!" }
        };
    } catch (error) {
        console.error("Error fetching QC dashboard data:", error);
        return null;
    }
}

export async function reviewEquipment(equipoId: number, data: {
    modelo: string;
    funcionalidad: string;
    grado?: string;
    observacion?: string;
    deviceModelId?: number | null;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };

    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";
    const isQC = session.user.role === "control_calidad";

    if (!isAdmin && !isQC) return { success: false, error: "No autorizado" };

    try {
        const equipo = await prisma.equipo.findUnique({
            where: { id: equipoId },
            include: { lote: true }
        });

        if (!equipo) return { success: false, error: "Equipo no encontrado" };
        if (equipo.userId !== userId && !isAdmin) return { success: false, error: "Este equipo no te está asignado" };

        await prisma.equipo.update({
            where: { id: equipoId },
            data: {
                modelo: data.modelo,
                deviceModelId: data.deviceModelId !== undefined ? data.deviceModelId : equipo.deviceModelId,
                funcionalidad: data.funcionalidad,
                grado: data.grado || null,
                observacion: data.observacion || null,
                estado: "Revisado",
            }
        });

        // Add history log
        await prisma.equipoHistorial.create({
            data: {
                equipoId: equipoId,
                estado: "Revisado",
                userId: userId,
                fecha: new Date(),
                observacion: "Revisión completada",
                loteId: equipo.loteId
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error al revisar equipo:", error);
        return { success: false, error: error.message };
    }
}
