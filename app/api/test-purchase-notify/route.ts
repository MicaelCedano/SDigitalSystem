import { NextResponse } from "next/server";
import { checkAndNotifyPurchaseComplete } from "@/app/actions/purchase";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Debug: log env vars (sin mostrar valores completos)
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const groupChatId = process.env.TELEGRAM_CHAT_ID;
    console.log("[Test] TELEGRAM_ADMIN_CHAT_ID set:", !!adminChatId, "value:", adminChatId?.slice(0,5));
    console.log("[Test] TELEGRAM_CHAT_ID set:", !!groupChatId, "value:", groupChatId?.slice(0,5));

    await checkAndNotifyPurchaseComplete(id);
    return NextResponse.json({
        ok: true,
        adminChatIdSet: !!adminChatId,
        adminChatIdPreview: adminChatId?.slice(0, 5) + "...",
        message: "Notificacion enviada para compra #" + id
    });
}
