"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Circle,
    RotateCcw,
    ShieldCheck,
    Smartphone,
    Battery,
    Wifi,
    Bluetooth,
    Camera,
    Volume2,
    Cpu,
    Wrench,
    Trash2,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
    id: string;
    text: string;
    hint?: string;
};

type Section = {
    id: string;
    title: string;
    icon: React.ReactNode;
    accent: string;
    items: Item[];
};

const SECTIONS: Section[] = [
    {
        id: "identificacion",
        title: "1. Identificación",
        icon: <Smartphone size={18} />,
        accent: "from-indigo-500/20 to-violet-500/10 border-indigo-500/30",
        items: [
            { id: "i1", text: "IMEI del sistema operativo" },
            { id: "i2", text: "IMEI en SDigitalSystem" },
            { id: "i3", text: "IMEI en etiqueta" },
            { id: "i4", text: "Los 3 IMEI coinciden" },
            { id: "i5", text: "Modelo y capacidad correctos" },
            { id: "i6", text: "Liberado de red (Network Unlocked)" },
            { id: "i7", text: "Sin bloqueo iCloud / Activation Lock" },
            { id: "i8", text: "Sin MDM (gestión móvil)" },
        ],
    },
    {
        id: "piezas",
        title: "2. Piezas desconocidas",
        icon: <ShieldCheck size={18} />,
        accent: "from-rose-500/20 to-pink-500/10 border-rose-500/30",
        items: [
            { id: "p1", text: "General: sin piezas desconocidas" },
            { id: "p2", text: "¿Hay piezas cambiadas o de segunda mano? No" },
        ],
    },
    {
        id: "pantalla",
        title: "3. Pantalla",
        icon: <Smartphone size={18} />,
        accent: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
        items: [
            { id: "pa1", text: "Píxeles muertos" },
            { id: "pa2", text: "Manchas blancas o negras" },
            { id: "pa3", text: "Sombras localizadas" },
            { id: "pa4", text: "Quemado / burn-in" },
            { id: "pa5", text: "Táctil responde en toda la superficie" },
            { id: "pa6", text: "Táctil responde en bordes y esquinas" },
            { id: "pa7", text: "Brillo automático" },
            { id: "pa8", text: "True Tone activa y desactiva" },
            { id: "pa9", text: "Cristal sin grietas ni astillados" },
        ],
    },
    {
        id: "camaras",
        title: "4. Cámaras",
        icon: <Camera size={18} />,
        accent: "from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/30",
        items: [
            { id: "c1", text: "Cámara trasera abre rápido" },
            { id: "c2", text: "Enfoca de cerca y de lejos" },
            { id: "c3", text: "Sin manchas ni niebla interna" },
            { id: "c4", text: "Flash trasero dispara al tomar foto" },
            { id: "c5", text: "Cámara frontal limpia" },
            { id: "c6", text: "Cámara frontal enfoca bien" },
            { id: "c7", text: "Grabación de video sin tirones" },
        ],
    },
    {
        id: "audio",
        title: "5. Audio",
        icon: <Volume2 size={18} />,
        accent: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
        items: [
            { id: "au1", text: "Altavoz inferior suena claro" },
            { id: "au2", text: "Altavoz inferior sin distorsión a volumen máximo" },
            { id: "au3", text: "Auricular (earpiece) se escucha en llamada" },
            { id: "au4", text: "Micrófono principal graba claro" },
            { id: "au5", text: "Micrófono secundario (cancelación de ruido)" },
        ],
    },
    {
        id: "botones",
        title: "6. Botones",
        icon: <Wrench size={18} />,
        accent: "from-slate-500/20 to-zinc-500/10 border-slate-500/30",
        items: [
            { id: "b1", text: "Botón volumen +" },
            { id: "b2", text: "Botón volumen −" },
            { id: "b3", text: "Switch de silencio (mute)" },
            { id: "b4", text: "Botón lateral (Power) hace clic firme" },
            { id: "b5", text: "Doble clic en Power activa Apple Pay / Siri" },
        ],
    },
    {
        id: "conectividad",
        title: "7. Conectividad",
        icon: <Wifi size={18} />,
        accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
        items: [
            { id: "co1", text: "WiFi conecta y navega" },
            { id: "co2", text: "Bluetooth detecta dispositivos" },
            { id: "co3", text: "SIM es reconocida" },
            { id: "co4", text: "Señal celular presente" },
            { id: "co5", text: "Llamada saliente se realiza" },
            { id: "co6", text: "Llamada entrante se recibe" },
        ],
    },
    {
        id: "bateria",
        title: "8. Batería y carga",
        icon: <Battery size={18} />,
        accent: "from-lime-500/20 to-green-500/10 border-lime-500/30",
        items: [
            { id: "bat1", text: "Porcentaje de salud anotado: ____%" },
            { id: "bat2", text: "Cumple mínimo (iPhone ≤13: ≥80% / iPhone ≥14: ≥85%)" },
            { id: "bat3", text: "Puerto de carga limpio" },
            { id: "bat4", text: "Carga con cable sin interrupciones" },
        ],
    },
    {
        id: "sensores",
        title: "9. Sensores",
        icon: <Cpu size={18} />,
        accent: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
        items: [
            { id: "s1", text: "Acelerómetro (rotación de pantalla)" },
            { id: "s2", text: "Sensor de proximidad (pantalla apaga en llamada)" },
            { id: "s3", text: "Vibrador / háptico responde" },
        ],
    },
    {
        id: "estructura",
        title: "10. Físico y estructura",
        icon: <Wrench size={18} />,
        accent: "from-stone-500/20 to-zinc-500/10 border-stone-500/30",
        items: [
            { id: "e1", text: "Chasis sin dobleces" },
            { id: "e2", text: "Carcasa sin separación ni abierta" },
            { id: "e3", text: "Tornillos sin marcas de apertura" },
            { id: "e4", text: "Cristal trasero sin fracturas" },
            { id: "e5", text: "Bandeja SIM eyecta y reinserta bien" },
        ],
    },
    {
        id: "estetica",
        title: "11. Grado estético",
        icon: <ShieldCheck size={18} />,
        accent: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
        items: [
            { id: "g1", text: "Grado: A / B / C / D" },
            { id: "g2", text: "Rayas anotadas (ubicación)" },
            { id: "g3", text: "Golpes anotados (ubicación)" },
            { id: "g4", text: "Marcas en bordes anotadas" },
            { id: "g5", text: "Dobleces anotados" },
        ],
    },
];

