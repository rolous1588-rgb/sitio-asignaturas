-- ============================================================
-- Plataforma Instrumentación Industrial — estructura de datos
-- Ejecutar UNA sola vez en Supabase → SQL Editor → Run
-- ============================================================

-- 1. Tablas
create table if not exists public.docentes (
  email text primary key
);

create table if not exists public.estado_sesion (
  sesion text primary key,
  paso text not null default 'inicio',
  reto_abierto boolean not null default false,
  mostrar_resumen boolean not null default false,
  extra jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);

create table if not exists public.ingresos (
  id bigint generated always as identity primary key,
  sesion text not null,
  carnet text not null,
  nombre text not null,
  info jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now()
);

create table if not exists public.respuestas (
  id bigint generated always as identity primary key,
  sesion text not null,
  actividad text not null,
  carnet text not null,
  nombre text not null,
  respuesta jsonb not null default '{}'::jsonb,
  correcta boolean,
  intento smallint not null default 1,
  confianza text,
  puntaje numeric not null default 0,
  creado timestamptz not null default now()
);

create index if not exists respuestas_sesion_idx on public.respuestas (sesion, actividad);
create index if not exists ingresos_sesion_idx on public.ingresos (sesion);

-- 2. ¿El usuario conectado es docente?
create or replace function public.es_docente()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.docentes where email = (auth.jwt() ->> 'email')
  );
$$;

-- 3. Permisos
grant usage on schema public to anon, authenticated;
grant select on public.estado_sesion to anon, authenticated;
grant insert, update on public.estado_sesion to authenticated;
grant insert on public.ingresos, public.respuestas to anon, authenticated;
grant select, delete on public.ingresos, public.respuestas to authenticated;
grant select on public.docentes to authenticated;

-- 4. Seguridad por filas (RLS)
alter table public.docentes     enable row level security;
alter table public.estado_sesion enable row level security;
alter table public.ingresos     enable row level security;
alter table public.respuestas   enable row level security;

create policy "docente lee docentes" on public.docentes
  for select to authenticated using (public.es_docente());

-- estado de la clase: todos lo leen, solo el docente lo cambia
create policy "todos leen estado" on public.estado_sesion
  for select to anon, authenticated using (true);
create policy "docente crea estado" on public.estado_sesion
  for insert to authenticated with check (public.es_docente());
create policy "docente cambia estado" on public.estado_sesion
  for update to authenticated using (public.es_docente()) with check (public.es_docente());

-- ingresos y respuestas: los estudiantes solo envían; el docente ve todo
create policy "estudiantes registran ingreso" on public.ingresos
  for insert to anon, authenticated
  with check (char_length(carnet) between 3 and 20 and char_length(nombre) between 2 and 80);
create policy "docente lee ingresos" on public.ingresos
  for select to authenticated using (public.es_docente());
create policy "docente borra ingresos" on public.ingresos
  for delete to authenticated using (public.es_docente());

-- Solo se aceptan respuestas de la actividad que la clase tiene abierta
-- (o durante 15 minutos después de cualquier cambio de paso, para no perder envíos atrasados).
create or replace function public.actividad_abierta(p_sesion text, p_actividad text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select p_actividad = 'ingreso' or exists (
    select 1 from public.estado_sesion e
    where e.sesion = p_sesion
      and (e.paso = p_actividad or e.actualizado > now() - interval '15 minutes')
  );
$$;
grant execute on function public.actividad_abierta(text, text) to anon, authenticated;

create policy "estudiantes envian respuestas" on public.respuestas
  for insert to anon, authenticated
  with check (char_length(carnet) between 3 and 20 and intento between 1 and 5 and puntaje between 0 and 100
              and public.actividad_abierta(sesion, actividad));
create policy "docente lee respuestas" on public.respuestas
  for select to authenticated using (public.es_docente());
create policy "docente borra respuestas" on public.respuestas
  for delete to authenticated using (public.es_docente());

-- 5. Resumen anónimo (sin nombres) para proyectar en Zoom
create or replace function public.resumen_actividad(p_sesion text, p_actividad text)
returns table (total bigint, correctas bigint, seguros_errados bigint, dudosos bigint)
language sql stable security definer set search_path = public
as $$
  with ultimas as (
    select distinct on (carnet) carnet, correcta, confianza
    from public.respuestas
    where sesion = p_sesion and actividad = p_actividad
      and coalesce((respuesta ->> 'vacio')::boolean, false) = false  -- sin los "no respondió"
    order by carnet, creado desc
  )
  select count(*),
         count(*) filter (where correcta),
         count(*) filter (where not correcta and confianza = 'seguro'),
         count(*) filter (where confianza = 'dudas')
  from ultimas;
$$;
grant execute on function public.resumen_actividad(text, text) to anon, authenticated;

-- Conteo anónimo por opción de una pregunta rápida (barras en Zoom)
create or replace function public.resumen_opciones(p_sesion text, p_actividad text)
returns table (opcion int, n bigint)
language sql stable security definer set search_path = public
as $$
  with ultimas as (
    select distinct on (carnet) carnet, respuesta
    from public.respuestas
    where sesion = p_sesion and actividad = p_actividad
      and coalesce((respuesta ->> 'vacio')::boolean, false) = false
      and (respuesta ->> 'opcion') ~ '^[0-9]+$'
    order by carnet, creado desc
  )
  select (respuesta ->> 'opcion')::int, count(*) from ultimas group by 1 order by 1;
$$;
grant execute on function public.resumen_opciones(text, text) to anon, authenticated;

-- 6. Tiempo real
alter publication supabase_realtime add table public.estado_sesion, public.respuestas, public.ingresos;

-- 7. Cuenta docente y las 6 sesiones del módulo
insert into public.docentes (email) values ('TU_CORREO_DE_DOCENTE') on conflict do nothing;
insert into public.estado_sesion (sesion) values
  ('ii-s1'), ('ii-s2'), ('ii-s3'), ('ii-s4'), ('ii-s5'), ('ii-s6')
on conflict do nothing;

select 'Listo: estructura creada' as resultado;

-- Sesiones asíncronas (Control de estudio) y evaluaciones de un solo intento:
-- ejecutar después el archivo control-estudio.sql
