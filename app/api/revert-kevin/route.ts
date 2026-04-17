
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const kevin = await prisma.user.findFirst({
            where: { 
                OR: [
                    { username: { contains: 'kevin' } },
                    { name: { contains: 'kevin' } }
                ]
            }
        });

        if (!kevin) {
            return NextResponse.json({ error: "No se encontró al técnico Kevin" });
        }

        const imeis = [
            "356846111058349", "359642659356410", "350496309872998", "352310728744712",
            "353341837968990", "354615753117784", "356010305587064", "350879906434629",
            "354073556520921", "354615750556737", "357917871211425", "353360940585947",
            "357938434426870", "352051682888232", "358469521964333", "356478846119509",
            "356165444598461", "356542106531412", "353004116875050", "357855860284955",
            "354440895353316", "356552109421594", "353360943552084", "356556106043038",
            "356859116224162", "353762464803574", "350108848983299", "354078640022388",
            "350879905362227", "353006119394963"
        ];

        // Buscar el lote basándose en los equipos
        const equipment = await prisma.equipo.findFirst({
            where: { imei: { in: imeis } },
            select: { loteId: true }
        });

        if (!equipment || !equipment.loteId) {
            return NextResponse.json({ error: "No se encontró el lote asociado a estos IMEIs." });
        }

        const latestLote = await prisma.lote.findUnique({
            where: { id: equipment.loteId },
            include: { equipos: true, tecnico: true }
        });

        if (!latestLote) {
            return NextResponse.json({ error: "No se encontró el lote." });
        }

        const kevinId = latestLote.tecnicoId;

        await prisma.$transaction(async (tx) => {
            // 1. Get the Lote ID first to handle payment reversal
            const firstEq = await tx.equipo.findFirst({
                where: { imei: { in: imeis } },
                select: { loteId: true }
            });

            if (firstEq?.loteId) {
                // 2. Revert Payment if exists
                const lastTransaction = await tx.walletTransaction.findFirst({
                    where: { 
                        loteId: firstEq.loteId,
                        tipo: 'ingreso'
                    },
                    orderBy: { id: 'desc' }
                });

                if (lastTransaction) {
                    await tx.walletTransaction.delete({ where: { id: lastTransaction.id } });

                    const wallet = await tx.wallet.findFirst({ where: { tecnicoId: kevinId } });
                    if (wallet) {
                        await tx.wallet.update({
                            where: { id: wallet.id },
                            data: { saldo: { decrement: lastTransaction.monto } }
                        });

                        const account = await tx.walletAccount.findFirst({ where: { walletId: wallet.id, nombre: 'Principal' } });
                        if (account) {
                            await tx.walletAccount.update({
                                where: { id: account.id },
                                data: { saldo: { decrement: lastTransaction.monto } }
                            });
                        }
                    }
                }

                // 3. Move Equipments to Inventory
                await tx.equipo.updateMany({
                    where: { imei: { in: imeis } },
                    data: { 
                        estado: 'En Inventario',
                        userId: null,
                        loteId: null,
                        funcionalidad: null,
                        grado: null,
                        observacion: null
                    }
                });

                // 4. Delete the Lote if it was for these equipments
                await tx.lote.delete({
                    where: { id: firstEq.loteId }
                });

                // 5. Delete auto-generated history entries
                await tx.equipoHistorial.deleteMany({
                    where: { 
                        loteId: firstEq.loteId,
                        observacion: { contains: 'aprobado por Administrador' }
                    }
                });
            } else {
                // Just in case they are already unassigned but not in the right state
                await tx.equipo.updateMany({
                    where: { imei: { in: imeis } },
                    data: { 
                        estado: 'En Inventario',
                        userId: null,
                        loteId: null,
                        funcionalidad: null,
                        grado: null,
                        observacion: null
                    }
                });
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `${imeis.length} equipos puestos en Inventario correctamente. El lote anterior ha sido eliminado y el pago revertido.`,
            count: imeis.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
