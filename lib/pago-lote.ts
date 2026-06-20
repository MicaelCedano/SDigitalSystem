import type { PrismaClient } from "@prisma/client";

/**
 * Fuente única de verdad para el cálculo de pago de un lote de QC.
 *
 * Reglas de negocio:
 *  - Se pagan TODOS los equipos del lote (buenos + malos), ya que el técnico
 *    revisa el lote completo. Solo cambia el destino del equipo: los buenos
 *    van a inventario; los malos se marcan como "Descartado" (defectuoso).
 *  - La tarifa por equipo se lee de `TecnicoGarantiaPago.montoPorReparacion`
 *    configurada para el técnico. Si no hay config, se usa 50 como fallback
 *    histórico (consistente con la lógica previa).
 *  - Esta función es PURA respecto al cálculo: no escribe nada, solo lee.
 *    Se usa dentro y fuera de transacciones (acepta el cliente prisma o un tx).
 *
 * Se usa en:
 *  - `app/actions/lotes.ts` (submitLoteForReview → mensaje del bot)
 *  - `app/actions/lotes.ts` (approveLote → acreditación real)
 *  - `app/api/telegram-webhook/route.ts` (callback approve_lote)
 */

export const TARIFA_FALLBACK = 50;

export interface PagoLoteResult {
    /** Total de equipos en el lote. */
    totalEquipos: number;
    /** Equipos con `funcionalidad: "Funcional"`. */
    buenos: number;
    /** Equipos que NO son "Funcional" (malos, pendiente, etc.). */
    malos: number;
    /** Tarifa aplicada por equipo (RD$). */
    tarifa: number;
    /** Monto total a pagar = totalEquipos × tarifa (buenos + malos). */
    total: number;
    /** true si la tarifa vino de la BD; false si fue el fallback. */
    tarifaConfigurada: boolean;
}

/**
 * Calcula el pago de un lote. Acepta `prisma` o un `tx` de `$transaction`.
 */
export async function calcularPagoLote(
    db: PrismaClient | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
    loteId: number
): Promise<PagoLoteResult> {
    const lote = await db.lote.findUnique({
        where: { id: loteId },
        select: { tecnicoId: true }
    });

    if (!lote) {
        throw new Error(`Lote ${loteId} no encontrado al calcular pago`);
    }

    const [totalEquipos, buenos, config] = await Promise.all([
        db.equipo.count({ where: { loteId } }),
        db.equipo.count({ where: { loteId, funcionalidad: "Funcional" } }),
        db.tecnicoGarantiaPago.findFirst({
            where: { tecnicoId: lote.tecnicoId },
            select: { montoPorReparacion: true }
        })
    ]);

    const tarifaConfigurada = typeof config?.montoPorReparacion === "number";
    const tarifa = tarifaConfigurada
        ? (config!.montoPorReparacion as number)
        : TARIFA_FALLBACK;

    return {
        totalEquipos,
        buenos,
        malos: totalEquipos - buenos,
        tarifa,
        total: totalEquipos * tarifa,
        tarifaConfigurada
    };
}
