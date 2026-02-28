"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SupplierSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    contactInfo: z.string().optional(),
});

export async function getSuppliers() {
    return await prisma.supplier.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function createSupplier(data: z.infer<typeof SupplierSchema>) {
    const result = SupplierSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        const existing = await prisma.supplier.findFirst({
            where: { name: result.data.name }
        });

        if (existing) {
            return { success: false, error: "Ya existe un proveedor con ese nombre." };
        }

        await prisma.supplier.create({
            data: {
                name: result.data.name,
                contactInfo: result.data.contactInfo
            }
        });

        revalidatePath("/compras/proveedores");
        return { success: true };
    } catch (error) {
        console.error("Error creating supplier:", error);
        return { success: false, error: "Error al crear el proveedor." };
    }
}

export async function updateSupplier(id: number, data: z.infer<typeof SupplierSchema>) {
    const result = SupplierSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message };
    }

    try {
        const existing = await prisma.supplier.findFirst({
            where: {
                name: result.data.name,
                id: { not: id }
            }
        });

        if (existing) {
            return { success: false, error: "Ya existe otro proveedor con ese nombre." };
        }

        await prisma.supplier.update({
            where: { id },
            data: {
                name: result.data.name,
                contactInfo: result.data.contactInfo
            }
        });

        revalidatePath("/compras/proveedores");
        return { success: true };
    } catch (error) {
        console.error("Error updating supplier:", error);
        return { success: false, error: "Error al actualizar el proveedor." };
    }
}

export async function deleteSupplier(id: number) {
    try {
        // Check for associated purchases
        const purchaseCount = await prisma.purchase.count({
            where: { supplierId: id }
        });

        if (purchaseCount > 0) {
            return { success: false, error: "No se puede eliminar porque tiene compras asociadas." };
        }

        await prisma.supplier.delete({
            where: { id }
        });

        revalidatePath("/compras/proveedores");
        return { success: true };
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return { success: false, error: "Error al eliminar el proveedor." };
    }
}
