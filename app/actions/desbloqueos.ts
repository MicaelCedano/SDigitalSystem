"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getSantoDomingoDateStr } from "@/lib/utils";
import { sendTelegramMessage, escapeHTML } from "@/lib/telegram";

const MONTO_POR_DESBLOQUEO = 25;

/**
 * Valida formato de IMEI con checksum Luhn + checks anti-basura.
 *
 * - Debe tener exactamente 15 dígitos numéricos.
 * - No todos los dígitos iguales (atrapa 000000000000000, 111111111111111, etc).
 * - Checksum Luhn válido: atrapa el ~90% de errores tipográficos y de copia-pega.
 *
 * NO valida que el IMEI exista en la tabla `equipo` (módulo desbloqueos es
 * independiente del inventario, regla del 2026-06-25). El sistema confía en
 * que el técnico sabe qué IMEI desbloqueó.
 *
 * Retorna { valid, error }.
 */
function validarImei(imei: string): { valid: boolean; error?: string } {
    if (!imei || typeof imei !== "string") {
        return { valid: false, error: "vacío" };
    }
    const s = imei.trim();
    if (!/^\d+$/.test(s)) {
        return { valid: false, error: "contiene letras o símbolos" };
    }
    if (s.length !== 15) {
        return { valid: false, error: `debe tener 15 dígitos (tiene ${s.length})` };
    }
    if (new Set(s).size === 1) {
        return { valid: false, error: "todos los dígitos son iguales" };
    }
    // Luhn: doblar cada 2do dígito desde la derecha, sumar dígitos resultantes.
    // Suma total debe ser múltiplo de 10.
    const digits = s.split("").map(Number);
    let total = 0;
    for (let i = 0; i < digits.length; i++) {
        // i=0 es el último dígito (no se duplica), i=1 penúltimo (se duplica), etc.
        const fromRight = digits.length - 1 - i;
        let d = digits[fromRight];
        if (i % 2 === 1) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        total += d;
    }
    if (total % 10 !== 0) {
        return { valid: false, error: "checksum Luhn inválido" };
    }
    return { valid: true };
}

/**
 * Crea una nueva solicitud de desbloqueo.
 * Accesible para: técnicos y QC.
 * Validaciones:
 *  - Lista no vacía
 *  - Sin IMEIs vacíos / duplicados dentro de la misma lista
 *  - Modelo obligatorio
 *  - IMEIs NO están ya en UnlockRecord (constraint anti-doble-pago)
 *  - IMEIs no están ya en otra solicitud Pendiente QC / Pendiente Admin
 *
 * IMPORTANTE: este flujo es un MÓDULO INDEPENDIENTE. Los IMEIs NO se persisten
 * en la tabla `equipo`. Se persisten en `UnlockRecord` recién cuando el admin
 * aprueba la solicitud. Hasta entonces, viven sólo en el JSON de la solicitud.
 *
 * CAMBIO 2026-06-27: se eliminó el paso de QC. La solicitud se crea
 * directamente en estado "Pendiente Admin" para que Micael la apruebe y se
 * pague al técnico en un solo paso. La validación anti-doble-pago contra
 * UnlockRecord se mantiene exactamente al crear (mismo momento, mismo rigor).
 */