const STORAGE_KEY = "sdigital.checklist.state.v1";

export function ChecklistClient() {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [hydrated, setHydrated] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                setChecked(JSON.parse(raw));
            }
        } catch {
            // ignore
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
        } catch {
            // ignore
        }
    }, [checked, hydrated]);

    const toggle = (id: string) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const reset = () => {
        if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los checks del checklist?")) {
            setChecked({});
        }
    };

    const totalItems = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);
    const checkedCount = Object.values(checked).filter(Boolean).length;
    const progressPct = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);

    const filteredSections = SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter((it) =>
            query.trim() === "" ? true : it.text.toLowerCase().includes(query.toLowerCase())
        ),
    })).filter((s) => s.items.length > 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-cyan-500/10 border border-white/10 backdrop-blur-2xl p-6 md:p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
                                Guía de Referencia QC
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                            Checklist de Revisión iPhone
                        </h1>
                        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                            Recurso de aprendizaje y referencia. Marca los items a medida que los verificas. Tu progreso se guarda automáticamente en este navegador y se puede reiniciar cuando quieras.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Progreso
                            </div>
                            <div className="text-3xl font-black text-white tabular-nums">
                                {checkedCount}<span className="text-slate-500 text-lg">/{totalItems}</span>
                            </div>
                        </div>
                        <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Search + Reset bar */}
                <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar item del checklist…"
                            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                        />
                    </div>
                    <button
                        onClick={reset}
                        className="h-12 px-5 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Sections grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredSections.map((section) => {
                    const sectionTotal = section.items.length;
                    const sectionDone = section.items.filter((it) => checked[it.id]).length;
                    const sectionPct = sectionTotal === 0 ? 0 : Math.round((sectionDone / sectionTotal) * 100);

                    return (
                        <div
                            key={section.id}
                            className={cn(
                                "rounded-[2rem] border backdrop-blur-2xl bg-gradient-to-br p-6 shadow-xl transition-all duration-300",
                                section.accent
                            )}
                        >
                            {/* Section header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                                        {section.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight">
                                            {section.title}
                                        </h2>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                                            {sectionDone} de {sectionTotal} verificados
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-white tabular-nums">
                                        {sectionPct}%
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <ul className="space-y-2">
                                {section.items.map((item) => {
                                    const isChecked = !!checked[item.id];
                                    return (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => toggle(item.id)}
                                                className={cn(
                                                    "w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 active:scale-[0.98]",
                                                    isChecked
                                                        ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15"
                                                )}
                                            >
                                                <span className="mt-0.5 flex-shrink-0">
                                                    {isChecked ? (
                                                        <CheckCircle2
                                                            size={20}
                                                            className="text-emerald-400"
                                                            fill="currentColor"
                                                            fillOpacity={0.15}
                                                        />
                                                    ) : (
                                                        <Circle
                                                            size={20}
                                                            className="text-slate-500"
                                                        />
                                                    )}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-sm leading-snug flex-1",
                                                        isChecked
                                                            ? "text-slate-400 line-through decoration-slate-500"
                                                            : "text-slate-200"
                                                    )}
                                                >
                                                    {item.text}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Footer help */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 text-xs text-slate-400 leading-relaxed">
                <div className="flex items-start gap-3">
                    <RotateCcw size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-slate-300 font-bold mb-1">¿Cómo funciona?</p>
                        <p>
                            Esta es una guía de referencia para que los QC repasen qué se debe revisar. Toca cualquier item para marcarlo/desmarcarlo. El progreso se guarda en este navegador (localStorage). Usa <strong className="text-rose-300">Reiniciar</strong> para volver a cero. Los datos adicionales (porcentaje exacto, observaciones) se anotan en SDigitalSystem, no aquí.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
