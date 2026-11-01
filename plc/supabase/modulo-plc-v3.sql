-- ============================================================
-- Módulo «Programación de Controladores e Interfaces Industriales» — v3
-- Acceso por lista (carnet + fecha de nacimiento; PIN solo el estudiante fantasma),
-- ruleta entre todos los que ingresaron a la sesión y panel del estudiante.
-- SOLO AGREGA: no renombra ni borra nada y no toca las sesiones ii-, me-, d1-, tf-, mn-.
-- Se puede ejecutar más de una vez. La LISTA de estudiantes NO está en este archivo
-- (se carga aparte en Supabase; no se publica en GitHub).
-- ============================================================

-- 1. Lista del módulo (solo el docente la lee; la fecha y el PIN se guardan como huella sha256)
create table if not exists public.estudiantes (
  carnet text primary key,
  nombre text not null,
  fecha_hash text not null,
  pin_hash text,
  fantasma boolean not null default false,
  creado timestamptz not null default now()
);
alter table public.estudiantes enable row level security;
grant select, insert, update, delete on public.estudiantes to authenticated;
drop policy if exists "docente maneja estudiantes" on public.estudiantes;
create policy "docente maneja estudiantes" on public.estudiantes
  for all to authenticated using (public.es_docente()) with check (public.es_docente());

-- 2. Intentos de ingreso (límite contra adivinar la fecha; nadie la lee directamente)
create table if not exists public.intentos_ingreso (
  id bigint generated always as identity primary key,
  carnet text not null,
  ok boolean not null,
  creado timestamptz not null default now()
);
create index if not exists intentos_ingreso_idx on public.intentos_ingreso (carnet, creado);
alter table public.intentos_ingreso enable row level security;

-- 3. Verificación interna (no se puede llamar desde la página)
create or replace function public.verificar_estudiante(p_carnet text, p_fecha text, p_pin text default null)
returns table (carnet text, nombre text, fantasma boolean, motivo text)
language plpgsql security definer set search_path = public
as $$
declare
  c text := upper(regexp_replace(coalesce(p_carnet, ''), '[\s\-\.]', '', 'g'));
  f text := btrim(coalesce(p_fecha, ''));
  e public.estudiantes%rowtype;
  fallos int;
begin
  delete from public.intentos_ingreso where creado < now() - interval '1 day';
  select count(*) into fallos from public.intentos_ingreso i
    where i.carnet = c and not i.ok and i.creado > now() - interval '10 minutes';
  if fallos >= 8 then
    return query select null::text, null::text, false, 'bloqueado'::text; return;
  end if;
  select * into e from public.estudiantes s where s.carnet = c;
  if not found then
    insert into public.intentos_ingreso (carnet, ok) values (c, false);
    return query select null::text, null::text, false, 'no_lista'::text; return;
  end if;
  if e.fecha_hash <> encode(sha256(convert_to(c || ':' || f, 'UTF8')), 'hex') then
    insert into public.intentos_ingreso (carnet, ok) values (c, false);
    return query select null::text, null::text, false, 'fecha'::text; return;
  end if;
  if e.fantasma then
    if coalesce(p_pin, '') = '' then
      return query select null::text, null::text, true, 'pin'::text; return;
    end if;
    if e.pin_hash is distinct from encode(sha256(convert_to(c || ':pin:' || p_pin, 'UTF8')), 'hex') then
      insert into public.intentos_ingreso (carnet, ok) values (c, false);
      return query select null::text, null::text, true, 'pin_mal'::text; return;
    end if;
  end if;
  insert into public.intentos_ingreso (carnet, ok) values (c, true);
  return query select e.carnet, e.nombre, e.fantasma, null::text;
end;
$$;
revoke all on function public.verificar_estudiante(text, text, text) from public, anon, authenticated;

-- 4. Entrar a la plataforma: devuelve el nombre de la lista si carnet + fecha (+ PIN) coinciden
create or replace function public.entrar(p_carnet text, p_fecha text, p_pin text default null)
returns table (ok boolean, nombre text, motivo text, fantasma boolean, carnet text)
language sql security definer set search_path = public
as $$
  select (v.motivo is null), v.nombre, v.motivo, v.fantasma, v.carnet
  from public.verificar_estudiante(p_carnet, p_fecha, p_pin) v;
$$;
grant execute on function public.entrar(text, text, text) to anon, authenticated;

-- 5. Qué se hizo realmente en una sesión (para la nota del día en el cierre)
create or replace function public.resumen_dia(p_sesion text, p_carnet text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'realizadas', coalesce((
      select jsonb_agg(distinct x.actividad) from public.respuestas x
      where x.sesion = p_sesion and x.actividad not in ('ingreso', 'diagnostico')
        and not coalesce((x.respuesta ->> 'vacio')::boolean, false)
        and not exists (select 1 from public.estudiantes g where g.carnet = x.carnet and g.fantasma)), '[]'::jsonb),
    'no_responde', (select count(*) from public.ruleta u
      where u.sesion = p_sesion and u.carnet = p_carnet and u.resultado = 'no_responde' and not u.anulado));
