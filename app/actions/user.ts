
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

    try {
        await prisma.user.create({
            data: {
                username,
                name,
                email,
                passwordHash: hashedPassword,
                role: role || "tecnico",
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

            const buffer = Buffer.from(await photo.arrayBuffer());
            const fileExt = photo.name.includes('.') ? photo.name.split('.').pop() : 'jpg';
            const filename = `profile_${userId}_${Date.now()}.${fileExt}`;
            const publicDir = path.join(process.cwd(), "public", "profile_images");

            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            try {
                if (currentUser?.profileImage) {
                    const oldPath = path.join(publicDir, currentUser.profileImage);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            } catch (e) {
                console.warn("Could not delete old profile image:", e);
            }

            fs.writeFileSync(path.join(publicDir, filename), buffer);
            updateData.profileImage = filename;
            console.log(`Saved new profile image: ${filename}`);
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
    const password = formData.get("password") as string;

    try {
        const updateData: any = {
            role,
            canCreateGarantias
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
