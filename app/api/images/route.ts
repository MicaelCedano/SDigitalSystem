import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const imagesDir = path.join(process.cwd(), "public", "device-images");
        // Ensure dir exists or return empty
        const files = await readdir(imagesDir).catch(() => []);
        const images = files.filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file));
        return NextResponse.json(images);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}
