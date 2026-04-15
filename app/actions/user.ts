
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

export async function createUser(formData: FormData) {
    const username = formData.get("username") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const email = formData.get("email") as string;

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Seleccionar un avatar genérico al azar
    const defaultAvatars = [
        "default_avatar_1.png",
        "default_avatar_2.png",
        "default_avatar_3.png",
        "default_avatar_4.png"
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    try {
        await prisma.user.create({
            data: {
                username,
                name: name || null,
                email: email && email.trim() !== "" ? email : null,
                passwordHash: hashedPassword,
                role: role || "tecnico",
                profileImage: randomAvatar,
            },
        });
        revalidatePath("/users");
        return { success: true };
    } catch (error) {
        console.error("Error creating user:", error);
        return { error: "Failed to create user" };
    }
}

export async function deleteUser(userId: number) {
    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath("/users");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete user" };
    }
}

export async function updateProfile(userId: number, formData: FormData) {
    if (!userId || isNaN(userId)) {
        console.error("Invalid userId provided to updateProfile:", userId);
        return { success: false, error: "ID de usuario no válido" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const photo = formData.get("photo");

    console.log(`Update attempt for user ${userId} - Name: ${name}, Email: ${email}`);

    try {
        const updateData: any = {
            name,
        };

        // Only handle email if it's provided and different
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, profileImage: true, role: true }
        });

        if (email && email.trim() !== "" && email !== currentUser?.email) {
            // Check if email is already taken by ANOTHER user
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email,
                    id: { not: userId }
                }
            });

            if (existingUser) {
                return { success: false, error: "Este correo electrónico ya está siendo usado por otro usuario." };
            }
            updateData.email = email;
        }

        if (photo instanceof File && photo.size > 0) {
            console.log(`Processing photo: ${photo.name}, size: ${(photo.size / 1024).toFixed(2)} KB`);

            if (photo.size > 10 * 1024 * 1024) {
                return { success: false, error: "La imagen excede el límite de 10MB" };
            }

            // Use Supabase Storage for persistence on Vercel
            const { getSupabaseAdmin } = await import("@/lib/supabase");
            const supabase = getSupabaseAdmin();

            if (!supabase) {
                console.error("Supabase admin client not available");
                return { success: false, error: "Error de configuración del servidor de archivos" };
            }

            const buffer = Buffer.from(await photo.arrayBuffer());
            const fileExt = photo.name.includes('.') ? photo.name.split('.').pop() : 'jpg';
            const filename = `profile_${userId}_${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('profiles')
                .upload(filename, buffer, {
                    contentType: photo.type || 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.error("Supabase Storage Error:", error);
                return { success: false, error: "Error al subir la imagen a la nube" };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filename);

            updateData.profileImage = publicUrl;
            console.log(`Saved new profile image to Supabase: ${publicUrl}`);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, profileImage: true, role: true }
        });

        console.log(`Successfully updated user ${userId} (${updatedUser.role})`);

        revalidatePath("/");
        revalidatePath("/profile");

        return { success: true, profileImage: updatedUser.profileImage };
    } catch (error: any) {
        console.error("FATAL ERROR IN updateProfile:", error);

        // Handle Prisma unique constraint error specifically for email
        if (error.code === 'P2002') {
            return { success: false, error: "El correo electrónico ya está en uso." };
        }

        return { success: false, error: error.message || "Error al actualizar perfil" };
    }
}

export async function updateUserAdmin(userId: number, formData: FormData) {
    const role = formData.get("role") as string;
    const canCreateGarantias = formData.get("canCreateGarantias") === "true";
    const canManageOrders = formData.get("canManageOrders") === "true";
    const isActive = formData.get("isActive") === "true";
    const password = formData.get("password") as string;

    try {
        const updateData: any = {
            role,
            canCreateGarantias,
            canManageOrders,
            isActive
        };

        if (password && password.trim().length > 0) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        revalidatePath("/users");
        return { success: true };
    } catch (error) {
        console.error("Error updating user admin:", error);
        return { error: "Failed to update user" };
    }
}
