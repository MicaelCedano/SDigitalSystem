"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, Purchase, Supplier, PurchaseItem, Equipo, DeviceModel } from "@prisma/client";
import { z } from "zod";
import { sendTelegramDocument } from "@/lib/telegram";
import ExcelJS from "exceljs";
import { sortEquipments } from "@/lib/utils";

const CreatePurchaseSchema = z.object({
    supplierId: z.coerce.number(),
    purchaseDate: z.coerce.date(),
    items: z.array(z.object({
        modelId: z.coerce.number(),
        quantity: z.coerce.number(),
        imeis: z.string(),
        // Optional fields for on-the-fly model creation
        brand: z.string().optional(),
        modelName: z.string().optional(),
        storageGb: z.coerce.number().optional(),
        color: z.string().optional().nullable(),
    }))
});

const AddManualEquipmentSchema = z.object({
    purchaseId: z.coerce.number(),
    item: z.object({
        modelId: z.coerce.number(),
        quantity: z.coerce.number().min(1),
        imeis: z.string().min(1),
        brand: z.string().optional(),
        modelName: z.string().optional(),
        storageGb: z.coerce.number().optional(),
        color: z.string().optional().nullable(),
    })
});

export type PurchaseWithProgress = Purchase & {
    supplier: Supplier;
    items: PurchaseItem[];
    displayProgress: number;
    completedCount: number;
    originalTotal: number;
};
function isTransactionNotFoundError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("Transaction not found") || message.includes("Transaction API error");
}

async function runTransactionWithRetry<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
    retries = 2
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            return await prisma.$transaction(callback, {
                maxWait: 30000,
                timeout: 300000
            });
        } catch (error) {
            lastError = error;
            if (!isTransactionNotFoundError(error) || attempt > retries) {
                throw error;
            }
            console.warn(`[Purchase] Reintentando transaccion (${attempt}/${retries + 1}) por error transitorio.`);
        }
    }

    throw lastError;
}
export async function createPurchase(data: z.infer<typeof CreatePurchaseSchema>) {
    console.log(">>> [DEBUG] EXECUTING createPurchase - OPTIMIZED VERSION <<<");
    console.log("Starting createPurchase with items:", data.items.length);

    const result = CreatePurchaseSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: "Datos inválidos: " + result.error.issues.map(i => i.message).join(", ") };
    }

    const { supplierId, purchaseDate, items } = result.data;

    try {
        // Validation Phase (Outside transaction for speed and cleaner checks)
        const allImeis = new Set<string>();
        for (const [index, item] of items.entries()) {
            const imeiList = item.imeis.split('\n').map(s => s.trim()).filter(s => s.length > 0);
            if (imeiList.length !== item.quantity) {
                return { success: false, error: `Fila #${index + 1}: Cantidad (${item.quantity}) no coincide con IMEIs (${imeiList.length}).` };
            }
            if (item.modelId === 0 && (!item.brand?.trim() || !item.modelName?.trim() || !item.storageGb || item.storageGb < 1)) {
                return { success: false, error: `Fila #${index + 1}: completa marca, modelo y capacidad para crear un modelo nuevo.` };
            }
            for (const imei of imeiList) {
                if (allImeis.has(imei)) return { success: false, error: `IMEI duplicado en el formulario: ${imei}` };
                allImeis.add(imei);
            }
        }

        const imeisToCheck = Array.from(allImeis);
        const existingEquipos = await prisma.equipo.findMany({
            where: { imei: { in: imeisToCheck } },
            include: { deviceModel: true, purchase: true }
        });

        const existingMap = new Map(existingEquipos.map(eq => [eq.imei, eq]));

        // Transaction Phase
        const finalPurchase = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase (active immediately; no drafts step)
            const purchase = await tx.purchase.create({
                data: {
                    supplierId,
                    purchaseDate: new Date(purchaseDate),
                    totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
                    estado: 'activa'
                }
            });

            const equipmentsToCreate: any[] = [];
            const equipmentsToUpdate: any[] = [];
            const historyToCreate: any[] = [];

            // 2. Process Items
            for (const item of items) {
                const imeiList = item.imeis.split('\n').map(s => s.trim()).filter(s => s.length > 0);
                let finalModelId = item.modelId;

                // Handle On-the-fly model creation
                if (finalModelId === 0 && item.brand && item.modelName) {
                    const existingModel = await tx.deviceModel.findFirst({
                        where: {
                            brand: item.brand,
                            modelName: item.modelName,
                            storageGb: item.storageGb,
                            color: item.color
                        }
                    });

                    if (existingModel) {
                        finalModelId = existingModel.id;
                    } else {
                        const newModel = await tx.deviceModel.create({
                            data: {
                                brand: item.brand,
                                modelName: item.modelName,
                                storageGb: item.storageGb || 0,
                                color: item.color,
                                imageFilename: 'iphone-placeholder.png'
                            }
                        });
                        finalModelId = newModel.id;
                    }
                }

                if (finalModelId === 0) throw new Error("ID de modelo no válido.");

                // Fetch model info
                const deviceModel = await tx.deviceModel.findUnique({ where: { id: finalModelId } });
                if (!deviceModel) throw new Error(`Modelo no encontrado (ID: ${finalModelId})`);

                // Create PurchaseItem
                await tx.purchaseItem.create({
                    data: {
                        purchaseId: purchase.id,
                        deviceModelId: finalModelId,
                        quantity: item.quantity
                    }
                });

                // Prepare Equipos
                for (const imei of imeiList) {
                    const existing = existingMap.get(imei);
                    const equipoData = {
                        estado: 'En Inventario',
                        fechaIngreso: new Date(purchaseDate),
                        purchaseId: purchase.id,
                        deviceModelId: finalModelId,
                        marca: deviceModel.brand,
                        modelo: deviceModel.modelName,
                        storageGb: deviceModel.storageGb,
                        color: deviceModel.color,
                        grado: null,
                        observacion: null,
                        funcionalidad: null,
                        loteId: null,
                        userId: null
                    };

                    if (existing) {
                        equipmentsToUpdate.push({ id: existing.id, imei, ...equipoData });
                    } else {
                        equipmentsToCreate.push({ imei, ...equipoData });
                    }
                }
            }

            // 3. Batch Operations
            if (equipmentsToUpdate.length > 0) {
                for (const updateData of equipmentsToUpdate) {
                    const { id, ...data } = updateData;
                    await tx.equipo.update({ where: { id }, data });
                    historyToCreate.push({
                        equipoId: id,
                        estado: 'En Inventario',
                        fecha: new Date(),
                        observacion: `Reintegrado por compra #${purchase.id}.`
                    });
                }
            }

            if (equipmentsToCreate.length > 0) {
                await tx.equipo.createMany({ data: equipmentsToCreate });

                // Fetch newly created IDs for history
                const newEqs = await tx.equipo.findMany({
                    where: { imei: { in: equipmentsToCreate.map(e => e.imei) } },
                    select: { id: true }
                });
                newEqs.forEach(eq => {
                    historyToCreate.push({
                        equipoId: eq.id,
                        estado: 'En Inventario',
                        fecha: new Date(),
                        observacion: `Ingreso inicial por compra #${purchase.id}.`
                    });
                });
            }


            if (historyToCreate.length > 0) {
                await tx.equipoHistorial.createMany({ data: historyToCreate });
            }
            return purchase;
        }, {
            maxWait: 30000,
            timeout: 300000
        });

        revalidatePath("/compras");
        return { success: true, purchaseId: finalPurchase.id };

    } catch (error: any) {
        console.error("Error creating purchase:", error);
        return {
            success: false,
            error: error.message || "Error interno al crear la compra."
        };
    }
}

