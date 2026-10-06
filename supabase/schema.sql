-- Run once in the Supabase SQL Editor as the project owner.
-- Tables are private. Only explicitly provisioned members can use these RPCs.
create schema if not exists mission_private;
create extension if not exists pgcrypto with schema extensions;
revoke all on schema mission_private from public, anon, authenticated;

create table if not exists mission_private.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text not null,
  data jsonb,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists mission_private.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references mission_private.families(id) on delete cascade
);
create table if not exists mission_private.operations (
  family_id uuid not null references mission_private.families(id) on delete cascade,
  operation_id uuid not null,
  primary key(family_id,operation_id)
);
create table if not exists mission_private.pin_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempts integer not null default 0,
  since timestamptz not null default now()
);
alter table mission_private.families enable row level security;
alter table mission_private.members enable row level security;
alter table mission_private.operations enable row level security;
alter table mission_private.pin_attempts enable row level security;

create or replace function public.mission_read() returns jsonb
language plpgsql security definer set search_path='' as $$
declare f mission_private.families;
begin
  select families.* into f from mission_private.families families join mission_private.members m on m.family_id=families.id where m.user_id=auth.uid();
  if f.id is null then raise exception 'FAMILY_ACCESS_DENIED'; end if;
  return jsonb_build_object('family',f.id,'name',f.name,'revision',f.revision,'data',f.data,'updated_at',f.updated_at);
end $$;

create or replace function public.mission_check_pin(p_pin text) returns boolean
language plpgsql security definer set search_path='' as $$
declare hash text; attempts mission_private.pin_attempts; valid boolean;
begin
  select f.pin_hash into hash from mission_private.families f join mission_private.members m on m.family_id=f.id where m.user_id=auth.uid();
  if hash is null then return false; end if;
  insert into mission_private.pin_attempts(user_id) values(auth.uid()) on conflict do nothing;
  select * into attempts from mission_private.pin_attempts where user_id=auth.uid() for update;
  if attempts.since<now()-interval '5 minutes' then
    update mission_private.pin_attempts set attempts=0,since=now() where user_id=auth.uid();
    attempts.attempts:=0;
  end if;
  if attempts.attempts>=5 then return false; end if;
  valid:=hash=extensions.crypt(coalesce(p_pin,''),hash);
  update mission_private.pin_attempts set attempts=case when valid then 0 else pin_attempts.attempts+1 end where user_id=auth.uid();
  return valid;
end $$;

