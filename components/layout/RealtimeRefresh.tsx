"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function RealtimeRefresh({ tables }: { tables: string[] }) {
    const router = useRouter();

    useEffect(() => {
        const channel = supabase.channel(`realtime-refresh-${tables.join("-")}-${Date.now()}`);
        tables.forEach((table) => {
            channel.on("postgres_changes" as any, { event: "*", schema: "public", table }, () => {
                router.refresh();
            });
        });
        channel.subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}
