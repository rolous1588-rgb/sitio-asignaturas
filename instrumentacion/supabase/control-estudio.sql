-- ============================================================
-- Control de estudio (sesión asíncrona) y evaluaciones de un solo intento
-- Se aplica una vez en Supabase (SQL Editor) o como migración.
-- ============================================================

-- 1) Sesiones asíncronas (estado_sesion.extra.asincrona = true): aceptan envíos solo entre extra.abre y extra.cierra.
--    Las sesiones en vivo siguen con la regla de siempre (paso actual o 15 min de margen).
create or replace function public.actividad_abierta(p_sesion text, p_actividad text)
returns boolean language sql stable security definer set search_path = public as $$
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
          and (e.paso = p_actividad or e.actualizado > now() - interval '15 minutes'))
  end;
$$;

-- 2) Evaluaciones de un solo intento: 'eval-inicio' (empieza) y 'eval' (envía) una sola vez por carnet.
--    Si la sesión tiene extra.minutos, el envío se acepta solo dentro de ese tiempo (+2 min de margen de red).
create or replace function public.evaluacion_permite(p_sesion text, p_actividad text, p_carnet text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_actividad = 'eval-inicio' then not exists (
      select 1 from public.respuestas r where r.sesion = p_sesion and r.actividad = 'eval-inicio' and r.carnet = p_carnet)
    when p_actividad = 'eval' then
      not exists (select 1 from public.respuestas r where r.sesion = p_sesion and r.actividad = 'eval' and r.carnet = p_carnet)
      and exists (select 1 from public.respuestas r where r.sesion = p_sesion and r.actividad = 'eval-inicio' and r.carnet = p_carnet)
      and not exists (
        select 1 from public.estado_sesion e
        join public.respuestas r on r.sesion = e.sesion and r.actividad = 'eval-inicio' and r.carnet = p_carnet
        where e.sesion = p_sesion and nullif(e.extra ->> 'minutos', '') is not null
          and now() > r.creado + make_interval(mins => (e.extra ->> 'minutos')::int) + interval '2 minutes')
    else true
  end;
$$;
grant execute on function public.evaluacion_permite(text, text, text) to anon, authenticated;

-- 3) Garantía extra contra dobles envíos simultáneos
create unique index if not exists respuestas_eval_unica on public.respuestas (sesion, carnet, actividad)
  where actividad in ('eval-inicio', 'eval');

-- 4) Política de inserción: suma la regla de evaluación y evita que el cliente falsee la hora (creado)
drop policy if exists "estudiantes envian respuestas" on public.respuestas;
create policy "estudiantes envian respuestas" on public.respuestas
  for insert to anon, authenticated
  with check (char_length(carnet) between 3 and 20 and intento between 1 and 5 and puntaje between 0 and 100
              and public.actividad_abierta(sesion, actividad)
              and public.evaluacion_permite(sesion, actividad, carnet)
              and creado between now() - interval '2 minutes' and now() + interval '2 minutes');

-- 5) Estado de la evaluación para un carnet (hora del servidor, inicio, si ya envió, ventana y minutos)
create or replace function public.estado_evaluacion(p_sesion text, p_carnet text)
returns table (ahora timestamptz, inicio timestamptz, enviado boolean, minutos int, abre timestamptz, cierra timestamptz)
language sql stable security definer set search_path = public as $$
  select now(),
    (select min(r.creado) from public.respuestas r where r.sesion = p_sesion and r.actividad = 'eval-inicio' and r.carnet = p_carnet),
    exists (select 1 from public.respuestas r where r.sesion = p_sesion and r.actividad = 'eval' and r.carnet = p_carnet),
    (select nullif(e.extra ->> 'minutos', '')::int from public.estado_sesion e where e.sesion = p_sesion),
    (select nullif(e.extra ->> 'abre', '')::timestamptz from public.estado_sesion e where e.sesion = p_sesion),
    (select nullif(e.extra ->> 'cierra', '')::timestamptz from public.estado_sesion e where e.sesion = p_sesion);
$$;
grant execute on function public.estado_evaluacion(text, text) to anon, authenticated;

-- 6) Fila del Control de estudio: cerrada (abre = null) hasta que el docente la apruebe.
--    Cierra el jueves 08/10/2026 a las 23:59 de La Paz (= 09/10 03:59:59 UTC).
insert into public.estado_sesion (sesion, paso, extra)
values ('ii-ce', 'estudio', '{"asincrona": true, "abre": null, "cierra": "2026-10-09T03:59:59Z", "minutos": 20}'::jsonb)
on conflict (sesion) do update set extra = excluded.extra;
