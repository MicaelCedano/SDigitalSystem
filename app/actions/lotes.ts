"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAchievements } from "./achievements";

/**
 * Technician submits a lot for review by the administrator.
 */
export async function submitLoteForReview(loteId: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autenticado" };

    try {
        const lote = await prisma.lote.findUnique({
            where: { id: loteId },
            include: { tecnico: true }
        });

        if (!lote) return { success: false, error: "Lote no encontrado" };

        await prisma.lote.update({
            where: { id: loteId },
            data: { estado: 'Pendiente' }
        });

        // 2. Identify Administrators to notify
        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true }
        });

        const tecnicoName = lote.tecnico.name || lote.tecnico.username;

        // 3. Create notifications for each admin
        const notifications = admins.map(admin => ({
            tecnicoId: admin.id,
            tipo: 'lote_pendiente',
            titulo: 'Nuevo Lote para Revisión',
            mensaje: `El técnico ${tecnicoName} ha enviado el lote ${lote.codigo} para su aprobación.`,
            loteCodigo: lote.codigo,
            fromUserId: Number(session.user.id),
            redirectUrl: `/qc?lote=${lote.codigo}`,
            leida: false,
            fecha: new Date()
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });
        }

        revalidatePath("/qc");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Error submitting lote:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin approves a lot, pays the technician, and moves equipment to inventory.
 */
