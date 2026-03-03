"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CreateOrderSchema = z.object({
    clienteId: z.coerce.number().optional(),
    observaciones: z.string().optional(),
    items: z.array(z.object({
        modelId: z.coerce.number(),
        cantidad: z.coerce.number(),
    })).min(1, "Debe agregar al menos un modelo"),
});

export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const result = CreateOrderSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: "Datos inválidos: " + result.error.issues.map(i => i.message).join(", ") };
    }

    const { clienteId, observaciones, items } = result.data;

    try {
        const order = await prisma.$transaction(async (tx) => {
            // Generate a code (e.g., PED-2024-001)
            const count = await tx.order.count();
            const year = new Date().getFullYear();
            const codigo = `PED-${year}-${(count + 1).toString().padStart(4, '0')}`;

            const newOrder = await tx.order.create({
                data: {
                    codigo,
                    clienteId: clienteId || null,
                    usuarioId: Number(session.user.id),
                    observaciones,
                    status: 'PENDIENTE',
                    items: {
                        create: items.map(item => ({
                            modelId: item.modelId,
                            cantidad: item.cantidad,
                        }))
                    },
                    historial: {
                        create: {
                            estadoNuevo: 'PENDIENTE',
                            usuarioId: Number(session.user.id),
                            fecha: new Date()
                        }
                    }
                }
            });
            return newOrder;
        });

        revalidatePath("/pedidos");
        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error("Error creating order:", error);
        return { success: false, error: error.message || "Error interno al crear el pedido" };
    }
}

export async function updateOrderStatus(orderId: number, newStatus: string, observacion?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) return { success: false, error: "Pedido no encontrado" };

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: newStatus }
            });

            await tx.orderHistory.create({
                data: {
                    orderId,
                    estadoAnterior: order.status,
                    estadoNuevo: newStatus,
                    usuarioId: Number(session.user.id),
                    fecha: new Date()
                }
            });
        });

        revalidatePath("/pedidos");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Error al actualizar el estado" };
    }
}

export async function getOrders() {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { fechaCreacion: 'desc' },
            include: {
                cliente: true,
                usuario: true,
                items: {
                    include: {
                        model: true
                    }
                },
                historial: {
                    include: {
                        usuario: true
                    },
                    orderBy: { fecha: 'desc' }
                }
            }
        });
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

export async function getMerchandiseArrivals() {
    try {
        // Get recent purchases and their items
        const purchases = await prisma.purchase.findMany({
            where: {
                estado: { not: 'borrador' }
            },
            take: 5,
            orderBy: { id: 'desc' },
            include: {
                supplier: true,
                items: {
                    include: {
                        deviceModel: true
                    }
                }
            }
        });

        return purchases;
    } catch (error) {
        console.error("Error fetching arrivals:", error);
        return [];
    }
}
