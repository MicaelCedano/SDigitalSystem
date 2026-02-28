"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getConversations() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return [];

    const userId = Number(session.user.id);

    // Asegurar que existe la conversación global
    let globalConv = await prisma.conversation.findFirst({
        where: { isGlobal: true }
    });

    if (!globalConv) {
        globalConv = await prisma.conversation.create({
            data: {
                isGlobal: true,
                updatedAt: new Date()
            }
        });
    }

    const convs = await prisma.conversation.findMany({
        where: {
            OR: [
                { isGlobal: true },
                { participants: { some: { id: userId } } }
            ]
        },
        include: {
            participants: {
                where: {
                    NOT: { id: userId }
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    profileImage: true,
                    role: true
                }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                    sender: { select: { username: true, name: true } }
                }
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            read: false,
                            senderId: { not: userId }
                        }
                    }
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return convs;
}

export async function getMessages(conversationId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return [];

    return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    profileImage: true
                }
            }
        }
    });
}

export async function sendMessage(conversationId: number, content: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { success: false, error: "No autenticado" };

    const userId = Number(session.user.id);

    try {
        const message = await prisma.message.create({
            data: {
                content,
                conversationId,
                senderId: userId
            }
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Aquí se dispararía el evento de Pusher en el futuro

        revalidatePath("/chat");
        return { success: true, message };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Error al enviar mensaje" };
    }
}

export async function startOrGetConversation(otherUserId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return null;

    const userId = Number(session.user.id);

    try {
        // Buscar conversación privada existente (excluir el chat global)
        const existing = await prisma.conversation.findFirst({
            where: {
                isGlobal: false,
                AND: [
                    { participants: { some: { id: userId } } },
                    { participants: { some: { id: otherUserId } } }
                ]
            }
        });

        if (existing) return existing.id;

        // Si no existe, crearla
        const created = await prisma.conversation.create({
            data: {
                isGlobal: false,
                participants: {
                    connect: [{ id: userId }, { id: otherUserId }]
                }
            }
        });

        return created.id;
    } catch (error) {
        console.error("Error starting conversation:", error);
        return null;
    }
}

export async function searchUsers(query: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return [];

    const userId = Number(session.user.id);

    return await prisma.user.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { username: { contains: query, mode: 'insensitive' } }
                    ]
                },
                { NOT: { id: userId } }
            ]
        },
        select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            role: true
        },
        take: 5
    });
}

export async function getUnreadMessageCount() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return 0;

    const userId = Number(session.user.id);

    return await prisma.message.count({
        where: {
            read: false,
            senderId: { not: userId },
            conversation: {
                OR: [
                    { isGlobal: true },
                    { participants: { some: { id: userId } } }
                ]
            }
        }
    });
}

export async function markMessagesAsRead(conversationId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return;

    const userId = Number(session.user.id);

    await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            read: false
        },
        data: { read: true }
    });
}