-- Verify that an unprivileged write only changes legal current-week marks or pending extras.
create or replace function mission_private.child_change_ok(old_data jsonb,new_data jsonb) returns boolean
language plpgsql set search_path='' as $$
declare old_base jsonb:=old_data; new_base jsonb:=new_data; w record; mk record; t jsonb; plan jsonb; prev jsonb; expected jsonb; entry jsonb; old_entry jsonb; extra jsonb; date_text text; slot integer; start_date date; today date:=(now() at time zone 'America/Sao_Paulo')::date; current_week text:=to_char(date_trunc('week',now() at time zone 'America/Sao_Paulo'),'YYYY-MM-DD');
begin
  if old_data is null then return false; end if;
  old_base:=old_base #- '{routine,weeks}' #- '{routine,extraEntries}';
  new_base:=new_base #- '{routine,weeks}' #- '{routine,extraEntries}';
  if old_base is distinct from new_base then return false; end if;
  if jsonb_typeof(new_data#>'{routine,weeks}')<>'object' or jsonb_typeof(new_data#>'{routine,extraEntries}')<>'array' then return false; end if;
  for w in select * from jsonb_each(old_data#>'{routine,weeks}') loop
    if not (new_data#>'{routine,weeks}') ? w.key then return false; end if;
  end loop;
  for w in select * from jsonb_each(new_data#>'{routine,weeks}') loop
    prev:=old_data#>array['routine','weeks',w.key];
    if prev=w.value then continue; end if;
    if w.key<>current_week then return false; end if;
    if prev is null then
      select p into plan from jsonb_array_elements(old_data#>'{routine,plans}') p where p->>'effective'<=w.key order by p->>'effective' desc limit 1;
      if plan is null then return false; end if;
      expected:=jsonb_build_object('start',w.key,'tasks',plan->'tasks','threshold',plan->'threshold','reward',plan->'reward','marks','{}'::jsonb,'paid',false,'legacyPaid',false);
      if w.value-'marks' is distinct from expected-'marks' then return false; end if;
      prev:=expected;
    end if;
    if w.value-'marks' is distinct from prev-'marks' or (prev->>'paid')::boolean then return false; end if;
    for mk in select * from jsonb_each(prev->'marks') loop
      if not (w.value->'marks') ? mk.key then return false; end if;
    end loop;
    for mk in select * from jsonb_each(w.value->'marks') loop
      if mk.value is not distinct from prev->'marks'->mk.key then continue; end if;
      if jsonb_typeof(mk.value)<>'boolean' or array_length(string_to_array(mk.key,'|'),1)<>3 then return false; end if;
      date_text:=split_part(mk.key,'|',1);start_date:=date_text::date;slot:=split_part(mk.key,'|',3)::integer;
      if start_date<w.key::date or start_date>w.key::date+6 or start_date>today then return false; end if;
      select task into t from jsonb_array_elements(w.value->'tasks') task where task->>'id'=split_part(mk.key,'|',2) limit 1;
      if t is null or slot<0 or slot>=(t->>'count')::integer or not (t->'days') @> to_jsonb(array[(extract(isodow from start_date)::integer-1)]) then return false; end if;
    end loop;
  end loop;
  if jsonb_array_length(new_data#>'{routine,extraEntries}')>10000 then return false; end if;
  if (select count(*) from jsonb_array_elements(new_data#>'{routine,extraEntries}'))<>(select count(distinct e->>'id') from jsonb_array_elements(new_data#>'{routine,extraEntries}') e) then return false; end if;
  for entry in select * from jsonb_array_elements(new_data#>'{routine,extraEntries}') loop
    select e into old_entry from jsonb_array_elements(old_data#>'{routine,extraEntries}') e where e->>'id'=entry->>'id';
    if old_entry is not null then if old_entry is distinct from entry then return false; end if;continue;end if;
    if coalesce(entry->>'id','') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then return false; end if;
    select e into extra from jsonb_array_elements(old_data#>'{routine,extras}') e where e->>'id'=entry->>'extraId' and (e->>'active')::boolean;
    if extra is null or entry->>'status'<>'pending' or entry->>'day'<>today::text or entry->'value' is distinct from extra->'value' or entry->'name' is distinct from extra->'name' then return false; end if;
  end loop;
  for entry in select * from jsonb_array_elements(old_data#>'{routine,extraEntries}') loop
    if not exists(select 1 from jsonb_array_elements(new_data#>'{routine,extraEntries}') e where e->>'id'=entry->>'id') and entry->>'status'<>'pending' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create or replace function public.mission_commit(p_revision bigint,p_data jsonb,p_operation uuid,p_pin text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare f mission_private.families; parent_ok boolean:=false;
begin
  select families.* into f from mission_private.families families join mission_private.members m on m.family_id=families.id where m.user_id=auth.uid() for update of families;
  if f.id is null then raise exception 'FAMILY_ACCESS_DENIED'; end if;
  if exists(select 1 from mission_private.operations where family_id=f.id and operation_id=p_operation) then return public.mission_read()||jsonb_build_object('ok',true); end if;
  if f.revision<>p_revision then return public.mission_read()||jsonb_build_object('ok',false,'conflict',true); end if;
  if jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>2000000 or p_data ? 'pin' or jsonb_typeof(p_data->'pots')<>'object' or jsonb_typeof(p_data->'routine')<>'object' then raise exception 'INVALID_STATE'; end if;
  if p_pin is not null then parent_ok:=public.mission_check_pin(p_pin); end if;
  if not parent_ok and not mission_private.child_change_ok(f.data,p_data) then return jsonb_build_object('ok',false,'denied',true); end if;
  if coalesce((p_data#>>'{pots,ps5}')::numeric,-1)<0 or coalesce((p_data#>>'{pots,spend}')::numeric,-1)<0 or coalesce((p_data#>>'{pots,future}')::numeric,-1)<0 then raise exception 'INVALID_BALANCE'; end if;
  update mission_private.families set data=p_data,revision=revision+1,updated_at=now() where id=f.id;
  insert into mission_private.operations(family_id,operation_id) values(f.id,p_operation);
  return public.mission_read()||jsonb_build_object('ok',true);
end $$;

revoke all on function public.mission_read() from public,anon;
revoke all on function public.mission_check_pin(text) from public,anon;
revoke all on function public.mission_commit(bigint,jsonb,uuid,text) from public,anon;
grant execute on function public.mission_read() to authenticated;
grant execute on function public.mission_check_pin(text) to authenticated;
grant execute on function public.mission_commit(bigint,jsonb,uuid,text) to authenticated;
revoke all on all tables in schema mission_private from public,anon,authenticated;
revoke all on all functions in schema mission_private from public,anon,authenticated;
