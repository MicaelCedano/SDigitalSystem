
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

        const latestLote = await prisma.lote.findFirst({
            where: { 
                tecnicoId: kevin.id,
                estado: 'Entregado'
            },
            orderBy: { id: 'desc' },
            include: { equipos: true }
        });

        if (!latestLote) {
            return NextResponse.json({ error: "No se encontró ningún lote aprobado de Kevin" });
        }

        await prisma.$transaction(async (tx) => {
            // Revert Lote
            await tx.lote.update({
                where: { id: latestLote.id },
                data: { estado: 'Abierto' }
            });

            // Revert Equipments
            await tx.equipo.updateMany({
                where: { loteId: latestLote.id },
                data: { 
                    estado: 'En Revisión',
                    userId: kevin.id 
                }
            });

            // Revert Payment
            const lastTransaction = await tx.walletTransaction.findFirst({
                where: { 
                    loteId: latestLote.id,
                    tipo: 'ingreso'
                },
                orderBy: { id: 'desc' }
            });

            if (lastTransaction) {
                await tx.walletTransaction.delete({ where: { id: lastTransaction.id } });

                const wallet = await tx.wallet.findFirst({ where: { tecnicoId: kevin.id } });
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

            // Delete history items
            await tx.equipoHistorial.deleteMany({
                where: { 
                    loteId: latestLote.id,
                    observacion: { contains: 'aprobado por Administrador' }
                }
            });
        });

        return NextResponse.json({ success: true, message: `Lote ${latestLote.codigo} de Kevin revertido correctamente.` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
