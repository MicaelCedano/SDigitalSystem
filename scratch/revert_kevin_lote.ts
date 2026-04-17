
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const kevin = await prisma.user.findFirst({
    where: { 
      OR: [
        { username: { contains: 'kevin', mode: 'insensitive' } },
        { name: { contains: 'kevin', mode: 'insensitive' } }
      ]
    }
  })

  if (!kevin) {
    console.log("No se encontró al técnico Kevin")
    return
  }

  console.log(`Técnico encontrado: ${kevin.username} (ID: ${kevin.id})`)

  const latestLote = await prisma.lote.findFirst({
    where: { 
      tecnicoId: kevin.id,
      estado: 'Entregado'
    },
    orderBy: { id: 'desc' },
    include: { equipos: true }
  })

  if (!latestLote) {
    console.log("No se encontró ningún lote aprobado de Kevin")
    return
  }

  console.log(`Lote encontrado: ${latestLote.codigo} (ID: ${latestLote.id})`)
  console.log(`Equipos en lote: ${latestLote.equipos.length}`)

  // Revert logic
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Revert Lote status to 'Abierto' (or 'Pendiente'?)
      // The user said "como estaba antes de darle a forzar aprovacion".
      // If they forced it, it was probably 'Abierto'.
      await tx.lote.update({
        where: { id: latestLote.id },
        data: { estado: 'Abierto' }
      })

      // 2. Revert Equipments status back to 'En Revisión' and reassign to technician
      await tx.equipo.updateMany({
        where: { loteId: latestLote.id },
        data: { 
          estado: 'En Revisión',
          userId: kevin.id 
        }
      })

      // 3. Revert Payment
      const paymentAmount = latestLote.equipos.length * 50
      
      const lastTransaction = await tx.walletTransaction.findFirst({
        where: { 
          loteId: latestLote.id,
          tipo: 'ingreso'
        },
        orderBy: { id: 'desc' }
      })

      if (lastTransaction) {
        console.log(`Eliminando transacción de pago: RD$ ${lastTransaction.monto}`)
        await tx.walletTransaction.delete({ where: { id: lastTransaction.id } })

        // Update Wallet Balance
        const wallet = await tx.wallet.findFirst({ where: { tecnicoId: kevin.id } })
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { saldo: { decrement: lastTransaction.monto } }
          })

          // Update Account Balance
          const account = await tx.walletAccount.findFirst({ where: { walletId: wallet.id, nombre: 'Principal' } })
          if (account) {
            await tx.walletAccount.update({
              where: { id: account.id },
              data: { saldo: { decrement: lastTransaction.monto } }
            })
          }
        }
      }

      // 4. Delete equipment history entries created by approval
      await tx.equipoHistorial.deleteMany({
        where: { 
          loteId: latestLote.id,
          observacion: { contains: 'aprobado por Administrador' }
        }
      })

      console.log("Reversión completada con éxito")
    })
  } catch (error) {
    console.error("Error al revertir:", error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
