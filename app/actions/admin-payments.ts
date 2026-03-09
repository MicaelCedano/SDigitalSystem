"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

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

        // 0. Auto-correct any penalties that are not marked as redeemed
        await prisma.walletTransaction.updateMany({
            where: {
                tipo: { equals: "retiro", mode: "insensitive" },
                descripcion: { contains: "PENALIDAD", mode: "insensitive" },
                OR: [
                    { canjeado: false },
                    { canjeado: null }
                ]
            },
            data: {
                canjeado: true,
                estado: "Completado"
            }
        });

        // 1. Calculate General Stats
        const pendingRetiros = await prisma.walletTransaction.findMany({
            where: {
                tipo: { equals: "retiro", mode: "insensitive" },
                estado: { in: ["Pendiente", "Aprobado"] },
                canjeado: { not: true },
                NOT: {
                    descripcion: { contains: "PENALIDAD", mode: "insensitive" }
                }
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
                estado: { in: ["Completado", "Aprobado"] },
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
                    estado: { in: ["Completado", "Aprobado"] }
                },
                _sum: { monto: true }
            });

            return {
                id: u.id,
                name: u.name,
                username: u.username,
                role: u.role,
                profileImage: u.profileImage,
                balance: u.wallet[0]?.saldo || 0,
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

export async function applyPenaltyByImei(imei: string, motivo: string, montoInput: number = 500) {
    const monto = Math.abs(montoInput);
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const equipo = await prisma.equipo.findUnique({
            where: { imei },
            include: {
                historial: {
                    where: { 
                        estado: "Revisado",
                        user: { role: { not: "admin" } }
                    },
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
                    descripcion: `PENALIDAD: ${motivo} (IMEI: ${imei})`,
                    secureToken: crypto.randomBytes(32).toString('hex')
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
    const monto = Math.abs(data.monto);
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
                data: { saldo: { decrement: monto } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { decrement: monto } }
            });

            // 3. Crear Transacción (ya canjeada)
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: tecnico.id,
                    monto: monto,
                    tipo: "retiro",
                    estado: "Completado",
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: `PENALIDAD EXTERNA: ${data.motivo} (IMEI: ${data.imei})`,
                    secureToken: crypto.randomBytes(32).toString('hex')
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
                    where: { 
                        estado: "Revisado",
                        user: { role: { not: "admin" } }
                    },
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

export async function revertPenalty(penaltyId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const penalty = await prisma.penalidad.findUnique({
            where: { id: penaltyId },
            include: { tecnico: true }
        });

        if (!penalty) return { success: false, error: "Penalidad no encontrada" };

        return await prisma.$transaction(async (tx) => {
            // 1. Obtener Wallet
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: penalty.tecnicoId },
                include: { accounts: { where: { nombre: "Principal" } } }
            });

            if (!wallet || !wallet.accounts[0]) {
                return { success: false, error: "No se encontró el wallet del técnico" };
            }

            const principalAcc = wallet.accounts[0];

            // 2. Reversar saldo
            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { increment: penalty.monto } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { increment: penalty.monto } }
            });

            // 3. Crear Transacción de Reversa
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: penalty.tecnicoId,
                    monto: penalty.monto,
                    tipo: "ingreso",
                    estado: "Completado",
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: `REVERSA PENALIDAD: ID #${penalty.id} - ${penalty.motivo}`,
                    secureToken: crypto.randomBytes(32).toString('hex')
                }
            });

            // 4. Eliminar registro de Penalidad
            await tx.penalidad.delete({
                where: { id: penaltyId }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error reverting penalty:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/admin/pagos");
    }
}

export async function revertExternalPenalty(penaltyId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const penalty = await prisma.penalidadExterna.findUnique({
            where: { id: penaltyId }
        });

        if (!penalty) return { success: false, error: "Penalidad externa no encontrada" };

        // Buscar al técnico por nombre/username almacenado en 'culpable'
        const tecnico = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: penalty.culpable },
                    { username: penalty.culpable }
                ]
            }
        });

        if (!tecnico) return { success: false, error: "No se pudo identificar al técnico original para devolver el saldo." };

        return await prisma.$transaction(async (tx) => {
            // 1. Obtener Wallet
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: tecnico.id },
                include: { accounts: { where: { nombre: "Principal" } } }
            });

            if (!wallet || !wallet.accounts[0]) {
                return { success: false, error: "No se encontró el wallet del técnico" };
            }

            const principalAcc = wallet.accounts[0];

            // 2. Reversar saldo
            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { increment: penalty.cantidad } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { increment: penalty.cantidad } }
            });

            // 3. Crear Transacción de Reversa
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: tecnico.id,
                    monto: penalty.cantidad,
                    tipo: "ingreso",
                    estado: "Completado",
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: `REVERSA PENALIDAD EXTERNA: ID #${penalty.id} - ${penalty.motivo}`,
                    secureToken: crypto.randomBytes(32).toString('hex')
                }
            });

            // 4. Eliminar registro
            await tx.penalidadExterna.delete({
                where: { id: penaltyId }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error reverting external penalty:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/admin/pagos");
    }
}

export async function getAllPenalties() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return null;

    try {
        const [penalties, externalPenalties] = await Promise.all([
            prisma.penalidad.findMany({
                orderBy: { fecha: "desc" },
                include: {
                    tecnico: { select: { name: true, username: true } },
                    equipo: { select: { imei: true, modelo: true } }
                }
            }),
            prisma.penalidadExterna.findMany({
                orderBy: { fecha: "desc" }
            })
        ]);

        return {
            penalties: penalties.map(p => ({ ...p, type: 'internal' })),
            externalPenalties: externalPenalties.map(p => ({ ...p, type: 'external' }))
        };
    } catch (error) {
        console.error("Error fetching all penalties:", error);
        return null;
    }
}

