-- Migración: modal de cierre de expediente
-- Correr en Supabase Dashboard → SQL Editor

-- 1. Crear tabla motivos_cierre
CREATE TABLE IF NOT EXISTS public.motivos_cierre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  estudio_id uuid NOT NULL
);

-- 2. RLS permisivo para el estudio (igual que otras tablas de la app)
ALTER TABLE public.motivos_cierre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "motivos_cierre_select" ON public.motivos_cierre
  FOR SELECT USING (true);

CREATE POLICY "motivos_cierre_insert" ON public.motivos_cierre
  FOR INSERT WITH CHECK (true);

-- 3. Datos iniciales para Guazzaroni Escuredo
INSERT INTO public.motivos_cierre (texto, estudio_id) VALUES
  ('Acuerdo homologado',  '51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'),
  ('Sentencia firme',     '51cc9627-71d2-4cab-a3d5-c5490b3b3e4b'),
  ('Desistimiento',       '51cc9627-71d2-4cab-a3d5-c5490b3b3e4b');

-- 4. Agregar columnas a expedientes
ALTER TABLE public.expedientes
  ADD COLUMN IF NOT EXISTS motivo_cierre text,
  ADD COLUMN IF NOT EXISTS fecha_cierre  date;
