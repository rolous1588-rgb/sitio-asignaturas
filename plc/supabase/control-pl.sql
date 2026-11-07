-- ============================================================
-- Módulo «Programación de Controladores e Interfaces Industriales»
-- Control de estudio (pl-ce, 10 %): fila de la sesión + panel del estudiante sin control ni foro
-- Solo agrega una fila y reemplaza una función conservando su firma; no renombra ni borra nada.
-- Se puede ejecutar más de una vez.
--
-- Fechas (hora de La Paz, UTC-4): abre sáb 07/11/2026 (ya abierto); cierra dom 08/11 23:59:59 = 2026-11-09T03:59:59Z
-- Un solo intento de 60 minutos desde «Empezar».
-- ============================================================

-- 1. Fila de la sesión del control (si ya existe, no se toca)
insert into public.estado_sesion (sesion, paso, extra)
values ('pl-ce', 'estudio',
        '{"asincrona": true, "abre": "2026-11-07T05:00:00Z", "cierra": "2026-11-09T03:59:59Z", "minutos": 60}'::jsonb)
on conflict (sesion) do nothing;

-- 2. El panel del estudiante (clases por día) no debe tratar al control ni al foro como «clases»:
--    sus envíos (eval, foro-aporte…) se promediarían en la participación.
create or replace function public.panel_estudiante(p_carnet text, p_fecha text, p_pin text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v record;
  ses jsonb;
begin
  select * into v from public.verificar_estudiante(p_carnet, p_fecha, p_pin);
  if v.carnet is null then
    return jsonb_build_object('ok', false, 'motivo', v.motivo);
  end if;
  -- una entrada por (sesión, día de clase). Cada actividad pertenece al día (hora de Bolivia) de su primera respuesta de un estudiante.
  select coalesce(jsonb_agg(s order by s.sesion, s.dia), '[]'::jsonb) into ses from (
    with da as (
      select x.sesion, x.actividad as act, (min(x.creado) at time zone 'America/La_Paz')::date as dia
      from public.respuestas x
      where x.sesion like 'pl-%' and x.sesion not in ('pl-ce', 'pl-foro')
        and x.actividad not in ('ingreso', 'diagnostico')
        and not coalesce((x.respuesta ->> 'vacio')::boolean, false)
        and not exists (select 1 from public.estudiantes g where g.carnet = x.carnet and g.fantasma)
      group by x.sesion, x.actividad
    ), dias as (select distinct sesion, dia from da)
    select d.sesion, d.dia,
      (select coalesce(jsonb_agg(a.act), '[]'::jsonb) from da a where a.sesion = d.sesion and a.dia = d.dia) as realizadas,
      (exists (select 1 from public.ingresos i where i.sesion = d.sesion and i.carnet = v.carnet and (i.creado at time zone 'America/La_Paz')::date = d.dia)
       or exists (select 1 from public.respuestas r where r.sesion = d.sesion and r.carnet = v.carnet and (r.creado at time zone 'America/La_Paz')::date = d.dia)) as ingreso,
      (select coalesce(jsonb_agg(jsonb_build_object('actividad', y.actividad, 'puntaje', y.puntaje, 'intento', y.intento)), '[]'::jsonb)
        from public.respuestas y
        where y.sesion = d.sesion and y.carnet = v.carnet and y.actividad not in ('ingreso', 'diagnostico')
          and not coalesce((y.respuesta ->> 'vacio')::boolean, false)
          and y.actividad in (select a.act from da a where a.sesion = d.sesion and a.dia = d.dia)) as respuestas,
      (select count(*) from public.ruleta u
        where u.sesion = d.sesion and u.carnet = v.carnet and u.resultado = 'no_responde' and not u.anulado
          and (u.creado at time zone 'America/La_Paz')::date = d.dia) as no_responde,
      (select coalesce(e.extra -> 'trasladados', '[]'::jsonb) from public.estado_sesion e where e.sesion = d.sesion) as trasladados
    from dias d
  ) s;
  return jsonb_build_object('ok', true, 'nombre', v.nombre, 'carnet', v.carnet, 'sesiones', ses);
end;
$$;
