"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAdminPaymentsDashboardData() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return null;

    try {
        // Fetch all users with technical roles
        const users = await prisma.user.findMany({
            where: {
                role: { in: ["tecnico", "tecnico_garantias", "control_calidad"] }
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                profileImage: true,
                wallet: {
                    include: {
                        accounts: { where: { nombre: "Principal" } }
                    }
                },
                configuracionPagos: true
            }
        });

        // 1. Calculate General Stats
        const pendingRetiros = await prisma.walletTransaction.findMany({
            where: {
                tipo: { equals: "retiro", mode: "insensitive" },
                estado: { in: ["Pendiente", "Aprobado"] },
                canjeado: { not: true }
            },
            include: {
                tecnico: { select: { id: true, name: true, username: true } }
            },
            orderBy: { fecha: "desc" }
        });

        // 2. Earnings in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentEarnings = await prisma.walletTransaction.aggregate({
            where: {
                tipo: { equals: "ingreso", mode: "insensitive" },
                estado: "Completado",
                fecha: { gte: thirtyDaysAgo }
            },
            _sum: { monto: true }
        });

        // 3. Mapping data per user
        const technicians = await Promise.all(users.map(async (u) => {
            const wallet = u.wallet[0];
            const principalAcc = wallet?.accounts?.[0];

            // Total Earned (All time)
            const allTimeEarnings = await prisma.walletTransaction.aggregate({
                where: {
                    tecnicoId: u.id,
                    tipo: { in: ["ingreso", "Ingreso", "Ingreso Manual"] },
                    estado: "Completado"
                },
                _sum: { monto: true }
            });

            return {
                id: u.id,
                name: u.name,
                username: u.username,
                role: u.role,
                profileImage: u.profileImage,
                balance: principalAcc?.saldo || 0,
                totalEarned: allTimeEarnings._sum.monto || 0,
                config: (u as any).configuracionPagos?.[0] || null
            };
        }));

        const totalPendingPayout = technicians.reduce((acc, t) => acc + t.balance, 0);

        // 4. Recent Penalties
        const recentPenalties = await prisma.penalidad.findMany({
            take: 5,
            orderBy: { fecha: "desc" },
            include: {
                tecnico: { select: { name: true, username: true } },
                equipo: { select: { imei: true, modelo: true } }
            }
        });

        const recentExternalPenalties = await prisma.penalidadExterna.findMany({
            take: 5,
            orderBy: { fecha: "desc" }
        });

        return {
            technicians,
            pendingRetiros,
            recentPenalties,
            recentExternalPenalties,
            stats: {
                totalPendingPayout,
                recentEarnings: recentEarnings._sum.monto || 0,
                pendingRetirosCount: pendingRetiros.length
            }
        };

    } catch (error) {
        console.error("Error fetching admin payments data:", error);
        return null;
    }
}

