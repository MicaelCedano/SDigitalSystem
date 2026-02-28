"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InventoryControls() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const initialSearch = searchParams.get('q')?.toString() || "";
    const initialStatus = searchParams.get('status')?.toString() || "all";

    const [term, setTerm] = useState(initialSearch);
    const [debouncedTerm] = useDebounce(term, 300);
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const handleSearch = useCallback((term: string, status: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }

        if (status && status !== "all") {
            params.set('status', status);
        } else {
            params.delete('status');
        }

        params.set('page', '1'); // Reset to page 1 on search

        replace(`${pathname}?${params.toString()}`);
    }, [pathname, replace, searchParams]);

    useEffect(() => {
        handleSearch(debouncedTerm, statusFilter);
    }, [debouncedTerm, statusFilter, handleSearch]);

    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                <Input
                    placeholder="Buscar por IMEI, Modelo, Marca o Lote..."
                    className="pl-10 bg-black/20 border-white/10 focus:border-purple-500/50 focus:bg-black/40 transition-all rounded-xl h-10 text-slate-200 placeholder:text-slate-500"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                />
                {term && (
                    <button
                        onClick={() => setTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-300 hover:text-purple-300 transition-all">
                            <Filter className="h-4 w-4 mr-2" />
                            {statusFilter === "all" ? "Todos los Estados" : statusFilter}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-slate-200">
                        <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                            <DropdownMenuRadioItem value="all" className="focus:bg-purple-500/20 focus:text-purple-300">Todos</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="DISPONIBLE" className="focus:bg-purple-500/20 focus:text-purple-300">Disponible</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="REPARACION" className="focus:bg-purple-500/20 focus:text-purple-300">En Reparación</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="VENDIDO" className="focus:bg-purple-500/20 focus:text-purple-300">Vendido</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="REVISAR" className="focus:bg-purple-500/20 focus:text-purple-300">Por Revisar</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