export async function getPurchases() {
    // Active purchases only (drafts step removed)
    const purchases = await prisma.purchase.findMany({
        orderBy: { id: 'desc' },
        include: {
            supplier: true
        }
    }) as any[];

    const active: any[] = [];
    const history: any[] = [];

    // Calculate progress for each
    for (const purchase of purchases) {
        const totalEquipments = purchase.totalQuantity;
        // Count completed equipments: Anything that has been reviewed (funcionalidad is not null)
        // or is in a terminal state.
        const completedCount = await prisma.equipo.count({
            where: {
                purchaseId: purchase.id,
                OR: [
                    { estado: { in: ['Revisado', 'Entregado', 'Vendido'] } },
                    { funcionalidad: { not: null } }
                ]
            }
        });

        // We should also check the real count in the table. 
        // If equipment was moved or deleted, totalQuantity might be wrong.
        const actualTotalInTable = await prisma.equipo.count({
            where: { purchaseId: purchase.id }
        });

        // Use the actual count in table as the base if it's different from totalQuantity
        // this fixes the "97%" stuck issue for old purchases where some items were removed/moved.
        const referenceTotal = actualTotalInTable > 0 ? actualTotalInTable : totalEquipments;

        const percentage = referenceTotal > 0 ? (completedCount / referenceTotal) * 100 : 0;

        const enhancedPurchase: any = {
            ...purchase,
            supplier: (purchase as any).supplier,
            displayProgress: Math.min(percentage, 100),
            completedCount,
            originalTotal: referenceTotal
        };

        if (percentage < 100) {
            active.push(enhancedPurchase);
        } else {
            history.push(enhancedPurchase);
        }
    }

    return { active, history };
}

export async function deletePurchase(id: number) {
    try {
        await prisma.$transaction(async (tx) => {
            const equipos = await tx.equipo.findMany({
                where: { purchaseId: id },
                select: { id: true }
            });

            const equipoIds = equipos.map(e => e.id);

            if (equipoIds.length > 0) {
                await tx.equipoHistorial.deleteMany({ where: { equipoId: { in: equipoIds } } });
                await tx.penalidad.deleteMany({ where: { equipoId: { in: equipoIds } } });
                await tx.garantia.deleteMany({ where: { equipoId: { in: equipoIds } } });
                await tx.equipo.deleteMany({ where: { id: { in: equipoIds } } });
            }

            await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
            await tx.purchase.delete({ where: { id } });
        }, {
            maxWait: 30000,
            timeout: 300000
        });

        revalidatePath("/compras");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting purchase:", error);
        return { success: false, error: error.message || "Error al eliminar la compra." };
    }
}

