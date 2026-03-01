"use server";

import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGES_DIR = path.join(PUBLIC_DIR, "device-images");

// Ensure directory exists - Only in development to avoid production/Vercel crashes
try {
    const isServerless = !!(process.env.VERCEL || process.env.RENDER || process.env.NETLIFY);
    const isProduction = process.env.NODE_ENV === 'production';

    // Skip file system operations on read-only environments
    if (!isServerless && !isProduction) {
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }
    } else {
        console.log(`[STORAGE] Skipping local directory initialization (Runtime: ${isServerless ? 'Serverless' : 'Production'})`);
    }
} catch (e: any) {
    console.warn(`[STORAGE] Warning: Local images directory could not be initialized: ${e.message}`);
}

interface ImageResult {
    url: string;
    thumbnail: string;
}

// Clean query function similar to Python
function cleanVisualQuery(query: string): string {
    let cleaned = query.replace(/\s\d+\s?GB/gi, "");
    cleaned = cleaned.replace(/\s\d+\s?TB/gi, "");
    return cleaned.trim();
}

async function searchBingImages(query: string, limit = 5): Promise<ImageResult[]> {
    try {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        });

        if (!response.ok) throw new Error("Bing search failed");

        const html = await response.text();
        const $ = cheerio.load(html);
        const results: ImageResult[] = [];

        $("a.iusc").each((_, el) => {
            if (results.length >= limit) return;
            try {
                const m = $(el).attr("m");
                if (m) {
                    const data = JSON.parse(m);
                    if (data.murl && data.turl) {
                        results.push({
                            url: data.murl,
                            thumbnail: data.turl
                        });
                    }
                }
            } catch (e) {
                // ignore parsing errors
            }
        });

        return results;
    } catch (error) {
        console.error("Error searching Bing Images:", error);
        return [];
    }
}

async function downloadImage(url: string, prefix: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT }
        });

        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "";

        let ext = ".jpg";
        if (contentType.includes("png")) ext = ".png";
        else if (contentType.includes("webp")) ext = ".webp";

        const filename = `${prefix}_${Date.now()}${ext}`.replace(/[^a-z0-9_.]/gi, "_").toLowerCase();
        const filepath = path.join(IMAGES_DIR, filename);

        fs.writeFileSync(filepath, Buffer.from(buffer));

        console.log(`Image saved to ${filepath}`);
        return filename;
    } catch (error) {
        console.error("Error downloading image:", error);
        return null;
    }
}

export async function findAndAssignImageToEquipment(equipmentId: number, useRandom: boolean = false) {
    try {
        const equipment = await prisma.equipo.findUnique({
            where: { id: equipmentId },
            include: { deviceModel: true }
        });

        if (!equipment) return { success: false, error: "Equip not found" };

        const brand = equipment.deviceModel?.brand || equipment.marca || "";
        const model = equipment.deviceModel?.modelName || equipment.modelo || "";
        const color = equipment.color || "";

        if (!brand || !model) return { success: false, error: "Insufficient info" };

        // 1. Check if DeviceModel already has an image (and we are not forcing regeneration)
        if (!useRandom && equipment.deviceModel?.imageFilename) {
            console.log("Using existing image from DeviceModel");
            if (equipment.imageFilename !== equipment.deviceModel.imageFilename) {
                await prisma.equipo.update({
                    where: { id: equipmentId },
                    data: { imageFilename: equipment.deviceModel.imageFilename }
                });
            }
            return { success: true, filename: equipment.deviceModel.imageFilename };
        }

        // 2. Check similar equipment logic...
        if (!useRandom) {
            const similarEquip = await prisma.equipo.findFirst({
                where: {
                    AND: [
                        { marca: brand },
                        { modelo: model },
                        { color: color },
                        { imageFilename: { not: null } },
                        { id: { not: equipmentId } } // Exclude self
                    ]
                }
            });

            if (similarEquip?.imageFilename) {
                console.log("Using existing image from similar equipment");
                await prisma.equipo.update({
                    where: { id: equipmentId },
                    data: { imageFilename: similarEquip.imageFilename }
                });

                if (equipment.deviceModelId) {
                    await prisma.deviceModel.update({
                        where: { id: equipment.deviceModelId },
                        data: { imageFilename: similarEquip.imageFilename }
                    });
                }
                return { success: true, filename: similarEquip.imageFilename };
            }
        }

        const query = cleanVisualQuery(`${brand} ${model} ${color} official png`);
        console.log(`Searching image for: ${query}`);

        let images = await searchBingImages(query, 10);

        if (images.length === 0) return { success: false, error: "No images found" };
        if (useRandom) {
            images = images.sort(() => Math.random() - 0.5);
        }

        for (const img of images) {
            // Using direct URL instead of downloading to save local disk space
            const imageUrl = img.url;
            if (imageUrl) {
                await prisma.equipo.update({
                    where: { id: equipmentId },
                    data: { imageFilename: imageUrl }
                });
                if (equipment.deviceModelId) {
                    await prisma.deviceModel.update({
                        where: { id: equipment.deviceModelId },
                        data: { imageFilename: imageUrl }
                    });
                }
                revalidatePath("/equipos");
                return { success: true, filename: imageUrl };
            }
        }
        return { success: false, error: "No image URLs available" };
    } catch (error) {
        console.error("Error in findAndAssignImage:", error);
        return { success: false, error: "Server error" };
    }
}