export async function crearSolicitudDesbloqueo(imeis: string[], modelo: string, observacion?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { success: false, error: "No autenticado" };
    }

    const userId = Number(session.user.id);
    const role = session.user.role;
    const rolesPermitidos = ["tecnico", "tecnico_garantias", "control_calidad", "admin"];
    if (!rolesPermitidos.includes(role)) {
        return { success: false, error: "No autorizado para crear solicitudes de desbloqueo" };
    }

    // 1. Sanitizar lista
    const imeisLimpios = (imeis || [])
        .map(i => (i || "").toString().trim())
        .filter(i => i.length > 0);

    if (imeisLimpios.length === 0) {
        return { success: false, error: "Debes enviar al menos un IMEI" };
    }

    // 2. Modelo obligatorio
    const modeloLimpio = (modelo || "").toString().trim();
    if (modeloLimpio.length === 0) {
        return { success: false, error: "El modelo es obligatorio (ej. Vortex HD65 Ultra)" };
    }

    // 3. Duplicados dentro de la misma lista
    const setImeis = new Set(imeisLimpios);
    if (setImeis.size !== imeisLimpios.length) {
        const counts = new Map<string, number>();
        for (const i of imeisLimpios) counts.set(i, (counts.get(i) || 0) + 1);
        const duplicados: string[] = [];
        for (const [imei, c] of Array.from(counts.entries())) {
            if (c > 1) duplicados.push(imei);
        }
        return { success: false, error: `Hay IMEIs repetidos en la lista: ${duplicados.join(", ")}` };
    }

    // 3.5 Formato de cada IMEI (Luhn + anti-basura)
    // 2026-06-27: agregado tras queja de Micael sobre IMEIs inventados. Atrapa:
    //   - longitud != 15
    //   - letras o símbolos
    //   - todos los dígitos iguales (0000..., 1111..., etc)
    //   - checksum Luhn inválido (errores de tipeo/copia-pega)
    // NO valida que el IMEI exista en la tabla `equipo` (módulo independiente).
    for (const imei of imeisLimpios) {
        const v = validarImei(imei);
        if (!v.valid) {
            return {
                success: false,
                error: `IMEI inválido (${imei}): ${v.error}`
            };
        }
    }

    try {
        // 4. IMEIs ya desbloqueados antes (en UnlockRecord)
        const yaDesbloqueados = await prisma.unlockRecord.findMany({
            where: { imei: { in: imeisLimpios } },
            select: { imei: true, createdAt: true, tecnico: { select: { name: true } } }
        });
        if (yaDesbloqueados.length > 0) {
            const lista = yaDesbloqueados.map(r => `${r.imei} (por ${r.tecnico.name})`).join(", ");
            return {
                success: false,
                error: `Estos IMEIs ya fueron desbloqueados: ${lista}`
            };
        }

        // 5. IMEIs en otra solicitud pendiente
        const solicitudesAbiertas = await prisma.solicitudDesbloqueo.findMany({
            where: { estado: { in: ["Pendiente QC", "Pendiente Admin"] } },
            select: { imeis: true }
        });

        const enProceso = new Set<string>();
        for (const sol of solicitudesAbiertas) {
            const lista = (sol.imeis as any[]) || [];
            for (const item of lista) {
                const v = typeof item === "string" ? item : item?.imei;
                if (v) enProceso.add(v);
            }
        }
        const conflicto = imeisLimpios.filter(i => enProceso.has(i));
        if (conflicto.length > 0) {
            return {
                success: false,
                error: `Estos IMEIs ya están en otra solicitud pendiente: ${conflicto.join(", ")}`
            };
        }

        // 6. Generar código único: DESB-{username}-{fecha}-#
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, name: true } });
        const userTag = (user?.username || user?.name || "user").replace(/[^a-zA-Z0-9]/g, "");
        const dateStr = getSantoDomingoDateStr();
        const baseCode = `DESB-${userTag}-${dateStr}`;

        const lastSol = await prisma.solicitudDesbloqueo.findFirst({
            where: { codigo: { startsWith: baseCode } },
            orderBy: { id: "desc" }
        });

        let suffix = 1;
        if (lastSol) {
            const parts = lastSol.codigo.split("-");
            const lastSuffix = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSuffix)) suffix = lastSuffix + 1;
        }
        const codigo = `${baseCode}-${suffix}`;

        // 7. Guardar IMEIs como Json (lista de {imei, estado})
        const imeisJson = imeisLimpios.map(i => ({ imei: i, estado: "Pendiente", motivo: null as string | null }));

        const solicitud = await prisma.solicitudDesbloqueo.create({
            data: {
                codigo,
                tecnicoId: userId,
                modelo: modeloLimpio,
                imeis: imeisJson as any,
                estado: "Pendiente Admin",
                observacion: observacion || null,
                totalEquipos: imeisLimpios.length,
                equiposAprobados: 0,
                equiposRechazados: 0,
                montoPorEquipo: MONTO_POR_DESBLOQUEO,
                montoTotalPagado: 0
            }
        });

        // 8. Notificar al admin (Micael) por Telegram
        // 2026-06-30: restaurado tras la eliminación del paso de QC (27-06).
        // Es la única señal pasiva que tiene Micael de que hay una solicitud
        // esperando aprobación; el badge rojo del Sidebar también existe pero
        // solo lo ve si está logueado en la web. Mensaje corto, un solo IMEI
        // por línea solo si hay <= 5; si hay más, mostramos la cantidad y el
        // técnico puede ver el detalle completo en /admin/desbloqueos.
        const tgMsg = await sendTelegramMessage(
            `🔓 <b>Nueva solicitud de desbloqueo</b>\n` +
            `\n` +
            `📋 <b>${escapeHTML(codigo)}</b>\n` +
            `👤 Técnico: <b>${escapeHTML(user?.name || user?.username || "—")}</b> (@${escapeHTML(user?.username || "—")})\n` +
            `📱 Modelo: <b>${escapeHTML(modeloLimpio)}</b>\n` +
            `🔢 IMEIs: <b>${imeisLimpios.length}</b>\n` +
            (imeisLimpios.length <= 5
                ? `\n<code>${imeisLimpios.map(i => escapeHTML(i)).join("\n")}</code>\n`
                : "") +
            `\n👉 Aprobar en: https://sdigitalsystem.vercel.app/admin/desbloqueos`
        );
        if (!tgMsg.success) {
            // No revertir: el guardado en BD ya está hecho. Solo loguear para debug.
            console.error("[desbloqueos] No se pudo notificar al admin por Telegram:", tgMsg.error);
        }

        revalidatePath("/desbloqueos");
        revalidatePath("/admin/desbloqueos");

        return {
            success: true,
            solicitudId: solicitud.id,
            codigo: solicitud.codigo,
            message: `Solicitud ${codigo} creada con ${imeisLimpios.length} equipo(s). Pendiente de aprobación del administrador.`
        };
    } catch (error: any) {
        console.error("Error creando solicitud de desbloqueo:", error);
        return { success: false, error: error.message || "Error al crear la solicitud" };
    }
}