export async function getPurchaseById(id: number) {
    const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
            supplier: true,
            equipos: {
                include: {
                    deviceModel: true,
                    lote: {
                        include: {
                            tecnico: {
                                select: {
                                    id: true,
                                    username: true,
                                    name: true,
                                    profileImage: true
                                }
                            }
                        }
                    },
                    historial: { orderBy: { fecha: 'desc' }, take: 1 }
                },
                orderBy: { id: 'asc' }
            }
        }
    }) as any;

    if (!purchase) return null;

    // Calculate stats based on 'funcionalidad'
    const functionalCount = purchase.equipos.filter((e: any) => e.funcionalidad === 'Funcional').length;
    const nonFunctionalCount = purchase.equipos.filter((e: any) => e.funcionalidad === 'No funcional').length;
    const reviewedCount = functionalCount + nonFunctionalCount;
    const totalEquipments = purchase.totalQuantity;

    // Calculate percentages
    const functionalPercentage = totalEquipments > 0 ? (functionalCount / totalEquipments) * 100 : 0;
    const nonFunctionalPercentage = totalEquipments > 0 ? (nonFunctionalCount / totalEquipments) * 100 : 0;
    const reviewedPercentage = totalEquipments > 0 ? (reviewedCount / totalEquipments) * 100 : 0;

    // Group by model for summary
    const modelSummaryMap = new Map<string, {
        brand: string;
        model: string;
        storage: number;
        color: string | null;
        count: number;
        full_name: string;
    }>();

    purchase.equipos.forEach((eq: any) => {
        if (!eq.deviceModel) return;

        // Create a unique key for grouping (Brand + Model + Storage + Color)
        const key = `${eq.deviceModel.brand}-${eq.deviceModel.modelName}-${eq.deviceModel.storageGb}-${eq.deviceModel.color || 'Sin Color'}`;

        if (!modelSummaryMap.has(key)) {
            modelSummaryMap.set(key, {
                brand: eq.deviceModel.brand,
                model: eq.deviceModel.modelName,
                storage: eq.deviceModel.storageGb,
                color: eq.deviceModel.color,
                count: 0,
                full_name: `${eq.deviceModel.brand} ${eq.deviceModel.modelName} ${eq.deviceModel.storageGb}GB ${eq.deviceModel.color || ''}`.trim()
            });
        }

        modelSummaryMap.get(key)!.count++;
    });

    const modelSummary = Array.from(modelSummaryMap.values()).sort((a, b) => b.count - a.count);

    // === QC BREAKDOWN: agrupar equipos revisados por QC (lote.tecnico) ===
    // Solo contamos equipos revisados (estado con funcionalidad asignada).
    // Equipos aún sin asignar a lote (loteId = null) van a "Pendiente".
    const qcMap = new Map<string, {
        tecnicoId: number;
        username: string;
        name: string | null;
        profileImage: string | null;
        total: number;
        funcionales: number;
        noFuncionales: number;
        equipos: Array<{
            id: number;
            imei: string;
            deviceModel: { brand: string; modelName: string; storageGb: number; color: string | null } | null;
            funcionalidad: string | null;
            estado: string;
            loteCodigo: string | null;
        }>;
    }>();

    let pendingCount = 0;
    let pendingEquipos: Array<any> = [];

    purchase.equipos.forEach((eq: any) => {
        // Equipo revisado = tiene funcionalidad asignada
        const isReviewed = eq.funcionalidad === 'Funcional' || eq.funcionalidad === 'No funcional';
        if (!isReviewed) return;

        const tecnico = eq.lote?.tecnico;
        if (!tecnico) {
            // Raro pero posible: revisado sin lote. Lo agrupamos como "Sin asignar".
            pendingCount++;
            pendingEquipos.push({
                id: eq.id,
                imei: eq.imei,
                deviceModel: eq.deviceModel,
                funcionalidad: eq.funcionalidad,
                estado: eq.estado,
                loteCodigo: eq.lote?.codigo ?? null
            });
            return;
        }

        const key = `qc-${tecnico.id}`;
        if (!qcMap.has(key)) {
            qcMap.set(key, {
                tecnicoId: tecnico.id,
                username: tecnico.username,
                name: tecnico.name,
                profileImage: tecnico.profileImage,
                total: 0,
                funcionales: 0,
                noFuncionales: 0,
                equipos: []
            });
        }
        const entry = qcMap.get(key)!;
        entry.total++;
        if (eq.funcionalidad === 'Funcional') entry.funcionales++;
        else entry.noFuncionales++;
        entry.equipos.push({
            id: eq.id,
            imei: eq.imei,
            deviceModel: eq.deviceModel,
            funcionalidad: eq.funcionalidad,
            estado: eq.estado,
            loteCodigo: eq.lote?.codigo ?? null
        });
    });

    // Ordenar QC por total revisado desc; los equipos de cada QC por IMEI ascendente (orden natural)
    const qcBreakdown = Array.from(qcMap.values())
        .sort((a, b) => b.total - a.total)
        .map(qc => ({
            ...qc,
            equipos: [...qc.equipos].sort((a, b) => a.imei.localeCompare(b.imei, 'es', { numeric: true }))
        }));

    return {
        ...purchase,
        supplier: (purchase as any).supplier,
        equipos: (purchase as any).equipos,
        displayProgress: Math.min(reviewedPercentage, 100),
        functionalCount,
        nonFunctionalCount,
        reviewedCount,
        functionalPercentage,
        nonFunctionalPercentage,
        modelSummary,
        qcBreakdown,
        pendingReview: {
            total: pendingCount,
            equipos: pendingEquipos
        }
    } as any;
}

