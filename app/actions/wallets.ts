"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function getAdminWalletsData() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return null;

    try {
        // Fetch QC Technicians
        const tecnicos = await prisma.user.findMany({
            where: { role: 'control_calidad' },
            select: { id: true, name: true, username: true }
        });

        // Fetch their wallets and accounts
        const walletsData = await prisma.wallet.findMany({
            where: { tecnicoId: { in: tecnicos.map(t => t.id) } },
            include: { accounts: { where: { nombre: "Principal" } } }
        });

        const wallets: Record<number, number> = {};
        walletsData.forEach(w => {
            const principal = w.accounts?.[0];
            wallets[w.tecnicoId] = principal ? (principal.saldo || 0) : 0;
            // Also update main wallet saldo if required but principal account is the truth
        });

        // Get recent transactions for each tech
        // Retiros
        const allTransactions = await prisma.walletTransaction.findMany({
            where: {
                tecnicoId: { in: tecnicos.map(t => t.id) },
                estado: { in: ['Completado', 'Aprobado'] }
            },
            orderBy: { fecha: 'desc' }
        });

        const recentRetiros = allTransactions.filter(t => t.tipo.toLowerCase() === 'retiro');
        const recentManuales = allTransactions.filter(t => t.tipo.toLowerCase() === 'ingreso manual');

        const historial: Record<number, { retiros: any[], acreditaciones_manuales: any[], total_ganado: number }> = {};
        tecnicos.forEach(t => {
            historial[t.id] = {
                retiros: recentRetiros.filter(r => r.tecnicoId === t.id).slice(0, 2),
                acreditaciones_manuales: recentManuales.filter(m => m.tecnicoId === t.id).slice(0, 2),
                total_ganado: 0
            };
        });

        // Calculation of "Total Generado" globally per tech
        // In python it sum of 'Ingreso' transactions
        const ingresos = await prisma.walletTransaction.groupBy({
            by: ['tecnicoId'],
            where: {
                tipo: { in: ['Ingreso', 'ingreso'] },
                estado: { in: ['Completado', 'Aprobado'] }
            },
            _sum: { monto: true }
        });

        ingresos.forEach(ing => {
            if (historial[ing.tecnicoId]) {
                historial[ing.tecnicoId].total_ganado = ing._sum.monto || 0;
            }
        });

        // Sort by total ganado
        const control_calidad_ganados = tecnicos.map(t => ({
            ...t,
            total_ganado: historial[t.id].total_ganado
        })).sort((a, b) => b.total_ganado - a.total_ganado);

        return {
            tecnicos,
            wallets,
            historial,
            control_calidad_ganados
        };

    } catch (error) {
        console.error("Error fetching wallets data:", error);
        return null;
    }
}

export async function addManualAccreditacion(tecnicoId: number, monto: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        if (monto <= 0) return { success: false, error: "Monto inválido" };

        let wallet = await prisma.wallet.findFirst({
            where: { tecnicoId },
            include: { accounts: { where: { tipo: "Principal" } } }
        });

        if (!wallet) return { success: false, error: "Wallet no encontrada para este técnico" };
        const mainAccount = wallet.accounts[0];
        if (!mainAccount) return { success: false, error: "Cuenta Principal no configurada" };

        // 1. Transaction
        await prisma.walletTransaction.create({
            data: {
                tecnicoId,
                monto,
                tipo: 'Ingreso Manual',
                estado: 'Completado',
                fecha: new Date(),
                descripcion: 'Acreditación manual del administrador',
                secureToken: crypto.randomBytes(32).toString('hex'),
                canjeado: true
            }
        });

        // 2. Add to actual balance on WalletAccount
        await prisma.walletAccount.update({
            where: { id: mainAccount.id },
            data: { saldo: (mainAccount.saldo || 0) + monto }
        });

        // Also update the main wallet balance for backwards compatibility if needed
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { saldo: (wallet.saldo || 0) + monto }
        });

        // Simple notification (optional)
        await prisma.notification.create({
            data: {
                tecnicoId: tecnicoId,
                titulo: "Acreditación Aprobada",
                mensaje: `Se acreditaton RD$ ${monto.toFixed(2)} a tu wallet.`,
                tipo: "wallet_update",
                leida: false,
                fecha: new Date(),
                monto: monto,
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error adding accreditation:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteManualAccreditacion(transactionId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const trans = await prisma.walletTransaction.findUnique({ where: { id: transactionId } });
        if (!trans || trans.tipo !== 'Ingreso Manual') return { success: false, error: "Transacción no válida" };

        const wallet = await prisma.wallet.findFirst({
            where: { tecnicoId: trans.tecnicoId },
            include: { accounts: { where: { tipo: "Principal" } } }
        });

        if (wallet && wallet.accounts[0]) {
            await prisma.walletAccount.update({
                where: { id: wallet.accounts[0].id },
                data: { saldo: (wallet.accounts[0].saldo || 0) - trans.monto }
            });
            await prisma.wallet.update({
                where: { id: wallet.id },
                data: { saldo: (wallet.saldo || 0) - trans.monto }
            });
        }

        await prisma.walletTransaction.delete({ where: { id: transactionId } });

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting accreditation:", error);
        return { success: false, error: error.message };
    }
}

export async function getTechnicianWalletHistory(tecnicoId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return null;

    try {
        const tecnico = await prisma.user.findUnique({
            where: { id: tecnicoId },
            select: { id: true, name: true, username: true, role: true }
        });

        if (!tecnico) return null;

        const wallet = await prisma.wallet.findFirst({
            where: { tecnicoId: tecnicoId },
            include: { accounts: true }
        });

        const transactions = await prisma.walletTransaction.findMany({
            where: { tecnicoId: tecnicoId },
            orderBy: { fecha: 'desc' }
        });

        const ingresos = transactions.filter(t => t.tipo.toLowerCase() === 'ingreso' || t.tipo.toLowerCase() === 'ingreso manual');
        const retiros = transactions.filter(t => t.tipo.toLowerCase() === 'retiro' || t.tipo.toLowerCase() === 'transferencia' || t.tipo.toLowerCase() === 'penalidad');

        return {
            tecnico,
            wallet,
            ingresos,
            retiros,
            totalGanado: ingresos.filter(t => t.estado === 'Completado' || t.estado === 'Aprobado').reduce((sum, t) => sum + t.monto, 0),
            totalRetirado: retiros.filter(t => t.estado === 'Completado' || t.estado === 'Aprobado').reduce((sum, t) => sum + t.monto, 0),
        };
    } catch (error) {
        console.error("Error fetching technician wallet history:", error);
        return null;
    }
}
