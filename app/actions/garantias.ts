"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAchievements } from "./achievements";

export async function getGarantias(filters?: any) {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const where: any = {};
    if (filters?.estado && filters.estado !== 'all') where.estado = filters.estado;
    if (filters?.tecnicoId && filters.tecnicoId !== 'all') where.tecnicoId = Number(filters.tecnicoId);

    if (session.user.role === 'admin') {
        return await prisma.garantia.findMany({
            where,
            include: {
                tecnico: { select: { id: true, name: true, username: true } },
                admin: { select: { id: true, name: true, username: true } }
            },
            orderBy: { fechaRecepcion: 'desc' }
        });
    }

    if (session.user.role === 'tecnico_garantias') {
        where.tecnicoId = Number(session.user.id);
        return await prisma.garantia.findMany({
            where,
            include: {
                tecnico: { select: { id: true, name: true, username: true } },
                admin: { select: { id: true, name: true, username: true } }
            },
            orderBy: { fechaRecepcion: 'desc' }
        });
    }

    return await prisma.garantia.findMany({
        where,
        orderBy: { fechaRecepcion: 'desc' }
    });
}

export async function getGarantiaById(id: number) {
    return await prisma.garantia.findUnique({
        where: { id },
        include: {
            tecnico: { select: { id: true, name: true, username: true } },
            admin: { select: { id: true, name: true, username: true } },
            supplier: true,
            historialCambios: {
                include: {
                    usuario: { select: { name: true, username: true } }
                },
                orderBy: { fechaCambio: 'desc' }
            }
        }
    });
}

export async function getGarantiasStats(tecnicoId?: number) {
    const where: any = tecnicoId ? { tecnicoId } : {};
    
    const total = await prisma.garantia.count({ where });
    const pendientesAsignacion = await prisma.garantia.count({ where: tecnicoId ? { ...where, estado: 'Pendiente de Asignación' } : { estado: 'Pendiente de Asignación' } });
    const asignadas = await prisma.garantia.count({ where: { ...where, estado: 'Asignado' } });
    const enReparacion = await prisma.garantia.count({ where: { ...where, estado: 'En Reparación' } });
    const reparadas = await prisma.garantia.count({ where: { ...where, estado: 'Reparado' } });
    const entregadas = await prisma.garantia.count({ where: { ...where, estado: 'Entregado' } });

    let balance = 0;
    if (tecnicoId) {
        const wallet = await prisma.wallet.findFirst({
            where: { tecnicoId },
            include: { accounts: { where: { nombre: "Principal" } } }
        });
        balance = wallet?.accounts[0]?.saldo || 0;
    }

    return {
        total,
        pendientesAsignacion: tecnicoId ? 0 : pendientesAsignacion, // No tiene sentido pendientes de asignación para un técnico específico
        asignadas,
        enReparacion,
        reparadas,
        entregadas,
        balance
    };
}

export async function getTecnicosGarantias() {
    return await prisma.user.findMany({
        where: { 
            role: 'tecnico_garantias',
            isActive: true 
        },
        select: { 
            id: true, 
            name: true, 
            username: true,
            configuracionPagos: {
                where: { activo: true },
                take: 1
            },
            wallet: {
                include: {
                    accounts: {
                        where: { nombre: "Principal" },
                        take: 1
                    }
                }
            }
        }
    });
}

export async function getSuppliers() {
    return await prisma.supplier.findMany({
        orderBy: { name: "asc" }
    });
}

