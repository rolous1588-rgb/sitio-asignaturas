-- ============================================================
-- Foro con coevaluación (sesión ii-foro) · se aplica una vez en Supabase → SQL Editor → Run
-- Fase 1 (hasta extra.fase1): cada estudiante publica UN aporte ('foro-aporte').
-- Fase 2 (de fase1 a fase2): evalúa los aportes que le asigna el servidor ('foro-eval')
--   y marca si le sirvieron los comentarios que recibió ('foro-util').
-- Los estudiantes nunca ven nombres ni carnets de otros: solo textos.
-- ============================================================

-- 1) Asignación de aportes a evaluar (determinista, la calcula el servidor)
--    Los aportes se ordenan por un hash del carnet del autor. Cada autor evalúa a los 3 siguientes
--    (así cada aporte recibe 3 evaluaciones de autores). Quien no publicó aporte evalúa 3 desde
--    una posición pseudoaleatoria. Con 3 aportes o menos, cada autor evalúa a todos los demás.
create or replace function public.foro_asignados_de(p_sesion text, p_carnet text)
returns table (aporte_id bigint, orden int)
language sql stable security definer set search_path = public as $$
  with ap as (
    select distinct on (r.carnet) r.id, r.carnet
    from public.respuestas r
    where r.sesion = p_sesion and r.actividad = 'foro-aporte'
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
  order by g.k;
$$;

-- 2) Reglas del foro para cada envío (se suman a la política de inserción)
create or replace function public.foro_permite(p_sesion text, p_actividad text, p_carnet text, p_resp jsonb)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  f1 timestamptz; f2 timestamptz; v_aporte bigint; v_autor text;
begin
  if p_actividad not in ('foro-aporte', 'foro-eval', 'foro-util') then
    return true;
  end if;
  select nullif(e.extra ->> 'fase1', '')::timestamptz, nullif(e.extra ->> 'fase2', '')::timestamptz
    into f1, f2 from public.estado_sesion e where e.sesion = p_sesion;
  if f1 is null or f2 is null then
    return false;
  end if;

  -- fase 1: un solo aporte por carnet
  if p_actividad = 'foro-aporte' then
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
grant execute on function public.foro_permite(text, text, text, jsonb) to anon, authenticated;

-- 3) Política de inserción: la misma de antes + las reglas del foro
drop policy if exists "estudiantes envian respuestas" on public.respuestas;
create policy "estudiantes envian respuestas" on public.respuestas
  for insert to anon, authenticated
  with check (char_length(carnet) between 3 and 20 and intento between 1 and 5 and puntaje between 0 and 100
              and public.actividad_abierta(sesion, actividad)
              and public.evaluacion_permite(sesion, actividad, carnet)
              and public.foro_permite(sesion, actividad, carnet, respuesta)
              and creado between now() - interval '2 minutes' and now() + interval '2 minutes');

-- 4) Lo que ve un estudiante (sin nombres ni carnets de otros):
--    hora del servidor, fechas, su aporte, los aportes que le tocan, sus evaluaciones hechas
--    y los comentarios que recibió. Los textos de otros recién se ven en la fase 2.
create or replace function public.foro_estado(p_sesion text, p_carnet text)
returns jsonb
language sql stable security definer set search_path = public as $$
  with cfg as (
    select nullif(e.extra ->> 'abre', '')::timestamptz as abre,
           nullif(e.extra ->> 'fase1', '')::timestamptz as f1,
           nullif(e.extra ->> 'fase2', '')::timestamptz as f2
    from public.estado_sesion e where e.sesion = p_sesion
  ), mio as (
    select r.id, r.respuesta, r.creado from public.respuestas r
    where r.sesion = p_sesion and r.actividad = 'foro-aporte' and r.carnet = p_carnet
    order by r.creado limit 1
  ), fase2 as (
    select coalesce(now() > (select f1 from cfg), false) as si
  )
  select jsonb_build_object(
    'ahora', now(),
    'abre', (select abre from cfg),
    'fase1', (select f1 from cfg),
    'fase2', (select f2 from cfg),
    'aporte', (select jsonb_build_object('id', m.id, 'creado', m.creado, 'palabras', m.respuesta -> 'palabras',
                 -- el texto propio recién se devuelve en la fase 2 (en la fase 1 nadie puede leer aportes ajenos)
                 'texto', case when (select si from fase2) then m.respuesta else null end) from mio m),
    'asignados', case when (select si from fase2) then coalesce((
        select jsonb_agg(jsonb_build_object('id', r.id, 'texto', r.respuesta) order by a.orden)
        from public.foro_asignados_de(p_sesion, p_carnet) a
        join public.respuestas r on r.id = a.aporte_id), '[]'::jsonb) else '[]'::jsonb end,
    'hechas', coalesce((
        select jsonb_agg(r.respuesta ->> 'aporte') from public.respuestas r
        where r.sesion = p_sesion and r.actividad = 'foro-eval' and r.carnet = p_carnet), '[]'::jsonb),
    'comentarios', case when (select si from fase2) then coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', ev.id,
                 'comentario', ev.respuesta ->> 'comentario',
                 'util', (select u.respuesta -> 'util' from public.respuestas u
                          where u.sesion = p_sesion and u.actividad = 'foro-util' and u.carnet = p_carnet
                            and u.respuesta ->> 'eval' = ev.id::text
                          order by u.creado desc limit 1))
               order by ev.creado)
        from public.respuestas ev
        where ev.sesion = p_sesion and ev.actividad = 'foro-eval'
          and ev.respuesta ->> 'aporte' = (select m.id::text from mio m)), '[]'::jsonb) else '[]'::jsonb end
  );
$$;
grant execute on function public.foro_estado(text, text) to anon, authenticated;

-- 5) Fila del foro (abierto desde ya). Fase 1 hasta el viernes 09/10 23:59 y fase 2 hasta el
--    sábado 10/10 23:59, hora de Bolivia (UTC−4). Las fechas se pueden cambiar desde el panel.
insert into public.estado_sesion (sesion, paso, extra)
values ('ii-foro', 'foro', jsonb_build_object(
  'asincrona', true, 'foro', true,
  'abre', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'fase1', '2026-10-10T03:59:59Z',
  'fase2', '2026-10-11T03:59:59Z',
  'cierra', '2026-10-11T03:59:59Z'))
on conflict (sesion) do update set extra = excluded.extra;
