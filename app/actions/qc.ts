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

        // Fetch stats for the current user
        const cantidadPendientes = await prisma.equipo.count({
            where: {
                userId: userId,
                estado: "En Revisión"
            }
        });

        const totalRevisados = await prisma.equipo.count({
            where: {
                userId: userId,
                estado: "Revisado",
                // Assuming lots check is needed, we will just count status for simplicity right now
            }
        });

        const totalFuncionales = await prisma.equipo.count({
            where: {
                userId: userId,
                estado: "Revisado",
                funcionalidad: "Funcional"
            }
        });

        const totalNoFuncionales = await prisma.equipo.count({
            where: {
                userId: userId,
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
            where: { userId: userId },
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
            const query = await prisma.equipoHistorial.groupBy({
                by: ['userId'],
                where: {
                    estado: 'Revisado',
                    ...(since ? { fecha: { gte: since } } : {})
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: limit,
            });

            const userIds = query.map(q => q.userId!).filter(id => id !== null);
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, username: true, profileImage: true }
            });

            return query.map(q => {
                const user = users.find(u => u.id === q.userId);
                return {
                    tecnico: {
                        name: user?.name,
                        username: user?.username,
                        profileImage: user?.profileImage
                    },
                    count: q._count.id
                };
            });
        };

        const topDia = await getRanking(startOfDay, 3);
        const topMes = await getRanking(startOfMonth, 5);
        const topGlobal = await getRanking(undefined, 5);

        const deviceModels = await prisma.deviceModel.findMany({
            orderBy: [{ brand: 'asc' }, { modelName: 'asc' }]
        });

        return {
            saldoPrincipal,
            cantidadPendientes,
            totalRevisados,
            totalFuncionales,
            totalNoFuncionales,
            globalInventario,
            globalEnRevision,
            equipos,
            lotesAbiertos,
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
