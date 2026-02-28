"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    totalPages: number;
    currentPage: number;
}

export function InventoryPagination({ totalPages, currentPage }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page));
    };

    return (
        <div className="flex items-center justify-between px-2 pt-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 text-sm text-muted-foreground font-medium">
                Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-slate-400">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage <= 1}
                >
                    <span className="sr-only">Primera página</span>
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center justify-center min-w-[2rem] px-2 h-8 rounded-md bg-purple-500/10 border border-purple-500/20 text-sm font-bold text-purple-300">
                    {currentPage}
                </div>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                >
                    <span className="sr-only">Última página</span>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
