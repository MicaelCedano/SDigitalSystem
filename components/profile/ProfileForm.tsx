"use client";

import { useState, useRef } from "react";
import { User, Mail, Camera, Save, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/user";
import { useSession } from "next-auth/react";

interface ProfileFormProps {
    user: {
        id: number;
        username: string;
        name: string | null;
        email: string | null;
        role: string;
        profileImage: string | null;
    };
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const { update } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(
        user.profileImage ? `/profile_images/${user.profileImage}` : null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen es demasiado pesada. Máximo 2MB.");
                e.target.value = ""; // Clear input
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = await updateProfile(user.id, formData);

            if (result.success) {
                // Try to update session, but don't fail the whole operation if it has issues
                try {
                    await update({
                        name: formData.get("name"),
                        image: result.profileImage || user.profileImage
                    });
                } catch (sessionError) {
                    console.error("Session update error:", sessionError);
                }

                toast.success("Perfil actualizado correctamente");
                // Optional: refresh page if session update didn't work perfectly
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(result.error || "Error al actualizar perfil");
            }
        } catch (error: any) {
            console.error("Profile update component error:", error);
            toast.error(error.message || "Error inesperado al procesar el perfil");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="max-w-2xl mx-auto border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden group">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <CardHeader className="relative z-10 border-b border-slate-100 dark:border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <User size={24} />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Editar Perfil</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
                            Personaliza tu información y foto de perfil
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-8">
                <form action={handleSubmit} className="space-y-8">
                    {/* Profile Photo Section */}
                    <div className="flex flex-col items-center gap-6 pb-4">
                        <div className="relative group/photo">
                            <div className="h-32 w-32 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 shadow-2xl transition-all duration-500 group-hover/photo:scale-105 group-hover/photo:border-primary/50">
                                {preview ? (
                                    <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-4xl font-black">
                                        {user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
                            >
                                <Camera size={18} />
                            </button>
                            <input
                                type="file"
                                name="photo"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                            Haz clic en el icono para cambiar tu foto
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Nombre Completo</Label>
                            </div>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    name="name"
                                    defaultValue={user.name || ""}
                                    placeholder="Tu nombre completo"
                                    className="pl-10 h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-white/10 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Correo Electrónico</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    name="email"
                                    type="email"
                                    defaultValue={user.email || ""}
                                    placeholder="correo@ejemplo.com"
                                    className="pl-10 h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-white/10 transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest opacity-50">Usuario</Label>
                                <Input
                                    value={user.username}
                                    disabled
                                    className="h-12 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 cursor-not-allowed rounded-xl font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest opacity-50">Rol Actual</Label>
                                <div className="h-12 flex items-center gap-2 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase">
                                    <Shield size={14} className="text-primary" />
                                    {user.role.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl transition-all duration-300"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
