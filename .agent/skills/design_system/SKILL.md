---
name: apply_rma_design_system
description: Apply the RMA Digital Design System (Premium Light Edition) to create consistent, high-end, and stunning UI components.
---

# RMA Digital Design System (Premium Edition)

When creating or updating pages for the RMA Digital application, ALWAYS follow these design principles to ensure a consistent, premium, and stunning aesthetic. This system evolves the basic layout into a high-end, "Glassy-Solid" hybrid.

## 1. Core Layout & Theme
- **Main Background**: `bg-[#F3F4F6]` or a very subtle gray.
- **Surface Roundness**: Use extreme roundness: `rounded-[2.5rem]` for main containers and `rounded-3xl` for secondary items.
- **Elevations**: Use `shadow-xl shadow-slate-200/50` for standard cards and `shadow-2xl shadow-indigo-100/50` for primary/active elements.

## 2. Typography (The "Black" Aesthetic)
- **Primary Headers**: `text-4xl` to `text-5xl`, `font-black`, `text-slate-800`, `tracking-tighter`.
- **Secondary Headers**: `text-2xl`, `font-black`, `text-slate-800`, `tracking-tight`.
- **Labels (The "RMA Signature")**: `text-[10px]`, `font-black`, `uppercase`, `text-slate-400`, `tracking-[0.2em]` (Use heavily for all metadata labels).
- **Monospace Codes**: `font-mono`, `text-sm`, `bg-slate-50 px-2 py-1 rounded-lg border border-slate-100` for IDs, IMEIs, or Codes.

## 3. Premium Component Patterns

### A. Stats & Cards
- **Stat Cards**: `rounded-[2.5rem]`, `border-none`, `overflow-hidden`.
- **Micro-Detail**: Use a semi-transparent colored circle in the top-right (`absolute -mt-8 -mr-8 w-24 h-24 rounded-full opacity-10`) that scales on group-hover.
- **Icons**: Icons inside cards should be in a `w-12 h-12 rounded-2xl` container with a themed background (e.g., `bg-indigo-600` for primary stats).

### B. List Items (Modern Rows)
- **Profile/Avatar**: Large identifiers (`h-20 w-20`), `rounded-3xl`, `bg-slate-900`. Use `rotate-3` by default and `group-hover:rotate-0` for a playful transition.
- **Sectioning**: Use horizontal layouts on desktop with vertical divider lines (`border-slate-100`) separating Info, Stats, and Actions.
- **Interactive**: `hover:scale-[1.01]` or `hover:scale-[1.02]`, `hover:shadow-2xl`.

### C. Modals (High Clarity)
- **Overlay**: Use standard `DialogOverlay`.
- **Content**: `rounded-[2.5rem]`, `border-none`, `p-0`, `overflow-hidden`.
- **Structure**:
    - **Header**: Large title, themed icon in `bg-*-50` container, `p-8 bg-white border-b`.
    - **Body**: `p-8 bg-slate-50` (subtle contrast).
    - **Actions**: `p-8 bg-white border-t`.
- **Buttons**: `rounded-[2rem]`, `h-16`, `font-black`.

## 4. Color Palette
- **Indigo**: Primary action/Info (`indigo-600`).
- **Emerald**: Success/Credit/Income (`emerald-600`).
- **Rose**: Danger/Withdrawal/Error (`rose-600`).
- **Amber**: Warning/Alert (`amber-600`).
- **Slate-900**: Contrast/Admin elements.

## 5. Animations
- **Entry**: `animate-in fade-in slide-in-from-bottom-6 duration-700`.
- **Micro-interact**: `transition-all duration-300`, `hover:scale-110` for action buttons.

## Implementation Checklist
1.  [ ] Are headers using `font-black` and `tracking-tighter`?
2.  [ ] Do major containers have `rounded-[2.5rem]`?
3.  [ ] Are metadata labels `uppercase` with `tracking-[0.2em]`?
4.  [ ] Did you use entry animations?
5.  [ ] (For Modals) Is the background solid (`bg-white/bg-slate-50`) to avoid bleed?

---
*Example of a Premium Row Container:*
```tsx
<Card className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all group bg-white border border-slate-50">
  <div className="flex flex-col lg:flex-row lg:items-center">
    {/* Content here */}
  </div>
</Card>
```
