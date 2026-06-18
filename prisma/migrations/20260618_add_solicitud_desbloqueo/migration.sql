-- Migración: Módulo de Solicitudes de Desbloqueo
-- Fecha: 2026-06-18
-- Generada para SDigitalSystem

-- 1. Nueva tabla: solicitud_desbloqueo
CREATE TABLE IF NOT EXISTS "solicitud_desbloqueo" (
    "id" SERIAL PRIMARY KEY,
    "codigo" VARCHAR(64) NOT NULL UNIQUE,
    "tecnico_id" INTEGER NOT NULL,
    "imeis" JSONB NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Pendiente QC',
    "observacion" TEXT,
    "qc_id" INTEGER,
    "fecha_qc" TIMESTAMP(6),
    "observacion_qc" TEXT,
    "admin_id" INTEGER,
    "fecha_admin" TIMESTAMP(6),
    "observacion_admin" TEXT,
    "total_equipos" INTEGER NOT NULL DEFAULT 0,
    "equipos_aprobados" INTEGER NOT NULL DEFAULT 0,
    "equipos_rechazados" INTEGER NOT NULL DEFAULT 0,
    "monto_por_equipo" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "monto_total_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índices para consultas rápidas por estado
CREATE INDEX IF NOT EXISTS "idx_solicitud_desbloqueo_estado" ON "solicitud_desbloqueo" ("estado");
CREATE INDEX IF NOT EXISTS "idx_solicitud_desbloqueo_tecnico" ON "solicitud_desbloqueo" ("tecnico_id");
CREATE INDEX IF NOT EXISTS "idx_solicitud_desbloqueo_qc" ON "solicitud_desbloqueo" ("qc_id");
CREATE INDEX IF NOT EXISTS "idx_solicitud_desbloqueo_admin" ON "solicitud_desbloqueo" ("admin_id");
CREATE INDEX IF NOT EXISTS "idx_solicitud_desbloqueo_fecha" ON "solicitud_desbloqueo" ("fecha_creacion");

-- 3. Foreign keys hacia users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitud_desbloqueo_tecnico_id_fkey') THEN
        ALTER TABLE "solicitud_desbloqueo" ADD CONSTRAINT "solicitud_desbloqueo_tecnico_id_fkey"
            FOREIGN KEY ("tecnico_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitud_desbloqueo_qc_id_fkey') THEN
        ALTER TABLE "solicitud_desbloqueo" ADD CONSTRAINT "solicitud_desbloqueo_qc_id_fkey"
            FOREIGN KEY ("qc_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'solicitud_desbloqueo_admin_id_fkey') THEN
        ALTER TABLE "solicitud_desbloqueo" ADD CONSTRAINT "solicitud_desbloqueo_admin_id_fkey"
            FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- 4. Nuevas columnas en equipo: rastrear quién desbloqueó
ALTER TABLE "equipo" ADD COLUMN IF NOT EXISTS "desbloqueado_por_id" INTEGER;
ALTER TABLE "equipo" ADD COLUMN IF NOT EXISTS "fecha_desbloqueo" TIMESTAMP(6);

-- 5. FK en equipo.desbloqueado_por_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equipo_desbloqueado_por_id_fkey') THEN
        ALTER TABLE "equipo" ADD CONSTRAINT "equipo_desbloqueado_por_id_fkey"
            FOREIGN KEY ("desbloqueado_por_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- 6. Índice para consultas por desbloqueador
CREATE INDEX IF NOT EXISTS "idx_equipo_desbloqueado_por" ON "equipo" ("desbloqueado_por_id");
