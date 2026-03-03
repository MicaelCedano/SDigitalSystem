import { getOrders, getMerchandiseArrivals } from "@/app/actions/orders";
import { OrdersClient } from "@/components/orders/OrdersClient";
import prisma from "@/lib/prisma";

export default async function PedidosPage() {
    const orders = await getOrders();
    const arrivals = await getMerchandiseArrivals();

    // Get device models for the creation modal
    const models = await prisma.deviceModel.findMany({
        orderBy: [
            { brand: 'asc' },
            { modelName: 'asc' }
        ]
    });

    // Get clients for the creation modal
    const clientes = await prisma.cliente.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' }
    });

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2 text-left">
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-800 tracking-tighter uppercase">
                        Pedidos & <span className="text-indigo-600">Novedades</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">
                        Gestiona las solicitudes de equipos y mantente al tanto de la nueva mercancía.
                    </p>
                </div>
            </div>

            <OrdersClient
                initialOrders={orders}
                arrivals={arrivals}
                models={models}
                clientes={clientes}
            />
        </div>
    );
}