export async function addManualEquipmentToPurchase(data: z.infer<typeof AddManualEquipmentSchema>) {
    const result = AddManualEquipmentSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: "Datos inválidos para agregar equipos." };
    }

    const { purchaseId, item } = result.data;
    const imeiList = item.imeis.split('\n').map(s => s.trim()).filter(Boolean);

    if (imeiList.length !== item.quantity) {
        return { success: false, error: `La cantidad (${item.quantity}) no coincide con los IMEIs (${imeiList.length}).` };
    }

    const uniqueImeis = new Set<string>();
    for (const imei of imeiList) {
        if (!/^\d{15}$/.test(imei)) {
            return { success: false, error: `IMEI inválido: ${imei}` };
        }
        if (uniqueImeis.has(imei)) {
            return { success: false, error: `IMEI duplicado en el formulario: ${imei}` };
        }
        uniqueImeis.add(imei);
    }

    if (item.modelId === 0 && (!item.brand?.trim() || !item.modelName?.trim() || !item.storageGb || item.storageGb < 1)) {
        return { success: false, error: "Completa marca, modelo y capacidad para crear el nuevo modelo." };
    }

    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            select: { id: true }
        });

        if (!purchase) {
            return { success: false, error: "La compra no existe." };
        }

        const existingEquipos = await prisma.equipo.findMany({
            where: { imei: { in: imeiList } },
            select: { id: true, imei: true, purchaseId: true }
        });
        const existingEquiposMap = new Map(existingEquipos.map(eq => [eq.imei, eq]));

        if (existingEquipos.some(eq => eq.purchaseId === purchaseId)) {
            const duplicatedHere = existingEquipos.find(eq => eq.purchaseId === purchaseId);
            return { success: false, error: `El IMEI ${duplicatedHere?.imei} ya pertenece a esta compra.` };
        }

        await runTransactionWithRetry(async (tx) => {
            let finalModelId = item.modelId;

            if (finalModelId === 0) {
                const existingModel = await tx.deviceModel.findFirst({
                    where: {
                        brand: item.brand!.trim(),
                        modelName: item.modelName!.trim(),
                        storageGb: item.storageGb,
                        color: item.color || null
                    }
                });

                if (existingModel) {
                    finalModelId = existingModel.id;
                } else {
                    const newModel = await tx.deviceModel.create({
                        data: {
                            brand: item.brand!.trim(),
                            modelName: item.modelName!.trim(),
                            storageGb: item.storageGb!,
                            color: item.color || null,
                            imageFilename: 'iphone-placeholder.png'
                        }
                    });
                    finalModelId = newModel.id;
                }
            }

            const deviceModel = await tx.deviceModel.findUnique({ where: { id: finalModelId } });
            if (!deviceModel) {
                throw new Error("No se encontró el modelo seleccionado.");
            }

            const historyToCreate: Prisma.EquipoHistorialCreateManyInput[] = [];

            for (const imei of imeiList) {
                const existing = existingEquiposMap.get(imei);
                const commonData = {
                    marca: deviceModel.brand,
                    modelo: deviceModel.modelName,
                    storageGb: deviceModel.storageGb,
                    color: deviceModel.color,
                    deviceModelId: deviceModel.id,
                    purchaseId,
                    estado: 'En Inventario' as const,
                    fechaIngreso: new Date(),
                    grado: null,
                    observacion: null,
                    funcionalidad: null,
                    loteId: null,
                    userId: null
                };

                if (existing) {
                    await tx.equipo.update({
                        where: { id: existing.id },
                        data: commonData
                    });
                    historyToCreate.push({
                        equipoId: existing.id,
                        estado: 'En Inventario',
                        fecha: new Date(),
                        observacion: `Reintegrado manualmente a Compra #${purchaseId}.`
                    });
                } else {
                    const created = await tx.equipo.create({
                        data: {
                            imei,
                            ...commonData
                        },
                        select: { id: true }
                    });
                    historyToCreate.push({
                        equipoId: created.id,
                        estado: 'En Inventario',
                        fecha: new Date(),
                        observacion: `Ingreso manual a Compra #${purchaseId}.`
                    });
                }
            }

            if (historyToCreate.length > 0) {
                await tx.equipoHistorial.createMany({ data: historyToCreate });
            }

            const allEquips = await tx.equipo.findMany({
                where: { purchaseId },
                select: { deviceModelId: true }
            });

            await tx.purchaseItem.deleteMany({ where: { purchaseId } });

            const modelCounts = new Map<number, number>();
            allEquips.forEach(eq => {
                if (eq.deviceModelId) {
                    modelCounts.set(eq.deviceModelId, (modelCounts.get(eq.deviceModelId) || 0) + 1);
                }
            });

            if (modelCounts.size > 0) {
                await tx.purchaseItem.createMany({
                    data: Array.from(modelCounts.entries()).map(([modelId, quantity]) => ({
                        purchaseId,
                        deviceModelId: modelId,
                        quantity
                    }))
                });
            }

            await tx.purchase.update({
                where: { id: purchaseId },
                data: { totalQuantity: allEquips.length }
            });
        });

        revalidatePath(`/compras/${purchaseId}`);
        revalidatePath("/compras");

        return {
            success: true,
            message: `${item.quantity} equipo(s) agregados correctamente a la compra.`
        };
    } catch (error: any) {
        console.error("Error in addManualEquipmentToPurchase:", error);
        return { success: false, error: error.message || "Error al agregar equipos manualmente." };
    }
}

