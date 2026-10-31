-- ============================================================
-- Módulo «Programación de PLCs e Interfaces Industriales»
-- Cambios de estructura de la base. SOLO AGREGAN: no renombran ni borran nada
-- y no tocan las sesiones ii-, me-, d1-, tf-, mn-.
-- Se puede ejecutar más de una vez sin problema.
-- Ejecutar en Supabase → SQL Editor → pegar todo → Run.
-- ============================================================

-- 1. Presencia: última vez que el estudiante estuvo en la clase
alter table public.ingresos add column if not exists visto timestamptz;

-- 2. Ruleta: a quién se llamó y qué pasó (la respuesta oral NO da puntos)
create table if not exists public.ruleta (
  id bigint generated always as identity primary key,
  sesion text not null,
  carnet text not null,
  nombre text not null,
  resultado text not null check (resultado in ('responde', 'no_responde', 'omitir')),
  paso text,
  creado timestamptz not null default now(),
  anulado boolean not null default false
);
create index if not exists ruleta_sesion_idx on public.ruleta (sesion);

-- 3. Pendientes trasladados de una sesión a otra (la sesión de origen no se toca)
create table if not exists public.pendientes (
  id bigint generated always as identity primary key,
  sesion_origen text not null,
  actividad text not null,
  sesion_destino text not null,
  creado timestamptz not null default now()
);
create index if not exists pendientes_destino_idx on public.pendientes (sesion_destino);

-- 4. Permisos y seguridad por filas (solo el docente ve y cambia estas tablas)
alter table public.ruleta enable row level security;
alter table public.pendientes enable row level security;
grant select, insert, update, delete on public.ruleta, public.pendientes to authenticated;

drop policy if exists "docente maneja ruleta" on public.ruleta;
create policy "docente maneja ruleta" on public.ruleta
  for all to authenticated using (public.es_docente()) with check (public.es_docente());
drop policy if exists "docente maneja pendientes" on public.pendientes;
create policy "docente maneja pendientes" on public.pendientes
  for all to authenticated using (public.es_docente()) with check (public.es_docente());

-- 5. Latido: el estudiante avisa cada 20 s que sigue en la clase (no necesita permisos de tabla)
create or replace function public.latido(p_sesion text, p_carnet text)
returns void
language sql security definer set search_path = public
as $$
  update public.ingresos set visto = now()
  where id = (select max(id) from public.ingresos where sesion = p_sesion and carnet = p_carnet);
$$;
grant execute on function public.latido(text, text) to anon, authenticated;

-- 6. Conectados ahora (visto en los últimos 60 s). Solo el docente.
create or replace function public.conectados(p_sesion text)
returns table (carnet text, nombre text)
language sql stable security definer set search_path = public
as $$
  select distinct on (i.carnet) i.carnet, i.nombre
  from public.ingresos i
  where public.es_docente() and i.sesion = p_sesion and i.visto > now() - interval '60 seconds'
  order by i.carnet, i.id desc;
$$;
grant execute on function public.conectados(text) to authenticated;

-- 7. Sorteo de la ruleta: solo entre los conectados; no repite hasta que todos hayan salido
create or replace function public.sortear_ruleta(p_sesion text)
returns table (carnet text, nombre text)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.es_docente() then return; end if;
  return query
    with con as (select * from public.conectados(p_sesion)),
    libres as (
      select c.* from con c
      where not exists (select 1 from public.ruleta r
                        where r.sesion = p_sesion and r.carnet = c.carnet and not r.anulado)
    ),
    elegibles as (
      select * from libres
      union all
      select c.* from con c where not exists (select 1 from libres)
    )
    select e.carnet, e.nombre from elegibles e order by random() limit 1;
end;
$$;
grant execute on function public.sortear_ruleta(text) to authenticated;

-- 8. Cuántas veces «no respondió» cada estudiante (para la penalización diaria)
create or replace function public.participacion_dia(p_sesion text)
returns table (carnet text, no_responde bigint)
language sql stable security definer set search_path = public
as $$
  select r.carnet, count(*) from public.ruleta r
  where public.es_docente() and r.sesion = p_sesion and r.resultado = 'no_responde' and not r.anulado
  group by r.carnet;
$$;
grant execute on function public.participacion_dia(text) to authenticated;

-- 9. Respuestas: no se aceptan durante una pausa ni después de «Terminar clase».
--    Excepciones: el ingreso, y los pendientes trasladados ('traslado:…') solo si el docente los habilitó.
--    IMPORTANTE: se conserva tal cual la rama de sesiones asíncronas (abre/cierra) que ya usan otras materias;
--    en las demás materias no existen las claves pausa / cierre_anticipado / trasladados, así que nada cambia.
create or replace function public.actividad_abierta(p_sesion text, p_actividad text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case
    when exists (select 1 from public.estado_sesion e
                 where e.sesion = p_sesion and coalesce((e.extra ->> 'asincrona')::boolean, false))
      then p_actividad = 'ingreso' or exists (
        select 1 from public.estado_sesion e
        where e.sesion = p_sesion
          and nullif(e.extra ->> 'abre', '') is not null
          and now() >= (e.extra ->> 'abre')::timestamptz
          and now() <= coalesce(nullif(e.extra ->> 'cierra', '')::timestamptz, 'infinity'::timestamptz))
    else p_actividad = 'ingreso' or exists (
        select 1 from public.estado_sesion e
        where e.sesion = p_sesion
          and not coalesce((e.extra ->> 'cierre_anticipado')::boolean, false)
          and not (coalesce(e.extra #>> '{pausa,hasta}', '') <> ''
                   and (e.extra #>> '{pausa,hasta}')::timestamptz > now())
          and (case
                 when p_actividad like 'traslado:%'
                   then coalesce(e.extra -> 'trasladados', '[]'::jsonb) ? p_actividad
                 else (e.paso = p_actividad or e.actualizado > now() - interval '15 minutes')
               end))
  end;
$$;
grant execute on function public.actividad_abierta(text, text) to anon, authenticated;

-- 10. Filas de estado de las sesiones del módulo (con el prefijo pl-)
insert into public.estado_sesion (sesion) values ('pl-s1')
on conflict do nothing;

select 'Listo: módulo PLC preparado' as resultado;
