"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getWalletData() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const userId = Number(session.user.id);

    try {
        let wallet = await prisma.wallet.findFirst({
            where: { tecnicoId: userId },
            include: { accounts: { orderBy: { fechaCreacion: 'asc' } } }
        });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    tecnicoId: userId,
                    saldo: 0
                },
                include: { accounts: true }
            });
        }

        // Ensure Principal account exists
        let principalAcc = wallet.accounts.find(acc => acc.nombre === "Principal");
        if (!principalAcc) {
            principalAcc = await prisma.walletAccount.create({
                data: {
                    walletId: wallet.id,
                    nombre: "Principal",
                    tipo: "corriente",
                    saldo: 0,
                    color: "indigo",
                    fechaCreacion: new Date()
                }
            });
            // Refresh wallet data after creation
            wallet = await prisma.wallet.findFirst({
                where: { tecnicoId: userId },
                include: { accounts: { orderBy: { fechaCreacion: 'asc' } } }
            }) as any;
        }

        const transactions = await prisma.walletTransaction.findMany({
            where: { tecnicoId: userId },
            orderBy: { fecha: 'desc' },
            take: 50
        });

        const ingresos = transactions.filter(t => t.tipo.toLowerCase() === 'ingreso');
        const retiros = transactions.filter(t => t.tipo.toLowerCase() === 'retiro' || t.tipo.toLowerCase() === 'transferencia');

        return {
            walletId: wallet?.id || 0,
            accounts: wallet?.accounts || [],
            saldoTotal: (wallet?.accounts || []).reduce((sum, acc) => sum + (acc.saldo || 0), 0),
            ingresos,
            retiros
        };
    } catch (error) {
        console.error("Error fetching wallet data:", error);
        return null;
    }
}

export async function requestWithdrawal(amount: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };

    const userId = Number(session.user.id);

    if (amount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };
    if (amount < 2000) return { success: false, error: "El monto mínimo para retirar es RD$ 2,000" };

    try {
        return await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findFirst({
                where: { tecnicoId: userId },
                include: { accounts: { where: { nombre: "Principal" } } }
            });

            if (!wallet || !wallet.accounts[0]) {
                return { success: false, error: "No se encontró la cuenta principal" };
            }

            const principalAcc = wallet.accounts[0];

            if (amount > (principalAcc.saldo || 0)) {
                return { success: false, error: "Saldo insuficiente" };
            }

            await tx.walletTransaction.create({
                data: {
                    tecnicoId: userId,
                    monto: amount,
                    tipo: 'retiro',
                    estado: 'Aprobado',
                    fecha: new Date(),
                    descripcion: 'Solicitud de retiro',
                    secureToken: crypto.randomBytes(32).toString('hex')
                }
            });

            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { decrement: amount } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { decrement: amount } }
            });

            // Notificar a los administradores
            const admins = await tx.user.findMany({
                where: { role: "admin" },
                select: { id: true }
            });

            const tecnico = await tx.user.findUnique({
                where: { id: userId },
                select: { name: true, username: true }
            });

            if (admins.length > 0) {
                await tx.notification.createMany({
                    data: admins.map(admin => ({
                        tecnicoId: admin.id,
                        tipo: "RETIRO_SOLICITADO",
                        titulo: "Nueva Solicitud de Retiro",
                        mensaje: `El técnico ${tecnico?.name || tecnico?.username} ha solicitado un retiro de RD$ ${amount.toLocaleString()}.`,
                        monto: amount,
                        fromUserId: userId,
                        redirectUrl: `/admin/pagos/${userId}`,
                        fecha: new Date(),
                        leida: false
                    }))
                });
            }

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error requesting withdrawal:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/wallet");
    }
}

export async function manualCredit(targetUserId: number, amount: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    if (amount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };

    try {
        return await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: targetUserId },
                include: { accounts: true }
            });

            if (!wallet) {
                wallet = await tx.wallet.create({
                    data: { tecnicoId: targetUserId, saldo: 0 },
                    include: { accounts: true }
                });
            }

            let principalAcc = wallet.accounts.find(acc => acc.nombre === "Principal");
            if (!principalAcc) {
                principalAcc = await tx.walletAccount.create({
                    data: {
                        walletId: wallet.id,
                        nombre: "Principal",
                        tipo: "corriente",
                        saldo: 0,
                        color: "blue",
                        fechaCreacion: new Date()
                    }
                });
            }

            await tx.walletTransaction.create({
                data: {
                    tecnicoId: targetUserId,
                    monto: amount,
                    tipo: 'ingreso',
                    estado: 'Completado',
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: 'Acreditación manual por administrador',
                    secureToken: crypto.randomBytes(32).toString('hex')
                }
            });

            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { increment: amount } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { increment: amount } }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error in manual credit:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/wallet");
        revalidatePath("/garantias/pagos");
    }
}

