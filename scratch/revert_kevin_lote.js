
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const kevin = await prisma.user.findFirst({
    where: { 
      OR: [
        { username: { contains: 'kevin' } },
        { name: { contains: 'kevin' } }
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

  await prisma.$transaction(async (tx) => {
    await tx.lote.update({
      where: { id: latestLote.id },
      data: { estado: 'Abierto' }
    })

    await tx.equipo.updateMany({
      where: { loteId: latestLote.id },
      data: { 
        estado: 'En Revisión',
        userId: kevin.id 
      }
    })

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

      const wallet = await tx.wallet.findFirst({ where: { tecnicoId: kevin.id } })
      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { saldo: { decrement: lastTransaction.monto } }
        })

        const account = await tx.walletAccount.findFirst({ where: { walletId: wallet.id, nombre: 'Principal' } })
        if (account) {
          await tx.walletAccount.update({
            where: { id: account.id },
            data: { saldo: { decrement: lastTransaction.monto } }
          })
        }
      }
    }

    await tx.equipoHistorial.deleteMany({
      where: { 
        loteId: latestLote.id,
        observacion: { contains: 'aprobado por Administrador' }
      }
    })
  })

  console.log("Reversión completada con éxito")
}

main().finally(() => prisma.$disconnect())
