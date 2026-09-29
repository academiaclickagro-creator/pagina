-- ========================================================
-- ACADEMIA CLICK AGRO - SCHEMA DE SUPABASE (AGENDA AGRO 2027)
-- Base de Datos: https://kigeuajghtzzzyfkljrs.supabase.co
-- Ejecutar en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/kigeuajghtzzzyfkljrs/sql/new
-- ========================================================

-- 1. TABLA: pedidos_fisica (Agenda Física Impresa - $150.000)
CREATE TABLE IF NOT EXISTS public.pedidos_fisica (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    fecha TEXT NOT NULL,
    nombre TEXT NOT NULL,
    dni TEXT NOT NULL,
    tel TEXT NOT NULL,
    email TEXT,
    direccion TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    provincia TEXT NOT NULL,
    cp TEXT NOT NULL,
    notas TEXT,
    cuotas TEXT DEFAULT '1 pago de $150.000',
    monto NUMERIC NOT NULL DEFAULT 150000,
    estado_pago TEXT NOT NULL DEFAULT 'Registrado', -- 'Pendiente', 'Registrado', 'Confirmado'
    estado_despacho TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'En preparación', 'Despachado', 'Entregado'
    numero_guia TEXT DEFAULT '',
    origen TEXT DEFAULT 'web'
);

-- 2. TABLA: pedidos_digital (Agenda Digital Editable - $50.000)
CREATE TABLE IF NOT EXISTS public.pedidos_digital (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    fecha TEXT NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    tel TEXT NOT NULL,
    cuotas TEXT DEFAULT '1 pago de $50.000',
    monto NUMERIC NOT NULL DEFAULT 50000,
    estado_pago TEXT NOT NULL DEFAULT 'Registrado', -- 'Pendiente', 'Registrado', 'Confirmado'
    enviado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_envio TEXT,
    enviado_por TEXT,
    origen TEXT DEFAULT 'web'
);

-- 3. ÍNDICES DE RENDIMIENTO Y BÚSQUEDA
CREATE INDEX IF NOT EXISTS idx_pedidos_fisica_created_at ON public.pedidos_fisica (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_fisica_estado_pago ON public.pedidos_fisica (estado_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_fisica_email ON public.pedidos_fisica (email);

CREATE INDEX IF NOT EXISTS idx_pedidos_digital_created_at ON public.pedidos_digital (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_digital_email ON public.pedidos_digital (email);
CREATE INDEX IF NOT EXISTS idx_pedidos_digital_enviado ON public.pedidos_digital (enviado);

-- 4. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
ALTER TABLE public.pedidos_fisica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_digital ENABLE ROW LEVEL SECURITY;

-- Permitir a visitantes registrar pedidos (INSERT público desde landing):
DROP POLICY IF EXISTS "Permitir inserción pública de pedidos físicos" ON public.pedidos_fisica;
CREATE POLICY "Permitir inserción pública de pedidos físicos"
ON public.pedidos_fisica FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserción pública de pedidos digitales" ON public.pedidos_digital;
CREATE POLICY "Permitir inserción pública de pedidos digitales"
ON public.pedidos_digital FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir lectura y gestión al panel admin:
DROP POLICY IF EXISTS "Permitir lectura de pedidos físicos" ON public.pedidos_fisica;
CREATE POLICY "Permitir lectura de pedidos físicos"
ON public.pedidos_fisica FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir lectura de pedidos digitales" ON public.pedidos_digital;
CREATE POLICY "Permitir lectura de pedidos digitales"
ON public.pedidos_digital FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualización de pedidos físicos" ON public.pedidos_fisica;
CREATE POLICY "Permitir actualización de pedidos físicos"
ON public.pedidos_fisica FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualización de pedidos digitales" ON public.pedidos_digital;
CREATE POLICY "Permitir actualización de pedidos digitales"
ON public.pedidos_digital FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminación de pedidos físicos" ON public.pedidos_fisica;
CREATE POLICY "Permitir eliminación de pedidos físicos"
ON public.pedidos_fisica FOR DELETE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir eliminación de pedidos digitales" ON public.pedidos_digital;
CREATE POLICY "Permitir eliminación de pedidos digitales"
ON public.pedidos_digital FOR DELETE
TO anon, authenticated
USING (true);

-- 5. HABILITAR REALTIME (Sincronización instantánea con el panel de administración)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_fisica;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos_digital;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