/**
 * Admin (Micael) acepta o rechaza final.
 * Al aceptar, dispara el pago a wallet del técnico (RD$25 × IMEIs aprobados).
 * Si la solicitud pasó por QC antes del cambio 2026-06-27, se conserva el QC
 * en el campo `qcId` (auditoría histórica) pero NO se le paga nada extra.
 */
export async function adminAceptarSolicitud(
    solicitudId: number,
    accion: "aceptar" | "rechazar",
    observacionAdmin?: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };
    if (session.user.role !== "admin") {
        return { success: false, error: "Solo el administrador puede aceptar solicitudes finales" };
    }

    const adminId = Number(session.user.id);

    try {
        const solicitud = await prisma.solicitudDesbloqueo.findUnique({
            where: { id: solicitudId },
            include: { tecnico: true, qc: true }
        });
        if (!solicitud) return { success: false, error: "Solicitud no encontrada" };
        if (solicitud.estado !== "Pendiente Admin") {
            return { success: false, error: "Esta solicitud no está pendiente de aprobación admin" };
        }

        if (accion === "rechazar") {
            await prisma.solicitudDesbloqueo.update({
                where: { id: solicitudId },
                data: {
                    estado: "Rechazado",
                    adminId,
                    fechaAdmin: new Date(),
                    observacionAdmin: observacionAdmin || "Rechazado por administrador"
                }
            });

            // Notificar técnico y QC
            await prisma.notification.createMany({
                data: [
                    {
                        tecnicoId: solicitud.tecnicoId,
                        tipo: "desbloqueo_rechazado",
                        titulo: "Solicitud de Desbloqueo Rechazada",
                        mensaje: `Tu solicitud ${solicitud.codigo} fue rechazada por el administrador.`,
                        leida: false,
                        fecha: new Date(),
                        fromUserId: adminId,
                        redirectUrl: "/desbloqueos"
                    },
                    ...(solicitud.qcId
                        ? [{
                            tecnicoId: solicitud.qcId,
                            tipo: "desbloqueo_rechazado",
                            titulo: "Solicitud de Desbloqueo Rechazada",
                            mensaje: `La solicitud ${solicitud.codigo} que revisaste fue rechazada.`,
                            leida: false,
                            fecha: new Date(),
                            fromUserId: adminId,
                            redirectUrl: "/qc/desbloqueos"
                        }]
                        : [])
                ]
            });

            revalidatePath("/admin/desbloqueos");
            revalidatePath("/desbloqueos");
            return { success: true, message: "Solicitud rechazada." };
        }

        // ============ ACEPTAR: acreditar pagos a wallet ============
        // 2026-06-27: ya no hay paso de QC, todos los IMEIs de la solicitud
        // se aprueban en bloque al hacer clic. La validación anti-doble-pago
        // ocurrió en `crearSolicitudDesbloqueo` contra `unlockRecord`. Si por
        // una carrera un IMEI ya existe en UnlockRecord, la constraint @unique
        // falla y la transacción hace rollback completo (no se pagan las wallets).
        const imeisActuales = (solicitud.imeis as any[]) || [];
        // Tomamos TODOS los IMEIs (ya están validados al crear). Si la solicitud
        // es retroactiva del flujo viejo con estado="Aprobado" en algunos items,
        // esos se respetan; los "Pendiente" se cuentan también.
        const imeisAcreditar = imeisActuales
            .filter((x: any) => x.estado !== "Rechazado")
            .map((x: any) => x.imei);
        const cantidadAprobados = imeisAcreditar.length;

        if (cantidadAprobados === 0) {
            return { success: false, error: "No hay IMEIs válidos para pagar" };
        }

        const montoPorUnidad = MONTO_POR_DESBLOQUEO;
        const montoTotal = cantidadAprobados * montoPorUnidad;

        await prisma.$transaction(async (tx) => {
            // Acreditar SOLO al TÉCNICO que desbloqueó.
            // 2026-06-27: se eliminó el pago al QC. La aprobación la hace
            // Micael directamente, no hay rol intermedio que cobrar.
            await acreditarWallet(
                tx,
                solicitud.tecnicoId,
                montoTotal,
                `Desbloqueo ${solicitud.codigo} - ${cantidadAprobados} equipo(s)`
            );

            // Persistir cada IMEI en UnlockRecord (módulo aparte, NO toca Equipo).
            const now = new Date();
            await tx.unlockRecord.createMany({
                data: imeisAcreditar.map((imei: string) => ({
                    imei,
                    modelo: solicitud.modelo,
                    solicitudId: solicitudId,
                    tecnicoId: solicitud.tecnicoId,
                    qcId: solicitud.qcId, // histórico: si pasó por QC antes, se conserva
                    adminId,
                    createdAt: now,
                    paidAt: now
                }))
            });

            // Cerrar la solicitud y marcar todos los IMEIs como Aprobado en el JSON
            const imeisCerrados = imeisActuales.map((x: any) => ({
                imei: x.imei,
                estado: x.estado === "Rechazado" ? "Rechazado" : "Aprobado",
                motivo: x.motivo || null
            }));
            await tx.solicitudDesbloqueo.update({
                where: { id: solicitudId },
                data: {
                    estado: "Aprobado",
                    adminId,
                    fechaAdmin: new Date(),
                    observacionAdmin: observacionAdmin || null,
                    imeis: imeisCerrados as any,
                    equiposAprobados: imeisCerrados.filter((x: any) => x.estado === "Aprobado").length,
                    equiposRechazados: imeisCerrados.filter((x: any) => x.estado === "Rechazado").length,
                    montoTotalPagado: montoTotal
                }
            });
        });

        // Notificar SOLO al técnico (ya no al QC, no aplica)
        await prisma.notification.create({
            data: {
                tecnicoId: solicitud.tecnicoId,
                tipo: "desbloqueo_aprobado",
                titulo: "¡Desbloqueo Aprobado!",
                mensaje: `Tu solicitud ${solicitud.codigo} fue aprobada. +RD$${montoTotal.toFixed(2)} a tu wallet.`,
                monto: montoTotal,
                leida: false,
                fecha: new Date(),
                fromUserId: adminId,
                redirectUrl: "/desbloqueos"
            }
        });

        revalidatePath("/admin/desbloqueos");
        revalidatePath("/desbloqueos");
        revalidatePath("/wallet");

        return {
            success: true,
            message: `Aprobado. Pagados RD$${montoTotal.toFixed(2)} al técnico.`
        };
    } catch (error: any) {
        console.error("Error aceptando solicitud admin:", error);
        return { success: false, error: error.message || "Error al aceptar" };
    }
}

