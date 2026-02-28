"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PurchaseWithProgress } from "@/app/actions/purchase";

interface PurchaseTablesProps {
    activePurchases: PurchaseWithProgress[];
    historyPurchases: PurchaseWithProgress[];
    draftCount: number;
}

export function PurchaseTables({ activePurchases, historyPurchases, draftCount }: PurchaseTablesProps) {
    return (
        <Tabs defaultValue="active" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList className="grid w-[400px] grid-cols-3">
                    <TabsTrigger value="active">Activas ({activePurchases.length})</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                    <TabsTrigger value="drafts">
                        Borradores
                        {draftCount > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
                                {draftCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                    <Link href="/compras/proveedores">
                        <Button variant="outline">Proveedores</Button>
                    </Link>
                    <Link href="/compras/modelos">
                        <Button variant="outline">Modelos</Button>
                    </Link>
                    <Link href="/compras/nueva">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Nueva Compra
                        </Button>
                    </Link>
                </div>
            </div>

            <TabsContent value="active" className="space-y-4">
                <PurchasesTable data={activePurchases} type="active" />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
                <PurchasesTable data={historyPurchases} type="history" />
            </TabsContent>

            <TabsContent value="drafts" className="space-y-4">
                <div className="text-center py-10">
                    <p className="text-slate-500 mb-4">Para gestionar borradores, ve a la sección dedicada.</p>
                    <Link href="/compras/borradores">
                        <Button variant="outline">Ir a Borradores</Button>
                    </Link>
                </div>
            </TabsContent>
        </Tabs>
    );
}

function PurchasesTable({ data, type }: { data: PurchaseWithProgress[], type: "active" | "history" }) {
    const router = useRouter(); // Added useRouter hook

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">No hay compras {type === "active" ? "activas" : "en el historial"}.</p>
                {type === "active" && (
                    <p className="text-sm text-slate-400 mt-1">Crea una nueva compra para comenzar.</p>
                )}
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="w-[80px] font-semibold text-slate-700">ID</TableHead>
                        <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                        <TableHead className="font-semibold text-slate-700">Fecha</TableHead>
                        <TableHead className="font-semibold text-slate-700">Equipos</TableHead>
                        <TableHead className="w-[30%] font-semibold text-slate-700">Progreso</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((purchase) => (
                        <TableRow
                            key={purchase.id}
                            className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                            onClick={() => router.push(`/compras/${purchase.id}`)} // Changed to router.push
                        >
                            <TableCell className="font-medium text-slate-600">#{purchase.id}</TableCell>
                            <TableCell className="font-medium">{purchase.supplier?.name}</TableCell>
                            <TableCell className="text-slate-600">
                                {purchase.purchaseDate ? format(new Date(purchase.purchaseDate), "dd MMM yyyy", { locale: es }) : "-"}
                            </TableCell>
                            <TableCell className="text-slate-600">
                                {purchase.completedCount} <span className="text-slate-400">/</span> {purchase.totalQuantity || purchase.originalTotal}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Progress value={purchase.displayProgress} className="h-2 flex-1" />
                                    <span className="text-xs font-medium text-slate-600 w-[35px] text-right">
                                        {Math.round(purchase.displayProgress)}%
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant={type === "active" ? "default" : "secondary"}
                                    className={type === "active" ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200" : "bg-slate-100 text-slate-600 border-slate-200"}
                                >
                                    {type === "active" ? "En Proceso" : "Completada"}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
