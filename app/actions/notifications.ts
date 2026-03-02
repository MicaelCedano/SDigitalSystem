
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const notifications = await prisma.notification.findMany({
        where: {
            tecnicoId: Number(session.user.id)
        },
        orderBy: {
            fecha: 'desc'
        },
        include: {
            tecnico: {
                select: {
                    name: true,
                    username: true,
                    profileImage: true
                }
            }
        }
    });

    const loteCodes = notifications
        .map((n) => n.loteCodigo)
        .filter((code): code is string => Boolean(code));

    const lotes = loteCodes.length > 0
        ? await prisma.lote.findMany({
            where: { codigo: { in: loteCodes } },
            select: {
                codigo: true,
                tecnico: {
                    select: {
                        name: true,
                        username: true,
                        profileImage: true
                    }
                }
            }
        })
        : [];

    const loteByCode = new Map(lotes.map((lote) => [lote.codigo, lote.tecnico]));

    const extractedNames = notifications
        .map((n) => n.mensaje.match(/El técnico\s+(.+?)\s+ha/i)?.[1]?.trim())
        .filter((name): name is string => Boolean(name));

    const potentialActors = extractedNames.length > 0
        ? await prisma.user.findMany({
            where: {
                OR: [
                    { name: { in: extractedNames } },
                    { username: { in: extractedNames } }
                ]
            },
            select: {
                name: true,
                username: true,
                profileImage: true
            }
        })
        : [];

    const actorByName = new Map<string, { profileImage: string | null }>();
    potentialActors.forEach((actor) => {
        if (actor.name) actorByName.set(actor.name.toLowerCase(), { profileImage: actor.profileImage });
        actorByName.set(actor.username.toLowerCase(), { profileImage: actor.profileImage });
    });

    return notifications.map((notification) => {
        const loteActor = notification.loteCodigo ? loteByCode.get(notification.loteCodigo) : undefined;
        const extractedName = notification.mensaje.match(/El técnico\s+(.+?)\s+ha/i)?.[1]?.trim().toLowerCase();
        const parsedActor = extractedName ? actorByName.get(extractedName) : undefined;

        return {
            ...notification,
            actorProfileImage: loteActor?.profileImage || parsedActor?.profileImage || notification.tecnico?.profileImage || null
        };
    });
}

export async function markAsRead(notificationId: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { leida: true }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function markAllAsRead() {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    try {
        await prisma.notification.updateMany({
            where: {
                tecnicoId: Number(session.user.id),
                leida: false
            },
            data: { leida: true }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getUnreadCount() {
    const session = await getServerSession(authOptions);
    if (!session) return 0;

    return await prisma.notification.count({
        where: {
            tecnicoId: Number(session.user.id),
            leida: false
        }
    });
}

export async function sendTestNotification() {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autenticado" };

    try {
        await prisma.notification.create({
            data: {
                tecnicoId: Number(session.user.id),
                tipo: "LOGRO",
                titulo: "¡Prueba de PWA Exitosa!",
                mensaje: "Esta es una notificación de prueba para tu nueva App. ¡Todo funciona correctamente!",
                fecha: new Date(),
                leida: false
            }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al crear notificación" };
    }
}