// Helper for parsing iPhone model string (ported from Python logic)
function parseIphoneModel(s: string) {
    s = s.trim().replace(/\s+/g, ' ');

    let gb: number | null = null;
    let modelPart = "";
    let colorPart: string | null = null;

    // 1) Try TB
    const tbMatch = s.match(/(\d+)\s*TB/i);
    if (tbMatch) {
        gb = parseInt(tbMatch[1]) * 1024;
        modelPart = s.substring(0, tbMatch.index).trim();
        colorPart = s.substring(tbMatch.index! + tbMatch[0].length).trim();
    } else {
        // 2) Try GB
        const gbMatch = s.match(/(\d+)\s*GB?/i);
        if (gbMatch) {
            gb = parseInt(gbMatch[1]);
            modelPart = s.substring(0, gbMatch.index).trim();
            colorPart = s.substring(gbMatch.index! + gbMatch[0].length).trim();
        } else {
            // 3) Fallback: Last number
            const tokens = s.split(' ');
            let lastNumIdx = -1;
            for (let i = 0; i < tokens.length; i++) {
                if (/^\d+$/.test(tokens[i])) lastNumIdx = i;
            }
            if (lastNumIdx !== -1) {
                gb = parseInt(tokens[lastNumIdx]);
                modelPart = tokens.slice(0, lastNumIdx).join(', ').trim();
                colorPart = tokens.slice(lastNumIdx + 1).join(', ').trim();
            }
        }
    }

    // Extract color if not found yet
    if (!colorPart && modelPart) {
        const commonColors = [
            'Space Black', 'Space Gray', 'Midnight Green', 'Pacific Blue', 'Sierra Blue',
            'Deep Purple', 'Rose Gold', 'Jet Black', 'Matte Black', 'Alpine Green',
            'Graphite', 'Starlight', 'Midnight', 'Black', 'White', 'Red', 'Blue',
            'Green', 'Yellow', 'Purple', 'Gold', 'Silver', 'Pink', 'Coral',
            'Titanium', 'Natural Titanium', 'Blue Titanium', 'White Titanium',
            'Black Titanium', 'Desert Titanium', 'Gray', 'Grey', 'Teal', 'Ultramarine',
            'Deep Blue', 'Cosmic Orange'
        ].sort((a, b) => b.length - a.length);

        for (const col of commonColors) {
            const regex = new RegExp(`\\b${col}$`, 'i');
            const match = modelPart.match(regex);
            if (match) {
                colorPart = match[0];
                modelPart = modelPart.replace(regex, '').trim();
                break;
            }
        }
    }

    if (colorPart && ['nan', 'none', '', '-', '.', 'na', 'n/a'].includes(colorPart.toLowerCase())) {
        colorPart = null;
    }

    return { modelName: modelPart, storageGb: gb || 0, color: colorPart };
}

