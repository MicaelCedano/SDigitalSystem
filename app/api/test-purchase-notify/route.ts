import { NextResponse } from "next/server";
import { checkAndNotifyPurchaseComplete } from "@/app/actions/purchase";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await checkAndNotifyPurchaseComplete(id);
    return NextResponse.json({ ok: true, message: "Notificacion enviada para compra #" + id });
}