export async function approveLote(loteId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const lote = await prisma.lote.findUnique({
            where: { id: loteId },
            include: {
                equipos: true,
                tecnico: true
            }
        });

        if (!lote) return { success: false, error: "Lote no encontrado" };

        // Calculate payment: RD$ 50 for EACH equipment reviewed (Good or Bad)
        const totalCount = lote.equipos.length;
        const paymentAmount = totalCount * 50;

        await prisma.$transaction(async (tx) => {
            // 1. Update Lote status to Entregado (Done)
            await tx.lote.update({
                where: { id: loteId },
                data: { estado: 'Entregado' }
            });

            // 2. Update equipments to Revisado (Keep as reviewed, don't move to inventory automatically)
            await tx.equipo.updateMany({
                where: { loteId: loteId },
                data: {
                    estado: 'Revisado',
                    userId: null // Free from the technician
                }
            });

            // 2.5 Create history entries for each equipment moved to inventory
            const equipmentsInLote = await tx.equipo.findMany({
                where: { loteId: loteId },
                select: { id: true }
            });

            const historyEntries = equipmentsInLote.map(eq => ({
                equipoId: eq.id,
                fecha: new Date(),
                estado: 'Revisado',
                userId: Number(session.user.id),
                observacion: `Lote ${lote.codigo} aprobado por Administrador.`,
                loteId: loteId
            }));

            if (historyEntries.length > 0) {
                await tx.equipoHistorial.createMany({
                    data: historyEntries
                });
            }

            // 3. Process Payment to Wallet
            if (paymentAmount > 0) {
                let wallet = await tx.wallet.findFirst({
                    where: { tecnicoId: lote.tecnicoId },
                    include: { accounts: { where: { nombre: 'Principal' } } }
                });

                if (!wallet) {
                    wallet = await tx.wallet.create({
                        data: { tecnicoId: lote.tecnicoId, saldo: 0 },
                        include: { accounts: { where: { nombre: 'Principal' } } }
                    });
                }

                let principalAcc = wallet.accounts[0];
                if (!principalAcc) {
                    principalAcc = await tx.walletAccount.create({
                        data: {
                            walletId: wallet.id,
                            nombre: 'Principal',
                            tipo: 'corriente',
                            saldo: 0,
                            fechaCreacion: new Date()
                        }
                    });
                }

                // Create Income Transaction
                await tx.walletTransaction.create({
                    data: {
                        tecnicoId: lote.tecnicoId,
                        loteId: loteId,
                        monto: paymentAmount,
                        tipo: 'ingreso',
                        estado: 'Aprobado',
                        fecha: new Date(),
                        descripcion: `Pago por Lote QC: ${lote.codigo} (${totalCount} equipos)`
                    }
                });

                // Update Account Balances
                await tx.walletAccount.update({
                    where: { id: principalAcc.id },
                    data: { saldo: { increment: paymentAmount } }
                });

                // Update Global Wallet Balance
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { saldo: { increment: paymentAmount } }
                });
            }

            // 4. Create notification for technician
            await tx.notification.create({
                data: {
                    tecnicoId: lote.tecnicoId,
                    tipo: 'lote_aprobado',
                    titulo: 'Lote Aprobado',
                    mensaje: `Tu lote ${lote.codigo} ha sido aprobado. Se han acreditado RD$ ${paymentAmount.toLocaleString()} a tu cuenta.`,
                    monto: paymentAmount,
                    loteCodigo: lote.codigo,
                    fromUserId: Number(session.user.id),
                    redirectUrl: `/qc?lote=${lote.codigo}`,
                    leida: false,
                    fecha: new Date()
                }
            });
        });

        // Trigger Achievement Check
        await checkAchievements(lote.tecnicoId);

        revalidatePath("/");
        revalidatePath("/qc");
        revalidatePath("/wallets");
        return { success: true };
    } catch (error: any) {
        console.error("Error approving lote:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin rejects a lot and returns it to the technician for further work.
 */
export async function rejectLote(loteId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const lote = await prisma.lote.findUnique({
            where: { id: loteId }
        });

        if (!lote) return { success: false, error: "Lote no encontrado" };

        await prisma.lote.update({
            where: { id: loteId },
            data: { estado: 'Abierto' }
        });

        // Create notification for technician
        await prisma.notification.create({
            data: {
                tecnicoId: lote.tecnicoId,
                tipo: 'lote_rechazado',
                titulo: 'Lote Devuelto',
                mensaje: `Tu lote ${lote.codigo} ha sido devuelto por el administrador para correcciones.`,
                loteCodigo: lote.codigo,
                fromUserId: Number(session.user.id),
                redirectUrl: `/qc?lote=${lote.codigo}`,
                leida: false,
                fecha: new Date()
            }
        });

        revalidatePath("/");
        revalidatePath("/qc");
        return { success: true };
    } catch (error: any) {
        console.error("Error rejecting lote:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin cancels a lot entirely, returning equipments to inventory
 */
export async function cancelLote(loteId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const lote = await prisma.lote.findUnique({
            where: { id: loteId },
            include: { equipos: true }
        });

        if (!lote) return { success: false, error: "Lote no encontrado" };

        await prisma.$transaction(async (tx) => {
            // 1. Return all equipments to "En Inventario" and clear assignment
            const equipmentIds = lote.equipos.map(e => e.id);
            
            if (equipmentIds.length > 0) {
                await tx.equipo.updateMany({
                    where: { id: { in: equipmentIds } },
                    data: {
                        estado: 'En Inventario',
                        userId: null,
                        loteId: null
                    }
                });

                // 2. Create history entries
                const historyEntries = equipmentIds.map(id => ({
                    equipoId: id,
                    fecha: new Date(),
                    estado: 'En Inventario',
                    userId: Number(session.user.id),
                    observacion: `Lote ${lote.codigo} cancelado por Administrador. Regresa a inventario.`
                }));

                await tx.equipoHistorial.createMany({
                    data: historyEntries
                });
            }

            // 3. Delete the lot
            await tx.lote.delete({
                where: { id: loteId }
            });

            // 4. Also delete related notifications for this lot code if any
            await tx.notification.deleteMany({
                where: { loteCodigo: lote.codigo }
            });
        });

        revalidatePath("/");
        revalidatePath("/qc");
        revalidatePath("/equipos");
        return { success: true };
    } catch (error: any) {
        console.error("Error canceling lote:", error);
        return { success: false, error: error.message };
    }
}
