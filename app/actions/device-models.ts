"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { findAndAssignImageToDeviceModel } from "./image-service";

const DeviceModelSchema = z.object({
    brand: z.string().min(1, "La marca es requerida"),
    modelName: z.string().min(1, "El modelo es requerido"),
    storageGb: z.number().min(1, "El almacenamiento debe ser mayor a 0"),
    color: z.string().optional(),
});

export async function getDeviceModels() {
    return await prisma.deviceModel.findMany({
        orderBy: [
            { brand: 'asc' },
            { modelName: 'asc' },
            { storageGb: 'asc' }
        ]
    });
}

export async function createDeviceModel(data: z.infer<typeof DeviceModelSchema>) {
    const result = DeviceModelSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        const existing = await prisma.deviceModel.findFirst({
            where: {
                brand: result.data.brand,
                modelName: result.data.modelName,
                storageGb: result.data.storageGb,
                color: result.data.color
            }
        });

        if (existing) {
            return { success: false, error: "Ya existe un modelo con estas características." };
        }

        const newModel = await prisma.deviceModel.create({
            data: {
                brand: result.data.brand,
                modelName: result.data.modelName,
                storageGb: result.data.storageGb,
                color: result.data.color
            }
        });

        // Trigger background image search
        // We don't await this to keep UI responsive? Or maybe we DO await it to show the image immediately.
        // User said "verifying how it was in python". Python did it inline.
        try {
            await findAndAssignImageToDeviceModel(newModel.id);
        } catch (e) {
            console.error("Image fetch error:", e);
        }

        revalidatePath("/compras/modelos");
        return { success: true };
    } catch (error) {
        console.error("Error creating device model:", error);
        return { success: false, error: "Error al crear el modelo." };
    }
}

export async function updateDeviceModel(id: number, data: z.infer<typeof DeviceModelSchema>) {
    const result = DeviceModelSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        // Check conflicts
        const existing = await prisma.deviceModel.findFirst({
            where: {
                brand: result.data.brand,
                modelName: result.data.modelName,
                storageGb: result.data.storageGb,
                color: result.data.color,
                id: { not: id }
            }
        });

        if (existing) {
            return { success: false, error: "Ya existe otro modelo con estas características." };
        }

        const oldModel = await prisma.deviceModel.findUnique({ where: { id } });

        const updatedModel = await prisma.deviceModel.update({
            where: { id },
            data: {
                brand: result.data.brand,
                modelName: result.data.modelName,
                storageGb: result.data.storageGb,
                color: result.data.color
            }
        });

        // If color/model changed, refresh image?
        if (oldModel && (oldModel.color !== updatedModel.color || oldModel.modelName !== updatedModel.modelName)) {
            await findAndAssignImageToDeviceModel(updatedModel.id, true); // true = force refresh? Or just try?
            // Actually, if model changed deeply, we probably want a new image.
        }

        revalidatePath("/compras/modelos");
        return { success: true };
    } catch (error) {
        console.error("Error updating device model:", error);
        return { success: false, error: "Error al actualizar el modelo." };
    }
}

export async function deleteDeviceModel(id: number) {
    try {
        // Check dependencies (items, equipos)
        const itemsCount = await prisma.purchaseItem.count({ where: { deviceModelId: id } });
        const equiposCount = await prisma.equipo.count({ where: { deviceModelId: id } });

        if (itemsCount > 0 || equiposCount > 0) {
            return { success: false, error: "No se puede eliminar porque tiene equipos o compras asociados." };
        }

        await prisma.deviceModel.delete({ where: { id } });
        revalidatePath("/compras/modelos");
        return { success: true };
    } catch (error) {
        console.error("Error deleting model:", error);
        return { success: false, error: "Error al eliminar el modelo." };
    }
}