/**
 * Acredita monto a la cuenta "Principal" del wallet del usuario.
 * Helper interno, recibe un cliente de transacción de Prisma.
 */
async function acreditarWallet(
    tx: any,
    userId: number,
    monto: number,
    descripcion: string
) {
    let wallet = await tx.wallet.findFirst({
        where: { tecnicoId: userId },
        include: { accounts: true }
    });

    if (!wallet) {
        wallet = await tx.wallet.create({
            data: { tecnicoId: userId, saldo: 0 },
            include: { accounts: true }
        });
    }

    let principalAcc = wallet.accounts.find((acc: any) => acc.nombre === "Principal");
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
            tecnicoId: userId,
            monto,
            tipo: "ingreso",
            estado: "Completado",
            canjeado: true,
            fecha: new Date(),
            descripcion,
            secureToken: crypto.randomBytes(32).toString("hex")
        }
    });

    await tx.walletAccount.update({
        where: { id: principalAcc.id },
        data: { saldo: { increment: monto } }
    });

    await tx.wallet.update({
        where: { id: wallet.id },
        data: { saldo: { increment: monto } }
    });
}

/**
 * Lista solicitudes con filtro de estado y rol del usuario.
 */
export async function getSolicitudesDesbloqueo(estado?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const userId = Number(session.user.id);
    const role = session.user.role;

    try {
        const where: any = {};
        if (estado) where.estado = estado;
        // técnicos ven solo las suyas
        if (role === "tecnico") where.tecnicoId = userId;
        // QC ve las pendientes de revisión y las que ya revisó
        // admin ve todas

        const solicitudes = await prisma.solicitudDesbloqueo.findMany({
            where,
            orderBy: { fechaCreacion: "desc" },
            include: {
                tecnico: { select: { id: true, name: true, username: true, profileImage: true } },
                qc: { select: { id: true, name: true, username: true } },
                admin: { select: { id: true, name: true, username: true } }
            }
        });

        return { success: true, solicitudes };
    } catch (error: any) {
        console.error("Error listando solicitudes:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Cuenta cuántas solicitudes están en "Pendiente Admin" (las que Micael debe aceptar).
 * Solo para admin. Retorna 0 si no hay sesión o no es admin.
 * Usado por el Sidebar para mostrar un badge rojo cuando hay algo esperando.
 */
export async function getPendingAdminDesbloqueosCount(): Promise<number> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return 0;
    if (session.user.role !== "admin") return 0;

    try {
        // 2026-06-27: ya no hay paso de QC, todas las solicitudes nuevas nacen
        // en "Pendiente Admin". El "Pendiente QC" se incluye por retro-compat:
        // solicitudes creadas antes de este cambio que aún nadie aprobó.
        const count = await prisma.solicitudDesbloqueo.count({
            where: { estado: { in: ["Pendiente Admin", "Pendiente QC"] } }
        });
        return count;
    } catch (error: any) {
        console.error("[desbloqueos] Error contando pendientes admin:", error?.message);
        return 0;
    }
}

// 2026-06-27: se eliminó la función `recordarQCsDesbloqueos` porque ya no
// existe el paso de QC en el flujo de desbloqueos. El técnico crea la
// solicitud → Micael aprueba y paga directo. No hay cuello de botella que
// recordar.

/**
 * Busca el UnlockRecord (registro de auditoría del desbloqueo) por IMEI exacto.
 * Solo admin. Devuelve: IMEI, modelo, fecha creación, fecha pago, técnico que pidió
 * el desbloqueo, QC que revisó (si la solicitud es vieja pre-2026-06-27), admin que
 * aprobó y pagó, y el id de la solicitud origen para linkear a /admin/desbloqueos.
 *
 * El IMEI en UnlockRecord es único → a lo sumo 1 resultado. Si el IMEI nunca
 * fue desbloqueado/aprobado, retorna { success: true, record: null }.
 */
export async function buscarUnlockPorImei(imei: string): Promise<{
    success: boolean;
    record?: {
        imei: string;
        modelo: string | null;
        createdAt: string;
        paidAt: string | null;
        solicitudId: number;
        solicitudCodigo: string;
        tecnico: { id: number; name: string; username: string } | null;
        qc: { id: number; name: string; username: string } | null;
        admin: { id: number; name: string; username: string } | null;
    };
    error?: string;
}> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autorizado" };
    if (session.user.role !== "admin") return { success: false, error: "No autorizado" };

    const imeiLimpio = imei.trim();
    if (!imeiLimpio) return { success: false, error: "IMEI vacío" };

    try {
        const record = await prisma.unlockRecord.findUnique({
            where: { imei: imeiLimpio },
            include: {
                tecnico: { select: { id: true, name: true, username: true } },
                qc: { select: { id: true, name: true, username: true } },
                admin: { select: { id: true, name: true, username: true } },
                solicitud: { select: { id: true, codigo: true } }
            }
        });

        if (!record) return { success: true, record: undefined };

        return {
            success: true,
            record: {
                imei: record.imei,
                modelo: record.modelo,
                createdAt: record.createdAt.toISOString(),
                paidAt: record.paidAt?.toISOString() || null,
                solicitudId: record.solicitud.id,
                solicitudCodigo: record.solicitud.codigo,
                tecnico: record.tecnico
                    ? { id: record.tecnico.id, name: record.tecnico.name || record.tecnico.username, username: record.tecnico.username }
                    : null,
                qc: record.qc
                    ? { id: record.qc.id, name: record.qc.name || record.qc.username, username: record.qc.username }
                    : null,
                admin: record.admin
                    ? { id: record.admin.id, name: record.admin.name || record.admin.username, username: record.admin.username }
                    : null
            }
        };
    } catch (error: any) {
        console.error("[desbloqueos] Error buscando UnlockRecord por IMEI:", error?.message);
        return { success: false, error: error?.message || "Error desconocido" };
    }
}
