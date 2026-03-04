"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
    ShoppingBag,
    User as UserIcon,
    Loader2,
    CheckCircle2,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { createOrder } from "@/app/actions/orders";
import { toast } from "sonner";
import Script from "next/script";

export default function TelegramNewOrderPage() {
    const { data: session, status } = useSession();
    const [clienteNombre, setClienteNombre] = useState("");
    const [detalle, setDetalle] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            if (tg.setHeaderColor) tg.setHeaderColor('#F3F4F6');
        }
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!detalle || detalle.length < 5) {
            toast.error("El detalle debe tener al menos 5 caracteres");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createOrder({
                clienteNombre,
                detalle,
                observaciones
            });

            if (result.success) {
                setIsSuccess(true);
                toast.success("Pedido enviado con éxito");
                // @ts-ignore
                if (window.Telegram?.WebApp) {
                    setTimeout(() => {
                        // @ts-ignore
                        window.Telegram.WebApp.close();
                    }, 2000);
                }
            } else {
                toast.error(result.error || "Ocurrió un error");
            }
        } catch (error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-6 animate-in zoom-in-50 duration-500">
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">¡PEDIDO RECIBIDO!</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">Nuestros técnicos ya están trabajando</p>
                <Button
                    variant="outline"
                    className="rounded-2xl h-14 px-10 border-slate-200 font-black text-xs tracking-widest uppercase"
                    onClick={() => {
                        // @ts-ignore
                        if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
                    }}
                >
                    CERRAR VENTANA
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in duration-500">
            <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Ponga la orden</h1>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5 text-left">Asistente Digital</p>
                    </div>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white mb-20 animate-in slide-in-from-bottom-6 duration-700">
                <div className="p-6 md:p-8 space-y-6">
                    <div className="bg-indigo-50/50 rounded-3xl p-4 border border-indigo-50 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.1em]">Solicitante</p>
                            <p className="text-slate-700 text-sm font-bold truncate">
                                {status === "authenticated" ? session?.user?.name || session?.user?.username : "Cargando..."}
                            </p>
                        </div>
                    </div>

                    {status === "unauthenticated" ? (
                        <div className="py-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-600 mx-auto mb-4">
                                <Lock className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Acceso Requerido</h3>
                            <p className="text-sm text-slate-500 font-medium px-4">Debes iniciar sesión con tu cuenta de SDigital para poder enviar pedidos.</p>
                            <Button
                                onClick={() => signIn()}
                                className="w-full h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-700 font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-100 mt-6"
                            >
                                INICIAR SESIÓN
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nombre del Cliente</Label>
                                <Input
                                    placeholder="Ej: Juan Perez"
                                    value={clienteNombre}
                                    onChange={(e) => setClienteNombre(e.target.value)}
                                    className="h-14 rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-2 ring-indigo-500/10 px-6 font-bold text-slate-700 transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Desglose del Pedido</Label>
                                <Textarea
                                    placeholder="Ej: 5 iPhone 13, 2 Cargadores..."
                                    value={detalle}
                                    onChange={(e) => setDetalle(e.target.value)}
                                    className="min-h-[160px] rounded-[1.5rem] border-none bg-slate-50 focus:bg-white focus:ring-2 ring-indigo-500/10 p-6 font-bold text-slate-700 transition-all shadow-sm resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Observaciones</Label>
                                <Input
                                    placeholder="Notas adicionales..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    className="h-12 rounded-xl border-none bg-slate-50/50 focus:bg-white focus:ring-2 ring-indigo-500/10 px-6 font-medium text-slate-600 text-sm transition-all"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || status !== "authenticated"}
                                className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 disabled:bg-slate-400 mt-4 px-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" />
                                        <span>ENVIANDO...</span>
                                    </>
                                ) : (
                                    "CONFIRMAR PEDIDO"
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </Card>

            <div className="text-center px-6">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] leading-relaxed">
                    SEÑAL DIGITAL SYSTEM &copy; 2026
                </p>
            </div>
        </div>
    );
}