export async function createGarantia(data: {
    cliente: string;
    imeiSn: string;
    marca?: string;
    modelo?: string;
    problema: string;
    observaciones?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const count = await prisma.garantia.count();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const codigo = `GAR-${dateStr}-${count + 1}`;

        const garantia = await prisma.garantia.create({
            data: {
                codigo,
                cliente: data.cliente,
                imeiSn: data.imeiSn,
                marca: data.marca || null,
                modelo: data.modelo || null,
                problema: data.problema,
                observaciones: data.observaciones || null,
                estado: 'Pendiente de Asignación',
                adminId: Number(session.user.id),
                fechaRecepcion: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId: garantia.id,
                estadoNuevo: 'Pendiente de Asignación',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Garantía creada'
            }
        });

        revalidatePath("/garantias");
        return { success: true, garantia };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateGarantia(id: number, data: {
    cliente: string;
    imeiSn: string;
    marca?: string;
    modelo?: string;
    problema: string;
    observaciones?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const current = await prisma.garantia.findUnique({ where: { id } });
        if (!current) return { success: false, error: "Garantía no encontrada" };

        const updated = await prisma.garantia.update({
            where: { id },
            data: {
                cliente: data.cliente,
                imeiSn: data.imeiSn,
                marca: data.marca || null,
                modelo: data.modelo || null,
                problema: data.problema,
                observaciones: data.observaciones || null
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId: id,
                estadoAnterior: current.estado ?? undefined,
                estadoNuevo: current.estado ?? 'Desconocido',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Información de garantía editada'
            }
        });

        revalidatePath(`/garantias/${id}`);
        revalidatePath("/garantias");
        return { success: true, garantia: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function asignarGarantia(garantiaId: number, tecnicoId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const tecnico = await prisma.user.findUnique({ where: { id: tecnicoId } });
        if (!tecnico || !tecnico.isActive) {
            return { success: false, error: "Técnico inválido o inactivo" };
        }

        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                tecnicoId,
                estado: 'Asignado',
                fechaAsignacion: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: 'Pendiente de Asignación',
                estadoNuevo: 'Asignado',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Garantía asignada'
            }
        });

        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function iniciarReparacion(garantiaId: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                estado: 'En Reparación',
                fechaReparacion: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: 'Asignado',
                estadoNuevo: 'En Reparación',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Técnico inició la reparación'
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function completarReparacion(garantiaId: number, data: { diagnostico: string, solucionAplicada: string }) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                diagnostico: data.diagnostico,
                solucionAplicada: data.solucionAplicada,
                estado: 'Pendiente de Aprobación',
                fechaReparacion: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: 'En Reparación',
                estadoNuevo: 'Pendiente de Aprobación',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Técnico completó la reparación'
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function aprobarGarantia(garantiaId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                estado: 'Reparado'
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: 'Pendiente de Aprobación',
                estadoNuevo: 'Reparado',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Administrador aprobó la reparación'
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rechazarGarantia(garantiaId: number, razon: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const currentGarantia = await prisma.garantia.findUnique({ where: { id: garantiaId } });
        if (!currentGarantia) return { success: false, error: "Garantía no encontrada" };

        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                estado: 'En Reparación'
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: 'Pendiente de Aprobación',
                estadoNuevo: 'En Reparación',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: `Rechazado por Admin: ${razon}`
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function cancelarGarantia(garantiaId: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const currentGarantia = await prisma.garantia.findUnique({ where: { id: garantiaId } });
        if (!currentGarantia) return { success: false, error: "Garantía no encontrada" };

        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                estado: 'Pendiente de Asignación',
                tecnicoId: null
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: currentGarantia.estado ?? undefined,
                estadoNuevo: 'Pendiente de Asignación',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Garantía cancelada/reiniciada'
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function eliminarGarantia(id: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        await prisma.garantiaHistorial.deleteMany({ where: { garantiaId: id } });
        await prisma.garantia.delete({ where: { id } });

        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function marcarComoEntregado(id: number, observacion?: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const current = await prisma.garantia.findUnique({ where: { id: id } });
        if (!current) return { success: false, error: "Garantía no encontrada" };

        await prisma.garantia.update({
            where: { id: id },
            data: {
                estado: "Pendiente Confirmación Entrega",
                fechaEntrega: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId: id,
                estadoAnterior: current.estado ?? undefined,
                estadoNuevo: "Pendiente Confirmación Entrega",
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: observacion || "Garantía marcada como entregada - Pendiente confirmación"
            }
        });

        revalidatePath(`/garantias/${id}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function confirmarEntrega(id: number, observacion?: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const current = await prisma.garantia.findUnique({ where: { id: id } });
        if (!current) return { success: false, error: "Garantía no encontrada" };

        await prisma.garantia.update({
            where: { id: id },
            data: {
                estado: "Entregado"
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId: id,
                estadoAnterior: current.estado ?? undefined,
                estadoNuevo: "Entregado",
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: observacion || "Entrega confirmada por administrador"
            }
        });

        if (current.tecnicoId) {
            await checkAchievements(current.tecnicoId);
        }

        revalidatePath(`/garantias/${id}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function enviarAProveedor(garantiaId: number, supplierId: number, observaciones?: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const current = await prisma.garantia.findUnique({ where: { id: garantiaId } });
        if (!current) return { success: false, error: "Garantía no encontrada" };

        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                estado: "Enviado a Proveedor",
                supplierId,
                fechaEnvioProveedor: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: current.estado ?? undefined,
                estadoNuevo: "Enviado a Proveedor",
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: observaciones || "Enviado a proveedor para revisión"
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function recibirDeProveedor(garantiaId: number, resultado: string, diagnostico?: string, observaciones?: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const current = await prisma.garantia.findUnique({ where: { id: garantiaId } });
        if (!current) return { success: false, error: "Garantía no encontrada" };

        await prisma.garantia.update({
            where: { id: garantiaId },
            data: {
                estado: resultado,
                diagnostico: diagnostico || current.diagnostico,
                observaciones: observaciones || current.observaciones,
                fechaRecepcionProveedor: new Date()
            }
        });

        await prisma.garantiaHistorial.create({
            data: {
                garantiaId,
                estadoAnterior: "Enviado a Proveedor",
                estadoNuevo: resultado,
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: `Recibido de proveedor - Resultado: ${resultado}. ${observaciones || ""}`
            }
        });

        revalidatePath(`/garantias/${garantiaId}`);
        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getEquipoHistorialByImei(imeiSn: string) {
    return await prisma.equipoHistorial.findMany({
        where: { equipo: { imei: imeiSn } },
        include: {
            user: { select: { name: true, username: true } },
            lote: { select: { codigo: true } }
        },
        orderBy: { fecha: "desc" }
    });
}

export async function getConfiguracionPago(tecnicoId: number) {
    return await prisma.tecnicoGarantiaPago.findFirst({
        where: { tecnicoId }
    });
}

export async function saveConfiguracionPago(tecnicoId: number, data: { montoPorReparacion: number, activo: boolean }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return { success: false, error: "No autorizado" };

    try {
        const current = await prisma.tecnicoGarantiaPago.findFirst({
            where: { tecnicoId }
        });

        if (current) {
            await prisma.tecnicoGarantiaPago.update({
                where: { id: current.id },
                data: {
                    montoPorReparacion: data.montoPorReparacion,
                    activo: data.activo,
                    adminId: Number(session.user.id),
                    fechaConfiguracion: new Date()
                }
            });
        } else {
            await prisma.tecnicoGarantiaPago.create({
                data: {
                    tecnicoId,
                    montoPorReparacion: data.montoPorReparacion,
                    activo: data.activo,
                    adminId: Number(session.user.id),
                    fechaConfiguracion: new Date()
                }
            });
        }

        revalidatePath("/garantias/pagos");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getTecnicosPaymentsInfo() {
    const tecnicos = await prisma.user.findMany({
        where: { 
            role: "tecnico_garantias",
            isActive: true
        },
        select: {
            id: true,
            name: true,
            username: true,
            configuracionPagos: { where: { activo: true } },
            wallet: { include: { accounts: { where: { nombre: "Principal" } } } }
        }
    });

    return tecnicos.map(t => ({
        id: t.id,
        name: t.name,
        username: t.username,
        config: t.configuracionPagos[0] || null,
        balance: t.wallet[0]?.accounts[0]?.saldo || 0
    }));
}

export async function createGarantiasLote(data: {
    cliente: string;
    tecnicoId?: number;
    observaciones?: string;
    items: {
        imeiSn: string;
        marca?: string;
        modelo?: string;
        problema: string;
    }[]
}) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Lote Record
            const countLotes = await tx.garantiaLoteIngreso.count();
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const codigoLote = `LOTE-GAR-${dateStr}-${countLotes + 1}`;

            const lote = await tx.garantiaLoteIngreso.create({
                data: {
                    codigo: codigoLote,
                    observaciones: data.observaciones || "Ingreso masivo",
                    cantidadInicial: data.items.length,
                    createdById: Number(session.user.id),
                    fechaCreacion: new Date()
                }
            });

            const warrantiesCreated = [];
            let currentWarrantyCount = await tx.garantia.count();

            for (const item of data.items) {
                currentWarrantyCount++;
                const codigoGarantia = `GAR-${dateStr}-${currentWarrantyCount}`;

                const estado = data.tecnicoId ? 'En Reparación' : 'Pendiente de Asignación';

                const garantia = await tx.garantia.create({
                    data: {
                        codigo: codigoGarantia,
                        cliente: data.cliente,
                        imeiSn: item.imeiSn,
                        marca: item.marca || null,
                        modelo: item.modelo || null,
                        problema: item.problema,
                        observaciones: `Importado en lote ${codigoLote}`,
                        estado: estado,
                        adminId: Number(session.user.id),
                        tecnicoId: data.tecnicoId || null,
                        loteIngresoId: lote.id,
                        fechaRecepcion: new Date(),
                        fechaAsignacion: data.tecnicoId ? new Date() : null
                    }
                });

                await tx.garantiaHistorial.create({
                    data: {
                        garantiaId: garantia.id,
                        estadoNuevo: estado,
                        userId: Number(session.user.id),
                        fechaCambio: new Date(),
                        observacion: `Creado en lote ${codigoLote}${data.tecnicoId ? ' y asignado automáticamente' : ''}`
                    }
                });

                warrantiesCreated.push(garantia);
            }

            return { lote, warranties: warrantiesCreated };
        });

        revalidatePath("/garantias");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error creating batch warranties:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a labor-only batch job.
 */
export async function createTrabajoLote(data: {
    descripcion: string;
    cantidadEquipos: number;
    montoPorEquipo: number;
    observaciones?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const count = await prisma.trabajoGarantiaLote.count();
        const codigo = `TL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${count + 1}`;

        const trabajo = await prisma.trabajoGarantiaLote.create({
            data: {
                codigo,
                descripcion: data.descripcion,
                cantidadEquipos: data.cantidadEquipos,
                montoPorEquipo: data.montoPorEquipo,
                montoTotal: data.cantidadEquipos * data.montoPorEquipo,
                estado: 'Creado',
                observaciones: data.observaciones || null,
                adminId: Number(session.user.id),
                fechaCreacion: new Date(),
                equiposEntregados: 0
            }
        });

        revalidatePath("/garantias");
        return { success: true, trabajo };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Assign a batch job to a technician.
 */
export async function asignarTrabajoLote(trabajoId: number, tecnicoId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        await prisma.trabajoGarantiaLote.update({
            where: { id: trabajoId },
            data: {
                tecnicoId,
                estado: 'Asignado',
                fechaAsignacion: new Date()
            }
        });

        await prisma.trabajoGarantiaLoteHistorial.create({
            data: {
                trabajoId,
                estadoNuevo: 'Asignado',
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: 'Trabajo asignado a técnico'
            }
        });

        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Technician confirms partial or full delivery of a batch job.
 */
export async function confirmarEntregaTrabajoLote(trabajoId: number, cantidad: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "No autorizado" };

    try {
        const trabajo = await prisma.trabajoGarantiaLote.findUnique({ where: { id: trabajoId } });
        if (!trabajo) return { success: false, error: "Trabajo no encontrado" };

        const nuevosEntregados = (trabajo.equiposEntregados || 0) + cantidad;
        const finalizado = nuevosEntregados >= trabajo.cantidadEquipos;

        await prisma.trabajoGarantiaLote.update({
            where: { id: trabajoId },
            data: {
                equiposEntregados: nuevosEntregados,
                estado: finalizado ? 'Completado' : 'En Progreso',
                fechaEntrega: finalizado ? new Date() : null
            }
        });

        await prisma.trabajoGarantiaLoteHistorial.create({
            data: {
                trabajoId,
                estadoAnterior: trabajo.estado,
                estadoNuevo: finalizado ? 'Completado' : 'En Progreso',
                equiposAnteriores: trabajo.equiposEntregados,
                equiposNuevos: nuevosEntregados,
                userId: Number(session.user.id),
                fechaCambio: new Date(),
                observacion: `Entrega de ${cantidad} equipos.`
            }
        });

        revalidatePath("/garantias");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create a 'Conduce' (Manifest) for a set of warranties/equipments.
 */
export async function createConduce(data: {
    cliente: string;
    tipoConduce: 'individual' | 'masivo';
    garantiaIds: number[];
    observaciones?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const count = await tx.conduceEnvio.count();
            const codigo = `COND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${count + 1}`;

            const conduce = await tx.conduceEnvio.create({
                data: {
                    codigoConduce: codigo,
                    tipoConduce: data.tipoConduce,
                    cliente: data.cliente,
                    totalEquipos: data.garantiaIds.length,
                    observaciones: data.observaciones || null,
                    generadoPorId: Number(session.user.id),
                    fechaGeneracion: new Date(),
                    estado: 'Activo'
                }
            });

            // Associate equipments
            await tx.conduceEquipo.createMany({
                data: data.garantiaIds.map(gid => ({
                    conduceId: conduce.id,
                    garantiaId: gid,
                    fechaInclusion: new Date()
                }))
            });

            // Update warranty status to 'Despachado' (Dispatched)
            await tx.garantia.updateMany({
                where: { id: { in: data.garantiaIds } },
                data: {
                    estado: 'Despachado',
                    fechaDespacho: new Date()
                }
            });

            // Historial for each
            for (const gid of data.garantiaIds) {
                await tx.garantiaHistorial.create({
                    data: {
                        garantiaId: gid,
                        estadoNuevo: 'Despachado',
                        userId: Number(session.user.id),
                        fechaCambio: new Date(),
                        observacion: `Equipo incluido en conduce ${codigo}`
                    }
                });
            }

            return conduce;
        });

        revalidatePath("/garantias");
        return { success: true, conduce: result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch all delivery manifests.
 */
export async function getConduces() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return [];

    return await prisma.conduceEnvio.findMany({
        include: {
            generadoPor: true,
            equiposIncluidos: {
                include: {
                    garantia: true
                }
            }
        },
        orderBy: { fechaGeneracion: 'desc' }
    });
}

/**
 * Reported work by technicians (Already fixed items)
 */
export async function reportarTrabajosRealizados(data: {
    cliente?: string;
    observaciones?: string;
    items: {
        imeiSn: string;
        marca?: string;
        modelo?: string;
        problema: string;
        cliente: string;
    }[]
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'tecnico_garantias') {
        return { success: false, error: "No autorizado" };
    }

    try {
        const tecnicoId = Number(session.user.id);
        
        // Count total lotes for numeric code
        const count = await prisma.garantiaLoteIngreso.count();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const codigoLote = `TRA-${dateStr}-${count + 1}`;

        const result = await prisma.$transaction(async (tx) => {
            const batch = await tx.garantiaLoteIngreso.create({
                data: {
                    codigo: codigoLote,
                    createdById: tecnicoId,
                    fechaCreacion: new Date(),
                    observaciones: data.observaciones || "Reporte de trabajo realizado"
                }
            });

            const firstAdmin = await tx.user.findFirst({ where: { role: 'admin' } });
            if (!firstAdmin) throw new Error("No se encontró ningún administrador.");

            for (const item of data.items) {
                const gCount = await tx.garantia.count();
                const gCodigo = `GAR-T-${dateStr}-${gCount + 1}`;
                
                const garantia = await tx.garantia.create({
                    data: {
                        codigo: gCodigo,
                        cliente: item.cliente,
                        imeiSn: item.imeiSn,
                        marca: item.marca || null,
                        modelo: item.modelo || null,
                        problema: item.problema,
                        diagnostico: item.problema,
                        solucionAplicada: "Reparado (Reporte Directo)",
                        estado: 'Terminado - Pendiente de Pago',
                        tecnicoId: tecnicoId,
                        adminId: firstAdmin.id,
                        loteIngresoId: batch.id,
                        fechaRecepcion: new Date(),
                        fechaReparacion: new Date()
                    }
                });

                await tx.garantiaHistorial.create({
                    data: {
                        garantiaId: garantia.id,
                        estadoNuevo: 'Terminado - Pendiente de Pago',
                        userId: tecnicoId,
                        fechaCambio: new Date(),
                        observacion: 'Trabajo reportado por el técnico.'
                    }
                });
            }

            return batch;
        });

        revalidatePath("/garantias");
        return { success: true, batchId: result.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Fetch all work reports pending approval (Admin only)
 */
export async function getTrabajosPendientesAprobacion() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return [];

    return await prisma.garantiaLoteIngreso.findMany({
        where: {
            garantias: {
                some: { estado: 'Terminado - Pendiente de Pago' }
            }
        },
        include: {
            createdBy: { 
                select: { 
                    id: true, 
                    name: true, 
                    username: true,
                    configuracionPagos: {
                        where: { activo: true },
                        take: 1
                    },
                    wallet: {
                        include: {
                            accounts: {
                                where: { nombre: "Principal" },
                                take: 1
                            }
                        }
                    }
                } 
            },
            garantias: true,
            _count: { select: { garantias: true } }
        },
        orderBy: { fechaCreacion: 'desc' }
    });
}

/**
 * Approve a batch of reported work and credit technician wallet.
 */
export async function aprobarYPayLoteTrabajo(loteId: number, customMonto?: number, saveAsDefault: boolean = false) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { success: false, error: "No autorizado" };

    try {
        return await prisma.$transaction(async (tx) => {
            const lote = await tx.garantiaLoteIngreso.findUnique({
                where: { id: loteId },
                include: { garantias: true, createdBy: true }
            });

            if (!lote) throw new Error("Lote no encontrado");
            const tecnicoId = lote.createdById;

            // Get payment configuration
            let montoPorEquipo = customMonto;
            
            if (montoPorEquipo === undefined) {
                const config = await tx.tecnicoGarantiaPago.findFirst({ where: { tecnicoId } });
                montoPorEquipo = config?.montoPorReparacion || 50; 
            } else if (saveAsDefault) {
                // Update or create persistent configuration
                const currentConfig = await tx.tecnicoGarantiaPago.findFirst({ where: { tecnicoId } });
                if (currentConfig) {
                    await tx.tecnicoGarantiaPago.update({
                        where: { id: currentConfig.id },
                        data: {
                            montoPorReparacion: customMonto,
                            adminId: Number(session.user.id),
                            fechaConfiguracion: new Date()
                        }
                    });
                } else {
                    await tx.tecnicoGarantiaPago.create({
                        data: {
                            tecnicoId,
                            montoPorReparacion: customMonto as number,
                            activo: true,
                            adminId: Number(session.user.id),
                            fechaConfiguracion: new Date()
                        }
                    });
                }
            }
            
            const montoTotal = lote.garantias.length * montoPorEquipo;

            // 1. Update guarantees status to 'Entregado'
            await tx.garantia.updateMany({
                where: { loteIngresoId: loteId },
                data: { estado: 'Entregado', fechaEntrega: new Date() }
            });

            // 2. Add history records
            for (const g of lote.garantias) {
                await tx.garantiaHistorial.create({
                    data: {
                        garantiaId: g.id,
                        estadoAnterior: 'Terminado - Pendiente de Pago',
                        estadoNuevo: 'Entregado',
                        userId: Number(session.user.id),
                        fechaCambio: new Date(),
                        observacion: `Aprobado y pagado RD$ ${montoPorEquipo}`
                    }
                });
            }

            // 3. Credit wallet
            let wallet = await tx.wallet.findFirst({ where: { tecnicoId } });
            if (!wallet) {
                wallet = await tx.wallet.create({ data: { tecnicoId, saldo: 0 } });
            }

            let principalAcc = await tx.walletAccount.findFirst({
                where: { walletId: wallet.id, nombre: "Principal" }
            });

            if (!principalAcc) {
                principalAcc = await tx.walletAccount.create({
                    data: {
                        walletId: wallet.id,
                        nombre: "Principal",
                        tipo: "corriente",
                        saldo: 0,
                        fechaCreacion: new Date()
                    }
                });
            }

            // Create transaction record
            await tx.walletTransaction.create({
                data: {
                    tecnicoId: tecnicoId,
                    monto: montoTotal,
                    tipo: 'ingreso',
                    estado: 'Completado',
                    fecha: new Date(),
                    descripcion: `Pago por lote de trabajo ${lote.codigo} (${lote.garantias.length} equipos)`
                }
            });

            // Update balances
            await tx.walletAccount.update({
                where: { id: principalAcc.id },
                data: { saldo: { increment: montoTotal } }
            });

            await tx.wallet.update({
                where: { id: wallet.id },
                data: { saldo: { increment: montoTotal } }
            });

            // Notify technician
            await tx.notification.create({
                data: {
                    tecnicoId: tecnicoId,
                    tipo: "PAGO_RECIBIDO",
                    titulo: "¡Pago acreditado!",
                    mensaje: `Se ha acreditado RD$ ${montoTotal.toLocaleString()} a tu cuenta por el lote ${lote.codigo}.`,
                    monto: montoTotal,
                    redirectUrl: "/wallet",
                    fecha: new Date(),
                    leida: false
                }
            });

            return { success: true };
        });
    } catch (error: any) {
        return { success: false, error: error.message };
    } finally {
        revalidatePath("/garantias");
        revalidatePath("/wallet");
    }
}
export async function getConfiguracionesPago() {
    return await prisma.tecnicoGarantiaPago.findMany();
}