$$;
grant execute on function public.resumen_dia(text, text) to anon, authenticated;

-- 6. Panel del estudiante: sus sesiones, respuestas y llamados (exige carnet + fecha, y PIN si es fantasma)
create or replace function public.panel_estudiante(p_carnet text, p_fecha text, p_pin text default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v record;
  ses jsonb;
begin
  select * into v from public.verificar_estudiante(p_carnet, p_fecha, p_pin);
  if v.carnet is null then
    return jsonb_build_object('ok', false, 'motivo', v.motivo);
  end if;
  select coalesce(jsonb_agg(s order by s.sesion), '[]'::jsonb) into ses from (
    select r.sesion,
      (select coalesce(jsonb_agg(distinct x.actividad), '[]'::jsonb) from public.respuestas x
        where x.sesion = r.sesion and x.actividad not in ('ingreso', 'diagnostico')
          and not coalesce((x.respuesta ->> 'vacio')::boolean, false)
          and not exists (select 1 from public.estudiantes g where g.carnet = x.carnet and g.fantasma)) as realizadas,
      exists (select 1 from public.ingresos i where i.sesion = r.sesion and i.carnet = v.carnet) as ingreso,
      (select coalesce(jsonb_agg(jsonb_build_object('actividad', y.actividad, 'puntaje', y.puntaje, 'intento', y.intento)), '[]'::jsonb)
        from public.respuestas y
        where y.sesion = r.sesion and y.carnet = v.carnet and y.actividad not in ('ingreso', 'diagnostico')
          and not coalesce((y.respuesta ->> 'vacio')::boolean, false)) as respuestas,
      (select count(*) from public.ruleta u
        where u.sesion = r.sesion and u.carnet = v.carnet and u.resultado = 'no_responde' and not u.anulado) as no_responde,
      (select coalesce(e.extra -> 'trasladados', '[]'::jsonb) from public.estado_sesion e where e.sesion = r.sesion) as trasladados
    from (select distinct sesion from public.respuestas where sesion like 'pl-%') r
  ) s;
  return jsonb_build_object('ok', true, 'nombre', v.nombre, 'carnet', v.carnet, 'sesiones', ses);
end;
$$;
grant execute on function public.panel_estudiante(text, text, text) to anon, authenticated;

-- 7. Conectados ahora (solo informativo): ya no cuenta al estudiante fantasma
create or replace function public.conectados(p_sesion text)
returns table (carnet text, nombre text)
language sql stable security definer set search_path = public
as $$
  select distinct on (i.carnet) i.carnet, coalesce(e.nombre, i.nombre)
  from public.ingresos i
  left join public.estudiantes e on e.carnet = i.carnet
  where public.es_docente() and i.sesion = p_sesion and i.visto > now() - interval '60 seconds'
    and not coalesce(e.fantasma, false)
  order by i.carnet, i.id desc;
$$;
grant execute on function public.conectados(text) to authenticated;

-- 8. Candidatos de la ruleta: TODOS los que ingresaron a la sesión (estén conectados o no), sin el fantasma
create or replace function public.candidatos_ruleta(p_sesion text)
returns table (carnet text, nombre text, conectado boolean, salio boolean)
language sql stable security definer set search_path = public
as $$
  with ents as (
    select distinct on (i.carnet) i.carnet, coalesce(e.nombre, i.nombre) as nombre, i.visto
    from public.ingresos i
    left join public.estudiantes e on e.carnet = i.carnet
    where i.sesion = p_sesion and not coalesce(e.fantasma, false)
    order by i.carnet, i.id desc)
  select t.carnet, t.nombre,
         coalesce(t.visto > now() - interval '60 seconds', false),
         exists (select 1 from public.ruleta r where r.sesion = p_sesion and r.carnet = t.carnet and not r.anulado)
  from ents t
  where public.es_docente()
  order by t.nombre;
$$;
grant execute on function public.candidatos_ruleta(text) to authenticated;

-- 9. Sorteo: entre todos los que ingresaron; no repite hasta que todos hayan salido
create or replace function public.sortear_ruleta(p_sesion text)
returns table (carnet text, nombre text)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.es_docente() then return; end if;
  return query
    with c as (select * from public.candidatos_ruleta(p_sesion)),
    elegibles as (
      select c.carnet, c.nombre from c where not c.salio
      union all
      select c.carnet, c.nombre from c where not exists (select 1 from c c2 where not c2.salio)
    )
    select e.carnet, e.nombre from elegibles e order by random() limit 1;
end;
$$;
grant execute on function public.sortear_ruleta(text) to authenticated;

select 'Listo: módulo PLC v3 preparado' as resultado;