export async function findAndAssignImageToDeviceModel(deviceModelId: number, useRandom: boolean = false) {
    try {
        const model = await prisma.deviceModel.findUnique({
            where: { id: deviceModelId }
        });

        if (!model) return { success: false, error: "Model not found" };

        const brand = model.brand;
        const modelName = model.modelName;
        // Default color if none provided
        const color = model.color || "Generic";

        // Check if there are other models with same brand/model (different storage) that have an image? 
        // Python code: ModelColorReference. 
        // Here we just search.

        const query = cleanVisualQuery(`${brand} ${modelName} ${color} official png`);
        console.log(`Searching image for DeviceModel: ${query}`);

        let images = await searchBingImages(query, 10);

        if (images.length === 0) return { success: false, error: "No images found" };
        if (useRandom) {
            images = images.sort(() => Math.random() - 0.5);
        }

        for (const img of images) {
            const imageUrl = img.url;
            if (imageUrl) {
                await prisma.deviceModel.update({
                    where: { id: deviceModelId },
                    data: { imageFilename: imageUrl }
                });
                revalidatePath("/compras/modelos");
                return { success: true, filename: imageUrl };
            }
        }
        return { success: false, error: "No image URLs available" };
    } catch (error) {
        console.error("Error in findAndAssignImageToDeviceModel:", error);
        return { success: false, error: "Server error" };
    }
}

/**
 * Sync missing images for all DeviceModels.
 */
export async function syncAllMissingImages() {
    try {
        const modelsWithoutImages = await prisma.deviceModel.findMany({
            where: {
                OR: [
                    { imageFilename: null },
                    { imageFilename: "" }
                ]
            }
        });

        console.log(`Starting sync for ${modelsWithoutImages.length} models...`);
        let successCount = 0;

        for (const model of modelsWithoutImages) {
            const result = await findAndAssignImageToDeviceModel(model.id);
            if (result.success) successCount++;
        }

        revalidatePath("/compras/modelos");
        return { success: true, processed: modelsWithoutImages.length, updated: successCount };
    } catch (error) {
        console.error("Error syncing all images:", error);
        return { success: false, error: "Error during mass sync" };
    }
}

/**
 * Global sync: Models and then individual Equipment that still lack images.
 */
export async function syncAllEverything() {
    try {
        // 1. First sync all models (this covers most equipments)
        const modelRes = await syncAllMissingImages();

        // 2. Then sync individual equipments that might not have a model link 
        // or where the model link failed to provide an image
        const equipmentsWithoutImages = await prisma.equipo.findMany({
            where: {
                OR: [
                    { imageFilename: null },
                    { imageFilename: "" }
                ]
            }
        });

        console.log(`Starting sync for ${equipmentsWithoutImages.length} individual equipments...`);
        let equipUpdates = 0;

        for (const eq of equipmentsWithoutImages) {
            const result = await findAndAssignImageToEquipment(eq.id);
            if (result.success) equipUpdates++;
        }

        revalidatePath("/");
        revalidatePath("/equipos");
        revalidatePath("/compras/modelos");

        return {
            success: true,
            modelsProcessed: modelRes.processed,
            modelsUpdated: modelRes.updated,
            equipmentsProcessed: equipmentsWithoutImages.length,
            equipmentsUpdated: equipUpdates
        };
    } catch (error) {
        console.error("Error in global sync:", error);
        return { success: false, error: "Global sync failed" };
    }
}

/**
 * Deletes all physical image files and clears non-URL database references.
 */
export async function clearLocalImages() {
    try {
        // 1. Clear database references that aren't URLs
        await prisma.deviceModel.updateMany({
            where: {
                AND: [
                    { imageFilename: { not: null } },
                    { imageFilename: { not: { startsWith: 'http' } } }
                ]
            },
            data: { imageFilename: null }
        });

        await prisma.equipo.updateMany({
            where: {
                AND: [
                    { imageFilename: { not: null } },
                    { imageFilename: { not: { startsWith: 'http' } } }
                ]
            },
            data: { imageFilename: null }
        });

        // 2. Delete physical files
        if (fs.existsSync(IMAGES_DIR)) {
            const files = fs.readdirSync(IMAGES_DIR);
            for (const file of files) {
                const filePath = path.join(IMAGES_DIR, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error(`Failed to delete file ${file}:`, e);
                }
            }
        }

        revalidatePath("/");
        revalidatePath("/equipos");
        revalidatePath("/compras/modelos");
        revalidatePath("/images");

        return { success: true };
    } catch (error) {
        console.error("Error clearing local images:", error);
        return { success: false, error: "Cleanup failed" };
    }
}



