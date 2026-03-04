import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery, escapeHTML } from "@/lib/telegram";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Log update for debugging
        console.log("[Telegram Webhook] Recibido:", JSON.stringify(body, null, 2));

        if (body.message && body.message.text) {
            const { text, chat, from, message_id } = body.message;

            if (text.startsWith('/start') || text.startsWith('/ayuda')) {
                const helpMsg = `👋 <b>Asistente de SDigital</b>\n\n` +
                    `Usa el botón azul <b>"🛍️ CREAR PEDIDO"</b> que aparece abajo a la izquierda para gestionar tus pedidos de forma rápida y segura.`;

                const buttons = [
                    [
                        {
                            text: "📝 ABRIR FORMULARIO",
                            web_app: { url: "https://sdigitalsystem.vercel.app/pedidos/nuevo" }
                        }
                    ]
                ];

                await sendTelegramMessage(helpMsg, buttons);
                return NextResponse.json({ ok: true });
            }

            if (text.startsWith('/pedido ')) {
                const content = text.replace('/pedido ', '').trim();
                const parts = content.split('|');

                if (content.length === 0 || parts.length < 2) {
                    const helpMsg = `✨ <b>Usa nuestra Mini App para crear pedidos más rápido:</b>`;
                    const buttons = [
                        [
                            {
                                text: "📝 PONGA LA ORDEN",
                                web_app: { url: "https://sdigitalsystem.vercel.app/pedidos/nuevo" }
                            }
                        ]
                    ];
                    await sendTelegramMessage(helpMsg, buttons);
                    return NextResponse.json({ ok: true });
                }

                const clienteNombre = parts[0].trim();
                const detalle = parts[1].trim();

                try {
                    // Try to find a user to associate this with (using the first admin for now or linking by telegram)
                    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
                    if (!admin) throw new Error("No hay un administrador configurado para procesar este pedido.");

                    const result = await prisma.$transaction(async (tx) => {
                        const count = await (tx as any).order.count();
                        const year = new Date().getFullYear();
                        const codigo = `PED-${year}-${(count + 1).toString().padStart(4, '0')}`;

                        const order = await (tx as any).order.create({
                            data: {
                                codigo,
                                clienteNombre,
                                detalle,
                                usuarioId: admin.id,
                                status: 'PENDIENTE'
                            }
                        });

                        await (tx as any).orderHistory.create({
                            data: {
                                orderId: order.id,
                                estadoAnterior: null,
                                estadoNuevo: 'PENDIENTE',
                                usuarioId: admin.id
                            }
                        });

                        return order;
                    });

                    const successMsg = `✅ <b>PEDIDO CREADO: ${result.codigo}</b>\n\n` +
                        `👤 <b>Por:</b> ${from.first_name} (Telegram)\n` +
                        `🏢 <b>Cliente:</b> ${clienteNombre}\n` +
                        `📝 <b>Detalle:</b>\n${detalle}`;

                    const buttons = [
                        [{ text: "✅ ACEPTAR PEDIDO", callback_data: `update_status:${result.id}:PROCESO` }]
                    ];

                    await sendTelegramMessage(successMsg, buttons);
                } catch (e: any) {
                    await sendTelegramMessage(`❌ <b>Error al crear pedido:</b> ${e.message}`);
                }
                return NextResponse.json({ ok: true });
            }
        }

        if (body.callback_query) {
            const { id, data, message, from } = body.callback_query;

            if (data && data.startsWith("update_status:")) {
                const [_, orderIdStr, newStatus] = data.split(":");
                const orderId = parseInt(orderIdStr);

                if (isNaN(orderId)) {
                    await answerCallbackQuery(id, "Error: ID de pedido inválido");
                    return NextResponse.json({ ok: true });
                }

                // Get order to check current status and details
                const order = await (prisma as any).order.findUnique({
                    where: { id: orderId },
                    include: {
                        usuario: true,
                    }
                });

                if (!order) {
                    await answerCallbackQuery(id, "Error: Pedido no encontrado");
                    return NextResponse.json({ ok: true });
                }

                if (order.status === newStatus) {
                    await answerCallbackQuery(id, `El pedido ya está en estado ${newStatus}`);
                    return NextResponse.json({ ok: true });
                }

                // Get a system user ID to log the action (using the first admin found)
                const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
                const actionUserId = admin?.id || order.usuarioId;

                // Perform the update
                await prisma.$transaction(async (tx) => {
                    await (tx as any).order.update({
                        where: { id: orderId },
                        data: { status: newStatus }
                    });

                    await (tx as any).orderHistory.create({
                        data: {
                            orderId: orderId,
                            estadoAnterior: order.status,
                            estadoNuevo: newStatus,
                            usuarioId: actionUserId
                        }
                    });
                });

                // Prepare next buttons
                let nextButtons: any[] = [];
                if (newStatus === 'PROCESO') {
                    nextButtons = [[{ text: "📦 MARCAR COMO LISTO", callback_data: `update_status:${orderId}:LISTO` }]];
                } else if (newStatus === 'LISTO') {
                    nextButtons = [[{ text: "🚚 ENTREGAR MERCANCIA", callback_data: `update_status:${orderId}:ENTREGADO` }]];
                }

                // Re-escape and format the original message text to include the update
                // We remove the old prompt if present or append new info
                const originalText = message.text || "";
                const cleanText = originalText.split('\n\n✅')[0]; // Remove previous update info if exists

                const statusLabels: Record<string, string> = {
                    'PROCESO': 'EN PROCESO 🔧',
                    'LISTO': 'LISTO PARA ENTREGA ✅',
                    'ENTREGADO': 'ENTREGADO 🚚'
                };

                const updatedText = `${originalText}\n\n📍 <b>Actualizado a:</b> ${statusLabels[newStatus] || newStatus}\n👤 <b>Por:</b> ${from.first_name || 'Usuario'} (Telegram)`;

                await editTelegramMessage(message.message_id, updatedText, nextButtons.length > 0 ? nextButtons : null);
                await answerCallbackQuery(id, `Pedido ${order.codigo} actualizado a ${newStatus}`);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("[Telegram Webhook] Error crítico:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
