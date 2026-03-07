# RMA SDigital V2 - AGENTS Agenda

Este archivo sirve como memoria central para los agentes de IA que trabajan en este proyecto. Aquí se documentan las configuraciones, el estado actual y las reglas de diseño.

## 🛠️ Stack Tecnológico
- **Framework**: Next.js 15+ (App Router)
- **Base de Datos**: Prisma con SQLite (dev.db)
- **Estilos**: Tailwind CSS 4.0
- **Componentes**: Shadcn UI + Lucide Icons
- **Estado**: Next-Auth para autenticación

## 🎨 Design System (RMA Premium Light)
Seguimos el sistema de diseño **"Glassy-Solid Hybrid"**.
- **Contenedores**: `rounded-[2.5rem]`, `border-none`, `shadow-xl`.
- **Tipografía**: Headers con `font-black` y `tracking-tighter`. Labels en `uppercase`, `text-[10px]`, `tracking-[0.2em]`.
- **Botones**: Altura `h-14` o `h-16`, muy redondeados, con sombras de color.
- **Colores**: Indigo-600 (Primary), Emerald-600 (Success), Amber-600 (Warning), Rose-600 (Error).

## 📋 Tareas Recientes (2026-03-07)
- [x] **Rediseño de PendingWorkApproval**: Se optimizó el modal de detalles del técnico con el nuevo sistema de diseño para evitar la visualización "amontonada".
- [x] **Centralización de Agenda**: Creación de este archivo `AGENTS.md`.

## 📌 Pendientes
- Revisar consistencia de otros modales del dashboard.
- Optimizar la carga de tablas grandes.
