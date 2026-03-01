"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Purchase, Supplier, PurchaseItem, Equipo, DeviceModel } from "@prisma/client";
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
    displayProgress: number;
    completedCount: number;
    originalTotal: number;
};

export async function createPurchase(data: z.infer<typeof CreatePurchaseSchema>) {
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
        const finalPurchase = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    supplierId,
                    purchaseDate: new Date(purchaseDate),
                    totalQuantity: items.reduce((acc, item) => acc + item.quantity, 0),
                    estado: 'borrador'
                }
            });

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

                // Create/Update Equipos
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
                        color: deviceModel.color
                    };

                    if (existing) {
                        // Reintegration logic: Reset fields for new revision but keep historical record
                        await tx.equipo.update({
                            where: { imei },
                            data: {
                                ...equipoData,
                                grado: null,
                                observacion: null,
                                funcionalidad: null,
                                loteId: null, // Dissociate from any previous lote
                                userId: null  // Dissociate from any previous technician
                            }
                        });

                        // Add Entry to history
                        await tx.equipoHistorial.create({
                            data: {
                                equipoId: existing.id,
                                estado: 'En Inventario',
                                fecha: new Date(),
                                observacion: `Equipo reintegrado en compra #${purchase.id}. Listo para nueva revisión.`
                            }
                        });
                    } else {
                        const newEq = await tx.equipo.create({ data: { imei, ...equipoData } });

                        // Initial history for new equipment
                        await tx.equipoHistorial.create({
                            data: {
                                equipoId: newEq.id,
                                estado: 'En Inventario',
                                fecha: new Date(),
                                observacion: `Ingreso inicial por compra #${purchase.id}.`
                            }
                        });
                    }
                }
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
    });

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

        const enhancedPurchase: PurchaseWithProgress = {
            ...purchase,
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
    });
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
    });

    if (!purchase) return null;

    // Calculate stats based on 'funcionalidad'
    const functionalCount = purchase.equipos.filter(e => e.funcionalidad === 'Funcional').length;
    const nonFunctionalCount = purchase.equipos.filter(e => e.funcionalidad === 'No funcional').length;
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

    purchase.equipos.forEach(eq => {
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
        displayProgress: Math.min(reviewedPercentage, 100),
        functionalCount,
        nonFunctionalCount,
        reviewedCount,
        functionalPercentage,
        nonFunctionalPercentage,
        modelSummary
    };
}
