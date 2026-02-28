# Design System: RMA SDigital V2

Based on UI/UX Pro Max guidelines for **Dashboard / Enterprise Logistics**.

## 1. Core Visual Style: "Cyber-Glass Professional"
A blend of premium aesthetics with highly functional data density.

- **Background**: Deep obsidian (`#020617`) with subtle mesh gradients in the corners.
- **Glassmorphism**: Primary container style using `bg-card/40 backdrop-blur-2xl border-white/5`.
- **Accents**: 
  - Primary: Indigo-600 (`#4f46e5`) -> Violet-500 (`#8b5cf6`)
  - Accent: Cyan-400 (`#22d3ee`) for highlighting "New" or "Active" states.
  - Alarms: Rose-500 (`#f43f5e`) for critical RMA delays.

## 2. Typography
- **Headings**: `Outfit` (Bold/Black) with tight tracking (`tracking-tighter`).
- **Body**: `Inter` or `Geist Sans` for maximum legibility in data tables.
- **Monospace**: `Geist Mono` for IMEI/Serial Numbers for clarity.

## 3. Interaction Patterns
- **Card Hover**: `hover:-translate-y-1 hover:shadow-primary/10 transition-all duration-500`.
- **Button Feedback**: `active:scale-95 transition-transform`.
- **Loading**: Pulse skeletons for all data-fetching components.

## 4. UI Components (Dashboard-Specific)
- **Stats Grid**: 4 columns on desktop, 1 on mobile. Large black values.
- **Data Table**: Glass effect header, semi-transparent rows, highlighted IMEIs.
- **Activity Feed**: Gradient vertical line, animated entry for new events.

## 5. Accessibility & UX
- **Contrast**: Ensuring 4.5:1 ratio even on glass surfaces.
- **Touch Targets**: 44px minimum for mobile navigation.
- **Empty States**: Illustrated using Lucide icons with low opacity.
