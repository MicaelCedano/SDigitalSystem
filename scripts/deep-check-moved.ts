
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Deep search for moved equipments...");
    const allHist = await prisma.equipoHistorial.findMany({
        where: {
            OR: [
                { observacion: { contains: "compra #" } },
                { observacion: { contains: "Compra #" } }
            ]
        },
        include: { equipo: true }
    });

    console.log(`Found ${allHist.length} hist records mentioning a purchase.`);
    const moved: any[] = [];
    allHist.forEach(h => {
        if (!h.equipo) {
            console.log(`Orphaned history ID ${h.id}: ${h.observacion} (Equipo ${h.equipoId} GONE)`);
            return;
        }
        // Extract PID from observation like "Ingreso inicial por compra #61."
        const match = h.observacion?.match(/#[ ]?(\d+)/);
        if (match) {
            const mentionedPid = parseInt(match[1]);
            if (h.equipo.purchaseId !== mentionedPid) {
                moved.push({
                    imei: h.equipo.imei,
                    mentionedPid,
                    currentPid: h.equipo.purchaseId,
                    note: h.observacion
                });
            }
        }
    });

    console.log(`Summary: ${moved.length} equipments moved.`);
    moved.slice(0, 10).forEach(m => {
        console.log(`IMEI: ${m.imei} | Original: #${m.mentionedPid} | Now: #${m.currentPid} | Note: ${m.note}`);
    });
}

main()
