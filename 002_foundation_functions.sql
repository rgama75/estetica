-- ClinicFlow AI — Fase 1: Fundação SaaS
-- 002_foundation_functions.sql
-- Funções auxiliares de RLS, triggers de updated_at, auditoria e onboarding automático

-- ---------------------------------------------------------
-- updated_at genérico
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger trg_units_updated before update on public.units
  for each row execute function public.set_updated_at();
create trigger trg_user_profiles_updated before update on public.user_profiles
  for each row execute function public.set_updated_at();
create trigger trg_roles_updated before update on public.roles
  for each row execute function public.set_updated_at();
create trigger trg_org_members_updated before update on public.organization_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Helpers de RLS (SECURITY DEFINER para evitar recursão de RLS)
-- ---------------------------------------------------------

create or replace function public.current_user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.user_has_permission(p_organization_id uuid, p_permission_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.role_permissions rp on rp.role_id = om.role_id
    join public.permissions p on p.id = rp.permission_id
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and p.code = p_permission_code
  );
$$;

create or replace function public.user_has_unit_access(p_unit_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.units u
    join public.organization_members om on om.organization_id = u.organization_id
    where u.id = p_unit_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and (
        om.all_units_access = true
        or exists (
          select 1 from public.user_unit_access uua
          where uua.organization_member_id = om.id
            and uua.unit_id = p_unit_id
        )
      )
  );
$$;

-- ---------------------------------------------------------
-- Onboarding automático: ao criar uma organização, o criador
-- vira "owner" automaticamente, ganha acesso a todas as unidades,
-- e a unidade "Matriz" é criada.
-- ---------------------------------------------------------
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_role_id uuid;
  v_unit_id uuid;
  v_member_id uuid;
begin
  select id into v_owner_role_id from public.roles
    where slug = 'owner' and organization_id is null;

  insert into public.organization_members (organization_id, user_id, role_id, all_units_access, status, joined_at)
  values (new.id, auth.uid(), v_owner_role_id, true, 'active', now())
  returning id into v_member_id;

  insert into public.units (organization_id, name, is_headquarters)
  values (new.id, 'Matriz', true)
  returning id into v_unit_id;

  insert into public.audit_logs (organization_id, user_id, action, entity_type, entity_id, after_data)
  values (new.id, auth.uid(), 'create', 'organizations', new.id, to_jsonb(new));

  return new;
end;
$$;

create trigger trg_new_organization
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- ---------------------------------------------------------
-- Trigger genérico de auditoria (reutilizável nas próximas fases)
-- ---------------------------------------------------------
create or replace function public.audit_trigger_func()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  begin
    v_org_id := coalesce(
      (case when TG_OP = 'DELETE' then old.organization_id else new.organization_id end),
      null
    );
  exception when undefined_column then
    v_org_id := null;
  end;

  insert into public.audit_logs (organization_id, user_id, action, entity_type, entity_id, before_data, after_data)
  values (
    v_org_id,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    case when TG_OP in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('UPDATE','INSERT') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger trg_audit_org_members
  after insert or update or delete on public.organization_members
  for each row execute function public.audit_trigger_func();

-- role_permissions não tem organization_id direto: precisa resolver via roles.
-- Papéis de sistema (organization_id null, usados no seed) NÃO geram auditoria,
-- pois não pertencem a nenhuma organização e seriam ruído invisível (audit_logs
-- exige organization_id para ser consultado). Só papéis customizados por
-- organização são auditados aqui.
create or replace function public.audit_role_permissions_trigger_func()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role_id uuid;
begin
  v_role_id := case when TG_OP = 'DELETE' then old.role_id else new.role_id end;
  select organization_id into v_org_id from public.roles where id = v_role_id;

  if v_org_id is null then
    return coalesce(new, old);
  end if;

  insert into public.audit_logs (organization_id, user_id, action, entity_type, entity_id, before_data, after_data)
  values (
    v_org_id,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    case when TG_OP = 'DELETE' then to_jsonb(old) else null end,
    case when TG_OP = 'INSERT' then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger trg_audit_role_permissions
  after insert or delete on public.role_permissions
  for each row execute function public.audit_role_permissions_trigger_func();
