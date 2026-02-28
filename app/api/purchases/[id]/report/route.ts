
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from '@/lib/utils';
import { format } from 'date-fns';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Standard Next.js 15+ syntax for sync/async mismatch
) {
    const { id } = await context.params;
    const purchaseId = parseInt(id);

    if (isNaN(purchaseId)) {
        return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'excel' | 'pdf'
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'functional' | 'non_functional'

    // Fetch purchase and equipments
    const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
            supplier: true,
            equipos: {
                include: {
                    deviceModel: true
                },
                orderBy: { id: 'asc' }
            }
        }
    });

    if (!purchase) {
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Filter equipments
    let equipments = purchase.equipos;
    let title = `Reporte de Equipos - Compra #${purchaseId}`;
    let filename = `reporte_compra_${purchaseId}`;

    if (filter === 'functional') {
        equipments = equipments.filter((e: any) => e.funcionalidad === 'Funcional');
        title = `Equipos Funcionales - Compra #${purchaseId}`;
        filename = `equipos_funcionales_compra_${purchaseId}`;
    } else if (filter === 'non_functional') {
        equipments = equipments.filter((e: any) => e.funcionalidad === 'No funcional');
        title = `Equipos No Funcionales - Compra #${purchaseId}`;
        filename = `equipos_no_funcionales_compra_${purchaseId}`;
    } else {
        title = `Lote Completo - Compra #${purchaseId}`;
        filename = `lote_completo_compra_${purchaseId}`;
    }

    // Add Supplier Name and Date to filename
    const supplierName = purchase.supplier?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'sin_proveedor';
    const dateStr = format(purchase.purchaseDate, 'yyyyMMdd');
    filename = `${supplierName}_${dateStr}_${filename}`;

    try {
        if (type === 'excel') {
            const buffer = await generateExcel(purchase, equipments, title);
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}.xlsx"`
                }
            });
        } else if (type === 'pdf') {
            const buffer = await generatePDF(purchase, equipments, title);
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}.pdf"`
                }
            });
        } else {
            return NextResponse.json({ error: 'Invalid type (use excel or pdf)' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}

async function generateExcel(purchase: any, equipments: any[], title: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Headers
    worksheet.addRow([title]);
    worksheet.addRow([`Proveedor: ${purchase.supplier?.name || 'N/A'}`]);
    worksheet.addRow([`Fecha: ${formatDateTime(purchase.purchaseDate)}`]);
    worksheet.addRow([`Total Equipos: ${equipments.length}`]);
    worksheet.addRow([]); // Spacer

    const headerRow = worksheet.addRow(['#', 'IMEI', 'Marca', 'Modelo', 'GB', 'Color', 'Grado', 'Funcionalidad', 'Estado', 'Observación']);
    headerRow.font = { bold: true };

    // Data
    equipments.forEach((eq, index) => {
        worksheet.addRow([
            index + 1,
            eq.imei,
            eq.marca || eq.deviceModel?.brand || '-',
            eq.modelo || eq.deviceModel?.modelName || '-',
            eq.storageGb || eq.deviceModel?.storageGb || '-',
            eq.color || eq.deviceModel?.color || '-',
            eq.grado || '-',
            eq.funcionalidad || '-',
            eq.estado,
            eq.observacion || '-'
        ]);
    });

    // Styling
    worksheet.columns.forEach(column => {
        column.width = 20; // Default width
    });
    worksheet.getColumn(1).width = 5; // ID column
    worksheet.getColumn(2).width = 20; // IMEI column
    worksheet.getColumn(10).width = 40; // Observacion column

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

async function generatePDF(purchase: any, equipments: any[], title: string) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Info
    doc.setFontSize(11);
    doc.text(`Proveedor: ${purchase.supplier?.name || 'N/A'}`, 14, 30);
    doc.text(`Fecha: ${formatDateTime(purchase.purchaseDate)}`, 14, 36);
    doc.text(`Total Equipos: ${equipments.length}`, 14, 42);

    // Table
    const tableColumn = ["#", "IMEI", "Modelo", "GB", "Grado", "Func.", "Estado", "Observación"];
    const tableRows: any[] = [];

    equipments.forEach((eq, index) => {
        const itemData = [
            index + 1,
            eq.imei,
            `${eq.marca || eq.deviceModel?.brand || ''} ${eq.modelo || eq.deviceModel?.modelName || ''}`,
            eq.storageGb || eq.deviceModel?.storageGb || '-',
            eq.grado || '-',
            eq.funcionalidad || '-',
            eq.estado,
            eq.observacion || '-'
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] },
        theme: 'grid'
    });

    // Output functionality
    // arraybuffer is standard for node fetch/response
    return Buffer.from(doc.output('arraybuffer'));
}