export async function addEquipmentToPurchase(formData: FormData) {
    console.log(">>> [DEBUG] EXECUTING addEquipmentToPurchase - OPTIMIZED VERSION <<<");
    const file = formData.get("file") as File;
    const purchaseId = Number(formData.get("purchaseId"));
    const importType = formData.get("importType") as string; // 'standard' or 'iphone'

    if (!file || !purchaseId) {
        return { success: false, error: "Archivo o ID de compra faltante." };
    }

    try {
        const ExcelJS = require('exceljs');
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(Buffer.from(buffer));
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) return { success: false, error: "No se encontró la hoja en el archivo." };

        // Detectar formato del Excel de forma robusta. Soportamos 3 casos:
        //   A) Header real: la primera fila contiene la palabra "IMEI"
        //      (en cualquier columna). Usamos esos headers tal cual.
        //   B) Sin header, columnas en orden: la primera celda (col 1)
        //      es VACÍA o texto no-IMEI, y la col 2 trae el primer IMEI
        //      (15 dígitos). Interpretamos col 1 = vacía/header-fantasma,
        //      col 2 = IMEI, col 3 = Modelo, etc.
        //   C) Sin header, columnas en orden directo: la col 1 ya trae
        //      un IMEI válido. Interpretamos col 1 = IMEI, col 2 = Modelo.
        // Esto arregla el bug donde Excels con la primera columna vacía
        // (Libro1.xlsx: ['', IMEI, Modelo]) se rechazaban con "IMEI vacío".
        const firstRow = worksheet.getRow(1);
        const firstRowTexts: string[] = [];
        firstRow.eachCell((cell: any, colNumber: number) => {
            firstRowTexts[colNumber] = (cell.text || '').toString().trim();
        });
        const hasRealHeader = firstRowTexts.some(
            (t) => t && /imei/i.test(t.replace(/\s+/g, ''))
        );
        const isFirstCellImei = /^\d{15}$/.test(firstRowTexts[1] || '');

        const rows: any[] = [];
        const headers: string[] = [];

        if (hasRealHeader) {
            // Caso A: header real
            firstRow.eachCell((cell: any, colNumber: number) => {
                headers[colNumber] = cell.text.trim();
            });
            worksheet.eachRow((row: any, rowNumber: number) => {
                if (rowNumber === 1) return;
                const rowData: any = {};
                row.eachCell((cell: any, colNumber: number) => {
                    rowData[headers[colNumber]] = cell.text;
                });
                rows.push(rowData);
            });
        } else {
            // Sin header: decidimos el orden de columnas.
            // Si la primera celda YA es un IMEI válido → orden directo.
            // Si la primera celda está vacía y la segunda es un IMEI → hay
            // una columna fantasma a la izquierda, saltamos col 1.
            let startCol = 1;
            let col1IsEmpty = !firstRowTexts[1];
            let col2IsImei = /^\d{15}$/.test(firstRowTexts[2] || '');
            if (col1IsEmpty && col2IsImei) {
                startCol = 2;
            } else if (!isFirstCellImei && !col1IsEmpty) {
                // Celda 1 tiene texto que no es IMEI ni header. Probable
                // header "fantasma" en col 1. Marcamos la fila 1 como dato
                // pero advertimos: si empieza con número, no es header.
                startCol = 1;
            }
            const syntheticHeaders =
                importType === 'iphone'
                    ? ['IMEI', 'Modelo']
                    : ['IMEI', 'Marca', 'Modelo', 'GB', 'Color'];
            syntheticHeaders.forEach((h, i) => {
                headers[startCol + i] = h;
            });
            worksheet.eachRow((row: any, _rowNumber: number) => {
                const rowData: any = {};
                let hasAnyValue = false;
                row.eachCell((cell: any, colNumber: number) => {
                    const h = headers[colNumber];
                    if (h) {
                        rowData[h] = cell.text;
                        if (cell.text && String(cell.text).trim()) {
                            hasAnyValue = true;
                        }
                    }
                });
                if (hasAnyValue) rows.push(rowData);
            });
        }

        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId }
        });

        if (!purchase) return { success: false, error: "Compra no encontrada." };

        const errors: string[] = [];
        const validatedRows: any[] = [];
        const imeisSeen = new Set<string>();

        // Phase 1: Validation and Data Collection (Outside Transaction)
        for (const [index, row] of rows.entries()) {
            const imei = String(row['IMEI'] || '').trim();
            if (!imei) {
                errors.push(`Fila ${index + 2}: IMEI vacío.`);
                continue;
            }
            if (!/^\d{15}$/.test(imei)) {
                errors.push(`Fila ${index + 2}: IMEI inválido (debe tener 15 dígitos): ${imei}`);
                continue;
            }
            if (imeisSeen.has(imei)) {
                errors.push(`Fila ${index + 2}: IMEI duplicado en el archivo: ${imei}`);
                continue;
            }
            imeisSeen.add(imei);

            let brand = "";
            let modelName = "";
            let storageGb = 0;
            let color: string | null = null;

            if (importType === 'iphone') {
                const rawModel = String(row['Modelo'] || '').trim();
                const parsed = parseIphoneModel(rawModel);
                // El modo "Smart iPhone" existe para que el usuario suba Excels
                // sin tener que poner la marca. Pero NO debemos forzar "Apple"
                // si el modelo claramente no es iPhone (ej. "Galaxy S22 5G 256GB"),
                // porque guardaríamos "Apple Galaxy" en la BD.
                const isIphoneModel = /iphone/i.test(rawModel);
                const isIphoneByGen = /^\s*(1[1-6])\s+(pro\s*max|pro|plus|mini)\b/i.test(rawModel);
                if (isIphoneModel || isIphoneByGen) {
                    brand = "Apple";
                } else {
                    // Heurística de marca en 3 capas (orden de prioridad):
                    //   1) Si el texto contiene "Galaxy" → Samsung (los Galaxy
                    //      SIEMPRE son Samsung aunque el usuario no lo escriba).
                    //   2) Si empieza con una marca conocida del listado, la
                    //      usamos tal cual.
                    //   3) Si empieza con "Pixel" → Google.
                    //   4) Fallback: primer token del modelo.
                    if (/\bgalaxy\b/i.test(rawModel)) {
                        brand = "Samsung";
                    } else if (/\bpixel\b/i.test(rawModel)) {
                        brand = "Google";
                    } else {
                        const knownBrands = ['Samsung', 'Xiaomi', 'Huawei', 'Motorola',
                            'Google', 'OnePlus', 'Sony', 'LG', 'Nokia', 'Realme', 'Oppo'];
                        const firstWord = rawModel.split(/\s+/)[0] || '';
                        const matchedBrand = knownBrands.find(
                            (b) => b.toLowerCase() === firstWord.toLowerCase()
                        );
                        brand = matchedBrand || firstWord;
                    }
                }
                modelName = parsed.modelName;
                storageGb = parsed.storageGb;
                color = parsed.color;
            } else {
                brand = String(row['Marca'] || '').trim();
                modelName = String(row['Modelo'] || '').trim();
                const gbVal = String(row['GB'] || '').replace(/GB/i, '').trim();
                storageGb = parseInt(gbVal);
                color = row['Color'] ? String(row['Color']).trim() : null;
            }

            if (!brand || !modelName || isNaN(storageGb)) {
                errors.push(`Fila ${index + 2}: Datos incompletos (Marca: ${brand}, Modelo: ${modelName}, GB: ${storageGb})`);
                continue;
            }

            validatedRows.push({
                imei,
                brand,
                modelName,
                storageGb,
                color
            });
        }

        if (errors.length > 0) {
            const errorMsg = `Se encontraron ${errors.length} errores:\n` + errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...y ${errors.length - 5} más.` : '');
            return { success: false, error: errorMsg };
        }

        // Phase 2: Batch Fetching and Model Preparation (Outside Transaction)
        const allImeis = validatedRows.map(r => r.imei);
        const existingEquipos = await prisma.equipo.findMany({
            where: { imei: { in: allImeis } },
            select: { id: true, imei: true, purchaseId: true }
        });
        const existingEquiposMap = new Map(existingEquipos.map(e => [e.imei, e]));

        // Pre-fetch all referenced models
        const modelNames = [...new Set(validatedRows.map(r => r.modelName))];
        const allModels = await prisma.deviceModel.findMany({
            where: { modelName: { in: modelNames } }
        });

        const getModelKey = (r: any) => `${r.brand}|${r.modelName}|${r.storageGb}|${r.color?.toLowerCase() || 'null'}`;
        const modelsCache = new Map<string, any>();
        allModels.forEach(m => modelsCache.set(`${m.brand}|${m.modelName}|${m.storageGb}|${m.color?.toLowerCase() || 'null'}`, m));

        // 2.1: Pre-create missing models OUTSIDE the main transaction
        for (const row of validatedRows) {
            const key = getModelKey(row);
            if (!modelsCache.has(key)) {
                const newModel = await prisma.deviceModel.create({
                    data: {
                        brand: row.brand,
                        modelName: row.modelName,
                        storageGb: row.storageGb,
                        color: row.color,
                        imageFilename: 'iphone-placeholder.png'
                    }
                });
                modelsCache.set(key, newModel);
            }
        }

        let equipmentsNew = 0;
        let equipmentsReintegrated = 0;

        // Phase 3: Main Transaction (Writing data)
        await runTransactionWithRetry(async (tx) => {
            const historyToCreate: any[] = [];

            // 3.1: Handle Reintegration (Update)
            const reintegrateRows = validatedRows.filter(r =>
                existingEquiposMap.has(r.imei) && existingEquiposMap.get(r.imei)!.purchaseId !== purchaseId
            );

            for (const row of reintegrateRows) {
                const existing = existingEquiposMap.get(row.imei)!;
                const deviceModel = modelsCache.get(getModelKey(row));

                await tx.equipo.update({
                    where: { id: existing.id },
                    data: {
                        marca: row.brand,
                        modelo: row.modelName,
                        storageGb: row.storageGb,
                        color: row.color,
                        deviceModelId: deviceModel!.id,
                        purchaseId: purchaseId,
                        estado: 'En Inventario',
                        fechaIngreso: new Date(),
                        grado: null,
                        observacion: null,
                        funcionalidad: null,
                        loteId: null,
                        userId: null
                    }
                });

                historyToCreate.push({
                    equipoId: existing.id,
                    estado: 'En Inventario',
                    fecha: new Date(),
                    observacion: `Reintegrado por Excel a Compra #${purchaseId}.`
                });
            }
            equipmentsReintegrated = reintegrateRows.length;

            // 3.2: Handle New (Batch Create)
            const newRows = validatedRows.filter(r => !existingEquiposMap.has(r.imei));
            if (newRows.length > 0) {
                const equipmentsToInsert = [];
                for (const row of newRows) {
                    const deviceModel = modelsCache.get(getModelKey(row));

                    equipmentsToInsert.push({
                        imei: row.imei,
                        marca: row.brand,
                        modelo: row.modelName,
                        storageGb: row.storageGb,
                        color: row.color,
                        deviceModelId: deviceModel!.id,
                        purchaseId: purchaseId,
                        estado: 'En Inventario',
                        fechaIngreso: new Date()
                    });
                }

                await tx.equipo.createMany({ data: equipmentsToInsert });
                equipmentsNew = newRows.length;

                // Fetch new IDs to create history
                const newlyCreated = await tx.equipo.findMany({
                    where: { imei: { in: newRows.map(r => r.imei) } },
                    select: { id: true }
                });

                newlyCreated.forEach(eq => {
                    historyToCreate.push({
                        equipoId: eq.id,
                        estado: 'En Inventario',
                        fecha: new Date(),
                        observacion: `Ingreso por Excel a Compra #${purchaseId}.`
                    });
                });
            }

            // 3.3: Batch Create History
            if (historyToCreate.length > 0) {
                await tx.equipoHistorial.createMany({ data: historyToCreate });
            }

            // Phase 4: Sync Purchase Statistics (Batch)
            const allEquips = await tx.equipo.findMany({
                where: { purchaseId: purchaseId },
                select: { deviceModelId: true }
            });

            await tx.purchaseItem.deleteMany({ where: { purchaseId: purchaseId } });

            const modelCounts = new Map<number, number>();
            allEquips.forEach(eq => {
                if (eq.deviceModelId) {
                    modelCounts.set(eq.deviceModelId, (modelCounts.get(eq.deviceModelId) || 0) + 1);
                }
            });

            const purchaseItemsToCreate = Array.from(modelCounts.entries()).map(([modelId, count]) => ({
                purchaseId: purchaseId,
                deviceModelId: modelId,
                quantity: count
            }));

            if (purchaseItemsToCreate.length > 0) {
                await tx.purchaseItem.createMany({ data: purchaseItemsToCreate });
            }

            await tx.purchase.update({
                where: { id: purchaseId },
                data: { totalQuantity: allEquips.length }
            });

        });

        revalidatePath(`/compras/${purchaseId}`);
        revalidatePath("/compras");

        return {
            success: true,
            message: `Proceso completado. Agregados: ${equipmentsNew}, Reintegrados: ${equipmentsReintegrated}.`
        };

    } catch (error: any) {
        console.error("Error in addEquipmentToPurchase:", error);
        return { success: false, error: error.message || "Error al procesar el archivo Excel." };
    }
}

