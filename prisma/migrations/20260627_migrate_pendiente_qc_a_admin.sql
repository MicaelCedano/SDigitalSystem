-- Migración retroactiva: solicitudes atrapadas en "Pendiente QC" → "Pendiente Admin"
-- FECHA: 2026-06-27
-- POR QUÉ: se eliminó el paso de QC del flujo de desbloqueos. Las solicitudes
--           que quedaron en "Pendiente QC" antes del cambio (típicamente porque
--           ningún QC las revisó) ahora aparecen en la bandeja del admin para
--           que Micael las apruebe directo.
--
-- ANTES DE CORRER:
--   1. Hacer backup de la tabla por si acaso:
--      CREATE TABLE solicitud_desbloqueo_backup_20260627 AS
--        SELECT * FROM solicitud_desbloqueo;
--   2. Contar cuántas se van a mover (debe ser 0 si la página /admin/desbloqueos
--      nunca estuvo vacía con banner ámbar):
--      SELECT COUNT(*) FROM solicitud_desbloqueo WHERE estado = 'Pendiente QC';
--
-- QUÉ HACE:
--   1. Mueve las solicitudes en 'Pendiente QC' a 'Pendiente Admin' (sin pago aún).
--   2. Pone qc_id = NULL porque ya no hay QC asignado (el campo queda para
--      auditoría histórica de solicitudes anteriores, no se reutiliza).
--   3. NO toca solicitudes 'Aprobado' / 'Rechazado'.
--   4. NO toca solicitudes 'Pendiente Admin' (ya están donde deben).
--
-- DESPUÉS DE CORRER:
--   - Verificar que todo se movió:
--     SELECT estado, COUNT(*) FROM solicitud_desbloqueo GROUP BY estado;
--   - Verificar que aparecen en /admin/desbloqueos en producción.
--   - Si hay alguna que NO quieras aprobar, cámbiala a 'Rechazado' a mano desde
--     el panel admin o directo en BD.

BEGIN;

UPDATE solicitud_desbloqueo
SET estado = 'Pendiente Admin'
WHERE estado = 'Pendiente QC';

COMMIT;

-- Verificación post-migración:
-- SELECT estado, COUNT(*) AS total FROM solicitud_desbloqueo GROUP BY estado ORDER BY estado;
