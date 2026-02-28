"use client";

import { useState } from "react";
import { Menu, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { NotificationsCenter } from "./NotificationsCenter";

export function MobileNav({ user }: { user: any }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50 border border-slate-100">
                            <Menu className="w-5 h-5 text-slate-600" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-[#0f172a] border-none w-72">
                        <div className="h-full flex flex-col">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-indigo-500" />
                                    <span className="text-xl font-black text-white">RMA Digital</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white/50 hover:text-white hover:bg-white/5">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto" onClick={() => setOpen(false)}>
                                <Sidebar initialUser={user} forceShow />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 rounded-lg">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter text-slate-900 leading-none">RMA</span>
                        <span className="text-[8px] uppercase font-bold text-indigo-600 tracking-widest leading-none">Digital</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <NotificationsCenter />
            </div>
        </div>
    );
}