export async function adminManualWithdrawal(targetUserId: number, amount: number, concepto: string = "Pago realizado por administrador") {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    if (amount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };

    try {
        return await prisma.$transaction(async (tx) => {
            let wallet = await tx.wallet.findFirst({
                where: { tecnicoId: targetUserId },
                include: { accounts: { where: { nombre: "Principal" } } }
            });

            if (!wallet || !wallet.accounts[0]) {
                return { success: false, error: "No se encontró el wallet o la cuenta principal del técnico" };
            }

            const principalAcc = wallet.accounts[0];

            if (amount > (principalAcc.saldo || 0)) {
                return { success: false, error: "Saldo insuficiente en el balance del técnico" };
            }

            await tx.walletTransaction.create({
                data: {
                    tecnicoId: targetUserId,
                    monto: amount,
                    tipo: 'retiro',
                    estado: 'Completado',
                    canjeado: true,
                    fecha: new Date(),
                    descripcion: concepto,
                    secureToken: crypto.randomBytes(32).toString('hex')
                }
            });

            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { decrement: amount } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { decrement: amount } }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error in admin manual withdrawal:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/garantias/pagos");
        revalidatePath("/wallet");
    }
}

export async function getTecnicoTransactions(tecnicoId: number) {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    if (session.user.role !== "admin" && Number(session.user.id) !== tecnicoId) {
        return null;
    }

    const tecnico = await prisma.user.findUnique({
        where: { id: tecnicoId },
        select: { id: true, name: true, username: true }
    });

    if (!tecnico) return null;

    const transactions = await prisma.walletTransaction.findMany({
        where: { tecnicoId },
        orderBy: { fecha: "desc" }
    });

    const wallet = await prisma.wallet.findFirst({
        where: { tecnicoId },
        include: { accounts: { where: { nombre: "Principal" } } }
    });

    return {
        tecnico,
        transactions,
        balance: wallet?.accounts[0]?.saldo || 0
    };
}

export async function transferBetweenAccounts(fromAccountId: number, toAccountId: number, amount: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };

    if (amount <= 0) return { success: false, error: "El monto debe ser mayor a 0" };
    if (fromAccountId === toAccountId) return { success: false, error: "No puedes transferir a la misma cuenta" };

    try {
        return await prisma.$transaction(async (tx) => {
            const fromAccount = await tx.walletAccount.findUnique({ where: { id: fromAccountId } });
            const toAccount = await tx.walletAccount.findUnique({ where: { id: toAccountId } });

            if (!fromAccount || !toAccount) {
                return { success: false, error: "Una de las cuentas no existe" };
            }

            if ((fromAccount.walletId !== toAccount.walletId)) {
                return { success: false, error: "Las cuentas deben pertenecer al mismo wallet" };
            }

            if ((fromAccount.saldo || 0) < amount) {
                return { success: false, error: "Saldo insuficiente en la cuenta de origen" };
            }

            // Update balances
            await tx.walletAccount.update({
                where: { id: fromAccountId },
                data: { saldo: { decrement: amount } }
            });

            await tx.walletAccount.update({
                where: { id: toAccountId },
                data: { saldo: { increment: amount } }
            });

            // Create transaction log
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: Number(session.user.id),
                    monto: amount,
                    tipo: 'transferencia',
                    estado: 'Completado',
                    fecha: new Date(),
                    descripcion: `Transferencia interna: ${fromAccount.nombre} -> ${toAccount.nombre}`
                }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error("Error in internal transfer:", error);
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/wallet");
    }
}

export async function createWalletAccount(name: string, color: string = "blue") {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };

    try {
        const userId = Number(session.user.id);
        const wallet = await prisma.wallet.findFirst({
            where: { tecnicoId: userId }
        });

        if (!wallet) return { success: false, error: "Wallet no encontrado" };

        await prisma.walletAccount.create({
            data: {
                walletId: wallet.id,
                nombre: name,
                tipo: "ahorro",
                saldo: 0,
                color: color,
                fechaCreacion: new Date()
            }
        });

        revalidatePath("/wallet");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating account:", error);
        return { success: false, error: error.message };
    }
}
