"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTelegramMessage, escapeHTML } from "@/lib/telegram";

const CreateOrderSchema = z.object({
    clienteNombre: z.string().optional().nullable(),
    clienteId: z.coerce.number().optional().nullable(),
    detalle: z.string().min(5, "El detalle del pedido debe tener al menos 5 caracteres"),
    observaciones: z.string().optional().nullable(),
});

export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const result = CreateOrderSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: "Datos inválidos: " + result.error.issues.map(i => i.message).join(", ") };
    }

    const { clienteId, clienteNombre, detalle, observaciones } = result.data;

    try {
        const order = await prisma.$transaction(async (tx) => {
            // Generate a code (e.g., PED-2024-001)
            const count = await tx.order.count();
            const year = new Date().getFullYear();
            const codigo = `PED-${year}-${(count + 1).toString().padStart(4, '0')}`;

            const newOrder = await tx.order.create({
                data: {
                    codigo,
                    clienteNombre: clienteNombre || null,
                    clienteId: clienteId || null,
                    usuarioId: Number(session.user.id),
                    detalle,
                    observaciones: observaciones || "",
                    status: 'PENDIENTE',
                    historial: {
                        create: {
                            estadoNuevo: 'PENDIENTE',
                            usuarioId: Number(session.user.id),
                            fecha: new Date()
                        }
                    }
                }
            });

            // Notify admins
            const admins = await tx.user.findMany({
                where: { role: 'admin' },
                select: { id: true }
            });

            if (admins.length > 0) {
                await tx.notification.createMany({
                    data: admins.map(admin => ({
                        tecnicoId: admin.id,
                        tipo: 'pedido_nuevo',
                        titulo: 'Nuevo Pedido Solicitado',
                        mensaje: `El técnico ${session.user.name || session.user.username} ha solicitado mercancía para: ${clienteNombre || 'Cliente General'}.`,
                        fromUserId: Number(session.user.id),
                        redirectUrl: '/pedidos',
                        fecha: new Date(),
                        leida: false
                    }))
                });
            }

            return newOrder;
        });

        revalidatePath("/pedidos");

        // Send Telegram Notification
        const telegramMsg = `📦 <b>NUEVO PEDIDO: ${order.codigo}</b>\n\n` +
            `👤 <b>Técnico:</b> ${escapeHTML(session.user.name || session.user.username)}\n` +
            `🏢 <b>Cliente:</b> ${escapeHTML(clienteNombre || 'Cliente General')}\n` +
            `📝 <b>Detalle:</b>\n${escapeHTML(detalle)}\n` +
            `${observaciones ? `ℹ️ <b>Nota:</b> ${escapeHTML(observaciones)}` : ''}`;

        const buttons = [
            [
                { text: "✅ ACEPTAR PEDIDO", callback_data: `update_status:${order.id}:PROCESO` }
            ]
        ];

        console.log(`[Orders] Enviando notificación a Telegram para pedido: ${order.codigo}`);
        await sendTelegramMessage(telegramMsg, buttons);

        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error("Error creating order:", error);
        return { success: false, error: error.message || "Error interno al crear el pedido" };
    }
}

export async function updateOrderStatus(orderId: number, newStatus: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const isAdmin = session.user.role === 'admin';
    const isAlmacen = session.user.role === 'almacen';
    const canManage = session.user.canManageOrders === true;

    if (!isAdmin && !isAlmacen && !canManage) {
        return { success: false, error: "No tienes permiso para gestionar estados de pedidos" };
    }

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

            // Notify the user who created the order
            await tx.notification.create({
                data: {
                    tecnicoId: order.usuarioId,
                    tipo: 'pedido_actualizado',
                    titulo: `Pedido ${newStatus.toLowerCase()}`,
                    mensaje: `Tu pedido ${order.codigo} ahora está en estado: ${newStatus}.`,
                    fromUserId: Number(session.user.id),
                    redirectUrl: '/pedidos',
                    fecha: new Date(),
                    leida: false
                }
            });
        });

        revalidatePath("/pedidos");

        // Send Telegram Notification for Status Change
        const telegramMsg = `🔄 <b>ACTUALIZACION DE PEDIDO: ${order.codigo}</b>\n\n` +
            `🏢 <b>Cliente:</b> ${escapeHTML(order.clienteNombre || 'Cliente General')}\n` +
            `📍 <b>Nuevo Estado:</b> <code>${escapeHTML(newStatus)}</code>\n` +
            `👤 <b>Actualizado por:</b> ${escapeHTML(session.user.name || session.user.username)}`;

        console.log(`[Orders] Enviando actualización a Telegram para pedido: ${order.codigo}`);
        await sendTelegramMessage(telegramMsg);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Error al actualizar el estado" };
    }
}

export async function deleteOrder(orderId: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
        return { success: false, error: "No tienes permiso para eliminar pedidos" };
    }

    try {
        await prisma.order.delete({
            where: { id: orderId }
        });

        revalidatePath("/pedidos");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting order:", error);
        return { success: false, error: "Error al eliminar el pedido" };
    }
}

export async function testTelegram() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
        return { success: false, error: "No autorizado" };
    }

    const testMsg = `🧪 <b>PRUEBA DE CONEXIÓN</b>\n\n` +
        `Si ves esto en Vercel, las variables están configuradas correctamente.\n` +
        `⏰ <b>Hora:</b> ${new Date().toLocaleTimeString()}`;

    return await sendTelegramMessage(testMsg);
}

export async function getOrders() {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { fechaCreacion: 'desc' },
            include: {
                cliente: true,
                usuario: true,
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
