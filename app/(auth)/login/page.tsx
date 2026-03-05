
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User, ChevronRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Las credenciales no coinciden con nuestros registros.");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Ocurrió un error inesperado. Inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-[#0f172a] to-purple-950 animate-gradient-flow text-white">
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] animate-pulse duration-[10000ms]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse duration-[8000ms]" />

            <main className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-2 gap-0 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden m-4 lg:m-0 animate-in fade-in zoom-in duration-700">

                {/* Left Side: Branding/Visual */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
                    {/* Abstract shape */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/30 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/30 rounded-full blur-[80px]" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-white/10">
                                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Señal Digital System</h2>
                        </div>

                        <h1 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            Control Total de <br />
                            Servicio Técnico <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">& Pro.</span>
                        </h1>
                        <p className="text-slate-300 text-lg max-w-sm leading-relaxed">
                            Administra garantías, reparaciones e inventario de dispositivos con precisión absoluta.
                        </p>
                    </div>

                    <div className="relative z-10 flex gap-6 text-sm text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sistema Estable</span>
                        <span>v2.4.0</span>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-8 lg:p-14 flex flex-col justify-center bg-zinc-950/50 backdrop-blur-3xl relative">
                    {/* Subtle Gradient Glow in Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="lg:hidden flex justify-center mb-8 relative z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-white/10 mb-4">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
                        </div>
                    </div>

                    <div className="mb-10 text-center lg:text-left relative z-10">
                        <h3 className="text-3xl font-bold text-white mb-2 flex items-center justify-center lg:justify-start gap-2">
                            Bienvenido <span className="text-2xl">👋</span>
                        </h3>
                        <p className="text-slate-400">Ingresa tus credenciales para acceder al panel.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400 text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Nombre de Usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 group-hover:border-purple-500/30 group-focus-within:border-purple-500/50 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white/10 transition-all duration-300"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400 text-slate-500">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 group-hover:border-purple-500/30 group-focus-within:border-purple-500/50 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white/10 transition-all duration-300"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2 shadow-[0_4px_12px_rgba(239,68,68,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group w-full py-4 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-[0_8px_30px_rgb(124,58,237,0.3)] hover:shadow-[0_8px_40px_rgb(124,58,237,0.4)] flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 border border-white/10"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Entrar al Sistema
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-between text-sm pt-2 px-2">
                            <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-white transition-colors group">
                                <div className="relative flex items-center justify-center w-4 h-4 rounded border border-white/20 bg-white/5 group-hover:border-purple-500 transition-colors">
                                    <input type="checkbox" className="appearance-none absolute inset-0 w-full h-full cursor-pointer checked:bg-purple-500 rounded-sm" />
                                    {/* Custom Checkmark would go here if we weren't using simple css check */}
                                </div>
                                Recordarme
                            </label>
                            <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors font-medium">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                    </form>
                </div>
            </main>

            {/* Footer Branding */}
            <div className="absolute bottom-6 text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">
                Secure System • v2.4.0
            </div>
        </div>
    );
}
