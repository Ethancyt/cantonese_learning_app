-- Safe to reapply to a database that already has schema.sql.
begin;
create table if not exists public.learning_modules (
  lesson_id text primary key references public.lessons on delete cascade,
  unit integer not null check(unit>0),
  introduction text not null,
  situation text not null,
  payload jsonb not null
);
create table if not exists public.module_sections (
  lesson_id text references public.learning_modules on delete cascade,
  id text not null,
  position integer not null,
  title text not null,
  payload jsonb not null,
  primary key(lesson_id,id), unique(lesson_id,position)
);
alter table public.learning_modules enable row level security;
alter table public.module_sections enable row level security;
drop policy if exists module_read on public.learning_modules;
create policy module_read on public.learning_modules for select to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id));
drop policy if exists section_read on public.module_sections;
create policy section_read on public.module_sections for select to authenticated using(exists(select 1 from public.lessons l where l.id=lesson_id));
create or replace function public.index_learning_module() returns trigger language plpgsql security definer set search_path=public as $$
declare m jsonb; s jsonb; i integer=0; referenced text[]; actual text[];
begin
  m=new.payload->'module';
  delete from learning_modules where lesson_id=new.id;
  if m is null or m='null'::jsonb then return new;end if;
  select array_agg(a.value order by sec.ordinality,a.ordinality) into referenced
    from jsonb_array_elements(m->'sections') with ordinality sec(value,ordinality),
    jsonb_array_elements_text(sec.value->'exerciseIds') with ordinality a(value,ordinality);
  select array_agg(e.value->>'id' order by e.ordinality) into actual
    from jsonb_array_elements(new.payload->'exercises') with ordinality e(value,ordinality);
  if referenced is distinct from actual then raise exception 'Module sections must include every activity in order';end if;
  insert into learning_modules values(new.id,(m->>'unit')::integer,m->>'introduction',m->>'situation',m);
  for s in select * from jsonb_array_elements(m->'sections') loop
    insert into module_sections values(new.id,s->>'id',i,s->>'title',s);i=i+1;
  end loop;
  return new;
end $$;
drop trigger if exists index_module_content on public.lessons;
create trigger index_module_content after insert or update of payload on public.lessons for each row execute function public.index_learning_module();
-- Existing lesson content is unchanged; regenerate normalized indexes only.
update public.lessons set payload=payload where payload ? 'module';
grant select on public.learning_modules,public.module_sections to authenticated;
commit;