/**
 * Checks if all equipos in a purchase have been approved by admin (estado Revisado).
 * Called after admin approves a lote. Sends Excel via Telegram when 100% complete.
 */
export async function checkAndNotifyPurchaseComplete(purchaseId: number) {
    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: {
                supplier: true,
                equipos: {
                    include: { deviceModel: true }
                }
            }
        });

        if (!purchase || purchase.equipos.length === 0) return;

        const TERMINAL_STATES = ['Revisado', 'Entregado', 'Vendido'];
        const total = purchase.equipos.length;
        const approved = (purchase.equipos as any[]).filter((e) => TERMINAL_STATES.includes(e.estado)).length;

        if (approved < total) return;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Compra ' + purchaseId);

        sheet.columns = [
            { header: 'IMEI', key: 'imei', width: 20 },
            { header: 'Marca', key: 'marca', width: 15 },
            { header: 'Modelo', key: 'modelo', width: 20 },
            { header: 'Almacenamiento', key: 'storage', width: 16 },
            { header: 'Color', key: 'color', width: 14 },
            { header: 'Funcionalidad', key: 'funcionalidad', width: 16 },
            { header: 'Estado', key: 'estado', width: 14 },
            { header: 'Grado', key: 'grado', width: 10 },
            { header: 'Observacion', key: 'observacion', width: 30 },
        ];

        sheet.getRow(1).eachCell((cell: any) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            cell.alignment = { horizontal: 'center' };
        });

        const sortedEquipos = sortEquipments(purchase.equipos);
        for (const eq of sortedEquipos) {
            const storageStr = eq.storageGb
                ? eq.storageGb + 'GB'
                : (eq.deviceModel?.storageGb ? eq.deviceModel.storageGb + 'GB' : '');
            sheet.addRow({
                imei: eq.imei,
                marca: eq.marca || eq.deviceModel?.brand || '',
                modelo: eq.modelo || eq.deviceModel?.modelName || '',
                storage: storageStr,
                color: eq.color || eq.deviceModel?.color || '',
                funcionalidad: eq.funcionalidad || '',
                estado: eq.estado,
                grado: eq.grado || '',
                observacion: eq.observacion || '',
            });
        }

        const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
        const supplierName = (purchase as any).supplier?.name || 'Proveedor';
        const now = new Date();
        const fecha = new Intl.DateTimeFormat('es-DO', {
            timeZone: 'America/Santo_Domingo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(now).replace(/\//g, '-');
        const safeName = supplierName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = 'Compra_' + purchaseId + '_' + safeName + '_' + fecha + '.xlsx';

        const funcionales = (purchase.equipos as any[]).filter((e) => e.funcionalidad === 'Funcional').length;
        const noFuncionales = (purchase.equipos as any[]).filter((e) => e.funcionalidad === 'No funcional').length;

        const caption = '<b>Compra #' + purchaseId + ' - REVISION COMPLETA</b>\n' +
            'Proveedor: <b>' + supplierName + '</b>\n' +
            'Total equipos: <b>' + total + '</b>\n' +
            'Funcionales: <b>' + funcionales + '</b>\n' +
            'No funcionales: <b>' + noFuncionales + '</b>\n' +
            'Fecha: ' + fecha;

        await sendTelegramDocument(buffer, filename, caption);
        console.log('[Purchase] Compra #' + purchaseId + ' completa - Excel enviado por Telegram.');
    } catch (error: any) {
        console.error('[Purchase] Error en checkAndNotifyPurchaseComplete #' + purchaseId + ':', error);
    }
}
