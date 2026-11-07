-- ============================================================
-- Módulo «Programación de Controladores e Interfaces Industriales»
-- Foro con coevaluación (pl-foro, 25 %): SOLO el foro (no toca el control de estudio)
-- Solo agrega una fila y reemplaza dos funciones conservando su firma; no renombra ni borra nada.
-- Las sesiones ii-, me-, d1-, tf-, mn- siguen funcionando igual (los cambios valen solo para 'pl-%').
-- Se puede ejecutar más de una vez.
--
-- Fechas (hora de La Paz, UTC−4):
--   abre   sáb 07/11/2026 01:00      = 2026-11-07T05:00:00Z
--   fase 1 hasta sáb 07/11 23:59:59  = 2026-11-08T03:59:59Z   (escribir el aporte)
--   fase 2 hasta dom 08/11 23:59:59  = 2026-11-09T03:59:59Z   (evaluar a 3 compañeros)
-- ============================================================

-- 1. Fila de la sesión del foro (si ya existe, no se toca)
insert into public.estado_sesion (sesion, paso, extra)
values ('pl-foro', 'foro',
        '{"asincrona": true, "foro": true, "abre": "2026-11-07T05:00:00Z", "fase1": "2026-11-08T03:59:59Z", "fase2": "2026-11-09T03:59:59Z", "cierra": "2026-11-09T03:59:59Z"}'::jsonb)
on conflict (sesion) do nothing;

-- 2. Asignación de aportes: en sesiones pl- la cuenta fantasma no participa
--    (ni como autora ni como evaluadora). Para las demás sesiones el resultado es idéntico al anterior.
create or replace function public.foro_asignados_de(p_sesion text, p_carnet text)
returns table (aporte_id bigint, orden int)
language sql stable security definer set search_path = public as $$
  with ap as (
    select distinct on (r.carnet) r.id, r.carnet
    from public.respuestas r
    where r.sesion = p_sesion and r.actividad = 'foro-aporte'
      and (p_sesion not like 'pl-%'
           or not exists (select 1 from public.estudiantes g where g.carnet = r.carnet and g.fantasma))
    order by r.carnet, r.creado
  ), ord as (
    select ap.id, ap.carnet, (row_number() over (order by md5(ap.carnet || '|foro')))::int - 1 as pos
    from ap
  ), tot as (
    select count(*)::int as n from ord
  ), yo as (
    select pos from ord where carnet = p_carnet
  ), par as (
    select tot.n,
      case when exists (select 1 from yo) then (select pos from yo) + 1
           else (abs(hashtext(p_carnet || '|foro-libre')::bigint) % greatest(tot.n, 1))::int end as inicio,
      case when exists (select 1 from yo) then least(3, tot.n - 1) else least(3, tot.n) end as cuantos
    from tot
  )
  select o.id, (g.k + 1)::int
  from par
  cross join lateral generate_series(0, greatest(par.cuantos, 0) - 1) as g(k)
  join ord o on o.pos = ((par.inicio + g.k) % greatest(par.n, 1))
  where par.n > 0
    and (p_sesion not like 'pl-%'
         or not exists (select 1 from public.estudiantes g2 where g2.carnet = p_carnet and g2.fantasma))
  order by g.k;
$$;

-- 3. Reglas del foro por envío. Novedades solo para sesiones pl-:
--    la fantasma no puede enviar nada al foro y el aporte debe traer un enlace de Google Drive o Docs.
create or replace function public.foro_permite(p_sesion text, p_actividad text, p_carnet text, p_resp jsonb)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  f1 timestamptz; f2 timestamptz; v_aporte bigint; v_autor text;
begin
  if p_actividad not in ('foro-aporte', 'foro-eval', 'foro-util') then
    return true;
  end if;
  if p_sesion like 'pl-%'
     and exists (select 1 from public.estudiantes g where g.carnet = p_carnet and g.fantasma) then
    return false;
  end if;
  select nullif(e.extra ->> 'fase1', '')::timestamptz, nullif(e.extra ->> 'fase2', '')::timestamptz
    into f1, f2 from public.estado_sesion e where e.sesion = p_sesion;
  if f1 is null or f2 is null then
    return false;
  end if;

  -- fase 1: un solo aporte por carnet
  if p_actividad = 'foro-aporte' then
    if p_sesion like 'pl-%'
       and coalesce(p_resp ->> 'enlace', '') !~* '^https://(drive|docs)\.google\.com/[^[:space:]]+$' then
      return false;
    end if;
    return now() <= f1 and not exists (
      select 1 from public.respuestas r where r.sesion = p_sesion and r.actividad = 'foro-aporte' and r.carnet = p_carnet);
  end if;

  -- fase 2: evaluaciones y valoración de comentarios
  if now() <= f1 or now() > f2 then
    return false;
  end if;

  if p_actividad = 'foro-eval' then
    if coalesce(p_resp ->> 'aporte', '') !~ '^[0-9]+$' then return false; end if;
    v_aporte := (p_resp ->> 'aporte')::bigint;
    return exists (select 1 from public.foro_asignados_de(p_sesion, p_carnet) a where a.aporte_id = v_aporte)
       and not exists (select 1 from public.respuestas r
                       where r.sesion = p_sesion and r.actividad = 'foro-eval' and r.carnet = p_carnet
                         and r.respuesta ->> 'aporte' = v_aporte::text);
  end if;

  -- 'foro-util': solo el autor del aporte comentado puede valorar el comentario
  if coalesce(p_resp ->> 'eval', '') !~ '^[0-9]+$' then return false; end if;
  select (r.respuesta ->> 'aporte')::bigint into v_aporte
    from public.respuestas r
    where r.id = (p_resp ->> 'eval')::bigint and r.sesion = p_sesion and r.actividad = 'foro-eval';
  if v_aporte is null then return false; end if;
  select r.carnet into v_autor from public.respuestas r where r.id = v_aporte;
  return v_autor = p_carnet;
end;
$$;
