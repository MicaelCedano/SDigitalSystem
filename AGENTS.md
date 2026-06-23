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

## 📋 Tareas Recientes (2026-06-05)
- [x] **KPIs financieros en dashboard admin (2026-06-23)**: 4 cards nuevos arriba de los existentes: $ Pagado esta semana, $ Pendiente de pago, $ Pagado hoy, $ Pagado este mes (con % vs mes anterior y flecha ▲/▼). Datos via `getAdminPaymentsDashboardData()` extendida con 5 campos nuevos en `stats`. Bug fix colateral: el "Pago Estimado" de los lotes ahora cuenta `revisados * 50` (antes contaba `total * 50`, inflando el número). Commit `d8ca446` pusheado a main.
- [x] **Colapsar/expandir sección 'Revisión por QC' (2026-06-23)**: Header de la sección de QC en el detalle de compra ahora es clickeable. Un clic colapsa con animación y muestra un resumen compacto (chips de QCs/revisados/no-funcionales/pendientes); otro clic expande. El estado se persiste por compra en `localStorage` con key `sdigital.qc.collapsed.<purchaseId>`, así que cada compra tiene su propia preferencia y sobrevive a recargas. Accesibilidad: `aria-expanded`, `aria-controls`, focus ring. Commit `8054f9b` pusheado a main (Vercel deploy 1-3 min).
- [x] **Alineación de Zona Horaria (Santo Domingo)**: Se implementó una solución robusta para alinear toda la lógica de fechas y horas de la aplicación a la zona horaria de Santo Domingo (America/Santo_Domingo, UTC-4). Esto resuelve de forma definitiva el problema donde el día cambiaba a las 8:00 PM (debido a la zona horaria UTC del servidor), afectando estadísticas, conteos diarios de equipos revisados y nombres/fechas de lotes y reportes de Excel.
- [x] **Organización Inteligente de Equipos en Compras**: Se implementó un algoritmo de ordenamiento inteligente (smart sorting) para organizar de manera coherente los equipos de las compras al generar el archivo Excel y reportes PDF. Ahora los equipos se ordenan de forma natural y ascendente por marca (Apple/iPhone primero), modelo/generación (ej. iPhone 11 -> 12 -> 12 Pro -> 13 -> 13 Pro Max), capacidad de almacenamiento, color, grado e IMEI, evitando que se listen de forma desordenada o aleatoria.
- [x] **Conceptos Dinámicos en Bauchers**: Se modificó la categorización de ingresos en el desglose del Baucher de Pago para que las acreditaciones manuales u otros conceptos específicos (como "Combustible") se muestren con su descripción original capitalizada en lugar de agruparse en "Otros", evitando confusiones. Además, se agrupan todos los armados de bicicletas en un único concepto unificado ("Armado de Bicicletas") sumando sus unidades respectivas para optimizar el espacio.
- [x] **Rediseño de PendingWorkApproval**: Se optimizó el modal de detalles del técnico con el nuevo sistema de diseño para evitar la visualización "amontonada".
- [x] **Centralización de Agenda**: Creación de este archivo `AGENTS.md`.
- [x] **Ajuste de Pagos de Técnicos**: Se implementó la capacidad de ajustar el monto por equipo durante el proceso de aprobación de reportes de trabajo, permitiendo pagos personalizados y automáticos.
- [x] **Rediseño Premium de Aprobación**: Se rediseñó el modal de aprobación de lotes con una estética premium, incluyendo balance en tiempo real y mejor visualización de equipos.
- [x] **Gestión Rápida de Tarifas**: Se añadió una sección en el dashboard principal para ver el balance y ajustar la tarifa de cada técnico de forma directa.
- [x] **Simplificación de Aprobación**: Se eliminó la opción de "Forzar Aprobación" para lotes abiertos. Ahora solo se permite "Aceptar" cuando el lote está en estado "Pendiente" (terminado).
- [x] **Limpieza de Dashboard**: Se movieron los botones de acción de lotes (Aceptar, Devolver, Cancelar) del dashboard principal al modal de "Ver Detalles" para evitar saturación visual.

## 📌 Pendientes
- Revisar consistencia de otros modales del dashboard.
- Optimizar la carga de tablas grandes.
