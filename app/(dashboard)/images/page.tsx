import { readdir } from "fs/promises";
import path from "path";
import Image from "next/image";
import { ImageSyncActions } from "@/components/images/ImageSyncActions";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const imagesDir = path.join(process.cwd(), "public", "device-images");
    let images: string[] = [];
    try {
        const files = await readdir(imagesDir);
        images = files.filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file));
    } catch (e) {
        images = [];
    }

    return (
        <div className="flex-1 space-y-8 fade-in-up duration-500 p-4 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-900 shadow-2xl relative overflow-hidden group">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-rose-500/20 dark:from-pink-500/10 dark:to-rose-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-amber-500/20 dark:from-orange-500/10 dark:to-amber-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

                <div className="relative z-10 flex items-center gap-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-pink-600 to-rose-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-pink-500/30 group-hover:rotate-6 group-hover:scale-105 transition-all duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Galería de Imágenes
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-base mt-2 flex items-center gap-2">
                            Explora las fotos de equipos que se han descargado automáticamente.
                        </p>
                    </div>
                </div>

                <ImageSyncActions />
            </div>

            {images.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-off text-slate-400 dark:text-slate-500"><line x1="2" x2="22" y1="2" y2="22" /><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" /><line x1="13.5" x2="6" y1="13.5" y2="21" /><line x1="18" x2="21" y1="12" y2="15" /><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59" /><path d="M21 15V5a2 2 0 0 0-2-2H9" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay imágenes agrupadas aún</h3>
                        <p className="text-slate-500 dark:text-slate-400">Abre el detalle de un equipo o modelo para que el sistema descargue la foto automáticamente.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative z-10">
                    {images.map((img) => (
                        <div key={img} className="group relative bg-white dark:bg-slate-900 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 overflow-hidden flex flex-col">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="aspect-square p-6 flex flex-1 items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors duration-500">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={`/device-images/${img}`}
                                        alt={img}
                                        fill
                                        className="object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-700 ease-out"
                                        unoptimized
                                    />
                                </div>
                            </div>

                            <div className="px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 relative z-10 transition-colors duration-500">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate text-center select-all group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                    {img}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
