"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, Purchase, Supplier, PurchaseItem, Equipo, DeviceModel } from "@prisma/client";
import { z } from "zod";

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

        const blockingImeis = existingEquipos
            .filter(eq => !['Despachado', 'Entregado', 'Vendido', 'Dañado', 'No Funcional', 'Usado para Piezas', 'Revisado'].includes(eq.estado))
            .map(eq => eq.imei);

        if (blockingImeis.length > 0) {
            return { success: false, error: `Los siguientes IMEIs ya están en inventario: ${blockingImeis.slice(0, 5).join(', ')}${blockingImeis.length > 5 ? '...' : ''}` };
        }

        const existingMap = new Map(existingEquipos.map(eq => [eq.imei, eq]));

        // Transaction Phase
        const finalPurchase = await runTransactionWithRetry(async (tx) => {
            // 1. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    supplierId,
                    purchaseDate: new Date(purchaseDate),
                    totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
                    estado: 'borrador'
                }
            });

            const equipmentsToCreate: any[] = [];
            const historyToCreate: any[] = [];
            const equipmentsToUpdate: { id: number, data: any }[] = [];

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
                        equipmentsToUpdate.push({ id: existing.id, data: equipoData });
                        historyToCreate.push({
                            equipoId: existing.id,
                            estado: 'En Inventario',
                            fecha: new Date(),
                            observacion: `Equipo reintegrado en compra #${purchase.id}.`
                        });
                    } else {
                        equipmentsToCreate.push({ imei, ...equipoData });
                    }
                }
            }

            // 3. Batch Operations
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

            if (equipmentsToUpdate.length > 0) {
                for (const update of equipmentsToUpdate) {
                    await tx.equipo.update({
                        where: { id: update.id },
                        data: update.data
                    });
                }
            }

            if (historyToCreate.length > 0) {
                await tx.equipoHistorial.createMany({ data: historyToCreate });
            }

            return purchase;
        });

        revalidatePath("/compras");
        revalidatePath("/compras/borradores");
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
    // Mimic the Python logic: Active separated from History
    const purchases = await prisma.purchase.findMany({
        where: { estado: { not: "borrador" } },
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
        // Count completed equipments
        const completedCount = await prisma.equipo.count({
            where: {
                purchaseId: purchase.id,
                estado: { in: ['Revisado', 'Entregado', 'Vendido'] } // Check Python's exact logic
                // Python: Equipo.estado.in_(['Revisado', 'Entregado'])
                // But Python also checks if validation is >= 100% to move to history
            }
        });

        const percentage = totalEquipments > 0 ? (completedCount / totalEquipments) * 100 : 0;

        const enhancedPurchase: any = {
            ...purchase,
            supplier: (purchase as any).supplier,
            displayProgress: Math.min(percentage, 100),
            completedCount,
            originalTotal: totalEquipments
        };

        if (percentage < 100) {
            active.push(enhancedPurchase);
        } else {
            history.push(enhancedPurchase);
        }
    }

    return { active, history };
}

export async function getDraftPurchases() {
    const drafts = await prisma.purchase.findMany({
        where: { estado: "borrador" },
        orderBy: { id: 'desc' },
        include: {
            supplier: true,
            _count: {
                select: { equipos: true }
            }
        }
    }) as any[];
    return drafts;
}

export async function deleteDraft(id: number) {
    try {
        // Delete related items and equipments first (cascade usually handles this but safer to be manual if unsure)
        await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
        await prisma.equipo.deleteMany({ where: { purchaseId: id } });
        await prisma.purchase.delete({ where: { id } });

        revalidatePath("/compras/borradores");
        return { success: true };
    } catch (error) {
        console.error("Error deleting draft:", error);
        return { success: false, error: "Error al eliminar el borrador." };
    }
}

export async function activateDraft(id: number) {
    try {
        await prisma.purchase.update({
            where: { id },
            data: { estado: 'activa' }
        });
        revalidatePath("/compras/borradores");
        revalidatePath("/compras");
        return { success: true };
    } catch (error) {
        console.error("Error activating draft:", error);
        return { success: false, error: "Error al activar la compra." };
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
        modelSummary
    } as any;
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
                modelPart = tokens.slice(0, lastNumIdx).join(' ').trim();
                colorPart = tokens.slice(lastNumIdx + 1).join(' ').trim();
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

        const rows: any[] = [];
        const headers: string[] = [];

        worksheet.getRow(1).eachCell((cell: any, colNumber: number) => {
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
                brand = "Apple";
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

            // 3.1: Handle Existing (Updates)
            for (const row of validatedRows) {
                const existingEntry = existingEquiposMap.get(row.imei);
                if (!existingEntry || existingEntry.purchaseId === purchaseId) continue;

                const deviceModel = modelsCache.get(getModelKey(row));

                await tx.equipo.update({
                    where: { id: existingEntry.id },
                    data: {
                        marca: row.brand,
                        modelo: row.modelName,
                        storageGb: row.storageGb,
                        color: row.color,
                        deviceModelId: deviceModel!.id,
                        purchaseId: purchaseId,
                        estado: 'En Inventario',
                        fechaIngreso: new Date()
                    }
                });

                historyToCreate.push({
                    equipoId: existingEntry.id,
                    estado: 'En Inventario',
                    fecha: new Date(),
                    observacion: `Reintegrado a Compra #${purchaseId} vía Excel.`
                });
                equipmentsReintegrated++;
            }

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