export async function markAsRedeemed(transactionId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        await prisma.walletTransaction.update({
            where: { id: transactionId },
            data: {
                canjeado: true,
                estado: "Completado"
            }
        });

        revalidatePath("/admin/pagos");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function applyPenaltyByImei(imei: string, motivo: string, monto: number = 500) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const equipo = await prisma.equipo.findUnique({
            where: { imei },
            include: {
                historial: {
                    where: { estado: "Revisado" },
                    orderBy: { fecha: "desc" },
                    include: { user: true }
                }
            }
        });

        if (!equipo) return { success: false, error: "No se encontró un equipo con ese IMEI." };

        const ultimoTecnico = equipo.historial[0]?.user;
        if (!ultimoTecnico || ultimoTecnico.role !== "control_calidad") {
            return { success: false, error: "No se encontró un técnico de Control de Calidad que haya revisado este equipo." };
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Obtener Wallet
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: ultimoTecnico.id },
                include: { accounts: { where: { nombre: "Principal" } } }
            });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { tecnicoId: ultimoTecnico.id, saldo: 0 },
                    include: { accounts: { where: { nombre: "Principal" } } }
                });
            }

            let principalAcc = wallet.accounts[0];
            if (!principalAcc) {
                principalAcc = await tx.walletAccount.create({
                    data: { walletId: wallet.id, nombre: "Principal", tipo: "corriente", saldo: 0 }
                });
            }

            // 2. Descontar saldo
            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { decrement: monto } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { decrement: monto } }
            });

            // 3. Crear Transacción de Wallet (ya canjeada porque es penalidad)
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: ultimoTecnico.id,
                    monto: monto,
                    tipo: "retiro",
                    estado: "Completado",
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: `PENALIDAD: ${motivo} (IMEI: ${imei})`
                }
            });

            // 4. Crear registro de Penalidad
            await tx.penalidad.create({
                data: {
                    tecnicoId: ultimoTecnico.id,
                    equipoId: equipo.id,
                    motivo,
                    monto,
                    adminId: Number(session.user.id),
                    fecha: new Date()
                }
            });

            return { success: true, tecnico: ultimoTecnico.name || ultimoTecnico.username };
        });
    } catch (error: any) {
        console.error("Error applying penalty:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/admin/pagos");
    }
}

export async function applyExternalPenalty(data: { imei: string, modelo: string, tecnicoId: number, monto: number, motivo: string }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const tecnico = await prisma.user.findUnique({ where: { id: data.tecnicoId } });
        if (!tecnico) return { success: false, error: "Técnico no encontrado." };

        return await prisma.$transaction(async (tx) => {
            // 1. Obtener Wallet
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: tecnico.id },
                include: { accounts: { where: { nombre: "Principal" } } }
            });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { tecnicoId: tecnico.id, saldo: 0 },
                    include: { accounts: { where: { nombre: "Principal" } } }
                });
            }

            let principalAcc = wallet.accounts[0];
            if (!principalAcc) {
                principalAcc = await tx.walletAccount.create({
                    data: { walletId: wallet.id, nombre: "Principal", tipo: "corriente", saldo: 0 }
                });
            }

            // 2. Descontar saldo
            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { decrement: data.monto } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { decrement: data.monto } }
            });

            // 3. Crear Transacción (ya canjeada)
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: tecnico.id,
                    monto: data.monto,
                    tipo: "retiro",
                    estado: "Completado",
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: `PENALIDAD EXTERNA: ${data.motivo} (IMEI: ${data.imei})`
                }
            });

            // 4. Crear registro de Penalidad Externa
            await tx.penalidadExterna.create({
                data: {
                    imei: data.imei,
                    modelo: data.modelo,
                    culpable: tecnico.name || tecnico.username,
                    cantidad: data.monto,
                    motivo: data.motivo,
                    adminId: Number(session.user.id),
                    fecha: new Date()
                }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error applying external penalty:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/admin/pagos");
    }
}

export async function getPenaltyDataByImei(imei: string) {
    try {
        const equipo = await prisma.equipo.findUnique({
            where: { imei },
            select: {
                id: true,
                marca: true,
                modelo: true,
                historial: {
                    where: { estado: "Revisado" },
                    orderBy: { fecha: "desc" },
                    take: 1,
                    include: {
                        user: {
                            select: { id: true, name: true, username: true, role: true }
                        }
                    }
                }
            }
        });

        if (!equipo) return { success: false, error: "Equipo no encontrado" };

        const ultimoTecnico = equipo.historial[0]?.user;
        if (!ultimoTecnico || ultimoTecnico.role !== "control_calidad") {
            return { success: false, error: "No se encontró revisión de Control de Calidad" };
        }

        return {
            success: true,
            equipo: { marca: equipo.marca, modelo: equipo.modelo },
            tecnico: ultimoTecnico,
            revision: {
                fecha: equipo.historial[0].fecha,
                observacion: equipo.historial[0].observacion
            }
        };
    } catch (error) {
        return { success: false, error: "Error al buscar datos" };
    }
}

