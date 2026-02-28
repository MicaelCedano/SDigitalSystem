"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateEquipment(id: number, data: any) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const currentEquip = await prisma.equipo.findUnique({
            where: { id }
        });

        if (!currentEquip) {
            return { success: false, error: "Equipo no encontrado" };
        }

        // Update equipment
        const updated = await prisma.equipo.update({
            where: { id },
            data: {
                imei: data.imei,
                marca: data.marca,
                modelo: data.modelo,
                storageGb: Number(data.storageGb),
                color: data.color,
                grado: data.grado,
                funcionalidad: data.funcionalidad,
                observacion: data.observacion,
                estado: data.estado
            }
        });

        // Create history entry if status changed or just a general update
        await prisma.equipoHistorial.create({
            data: {
                equipoId: id,
                fecha: new Date(),
                estado: updated.estado,
                userId: Number(session.user.id),
                observacion: `Actualización manual: ${data.observacion || 'Sin observaciones'}`,
                loteId: currentEquip.loteId
            }
        });

        revalidatePath("/equipos");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating equipment:", error);
        return { success: false, error: "Error al actualizar equipo" };
    }
}

export async function getEquipmentFullDetails(id: number) {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    try {
        const details = await prisma.equipo.findUnique({
            where: { id },
            include: {
                deviceModel: true,
                purchase: {
                    include: {
                        supplier: true
                    }
                },
                user: {
                    select: {
                        username: true,
                        name: true,
                        role: true,
                        profileImage: true
                    }
                },
                historial: {
                    orderBy: { fecha: 'desc' },
                    include: {
                        user: {
                            select: {
                                username: true,
                                name: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        return details;
    } catch (error) {
        console.error("Error fetching full details:", error);
        return null;
    }
}

export async function getQCUsers() {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    return prisma.user.findMany({
        where: { role: 'control_calidad' },
        select: { id: true, name: true, username: true }
    });
}

export async function assignToQualityControl(equipoIds: number[], qcId: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const adminId = Number(session.user.id);
        const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
        const adminName = adminUser?.name || adminUser?.username || "Admin";

        const qcUser = await prisma.user.findUnique({ where: { id: qcId } });
        if (!qcUser || qcUser.role !== 'control_calidad') {
            return { success: false, error: "Usuario de Control de Calidad inválido" };
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const qcName = qcUser.name || qcUser.username;
        const baseCode = `LOTE-${qcName}-${dateStr}`;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const lastLote = await prisma.lote.findFirst({
            where: {
                tecnicoId: qcUser.id,
                fecha: { gte: todayStart, lte: todayEnd },
                codigo: { startsWith: baseCode }
            },
            orderBy: { id: 'desc' }
        });

        let suffix = 1;
        if (lastLote) {
            const parts = lastLote.codigo.split('-');
            const lastSuffix = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSuffix)) suffix = lastSuffix + 1;
        }

        const codigoLote = `${baseCode}-${suffix}`;

        await prisma.$transaction(async (tx) => {
            const lote = await tx.lote.create({
                data: {
                    codigo: codigoLote,
                    fecha: new Date(),
                    tecnicoId: qcUser.id,
                    estado: 'Abierto'
                }
            });

            await tx.equipo.updateMany({
                where: { id: { in: equipoIds }, estado: 'En Inventario' },
                data: {
                    userId: qcUser.id,
                    loteId: lote.id,
                    estado: 'En Revisión'
                }
            });

            const historiales = equipoIds.map(id => ({
                equipoId: id,
                userId: adminId,
                estado: 'En Revisión',
                fecha: new Date(),
                observacion: `Asignado a Control de Calidad: ${qcName} - Lote: ${codigoLote}`
            }));

            await tx.equipoHistorial.createMany({
                data: historiales
            });

            await tx.notification.create({
                data: {
                    tecnicoId: qcUser.id,
                    tipo: 'lote_asignado',
                    titulo: 'Nuevo Lote Asignado',
                    mensaje: `Se te ha asignado el lote ${codigoLote} con ${equipoIds.length} equipos.`,
                    loteCodigo: codigoLote,
                    leida: false,
                    fecha: new Date()
                }
            });
        });

        revalidatePath('/equipos');
        return { success: true, message: `Equipos asignados a lote ${codigoLote}` };
    } catch (e: any) {
        console.error("Error assignToQC:", e);
        return { success: false, error: "Error interno al asignar equipos." };
    }
}
