-- ClinicFlow AI — Fase 1: Fundação SaaS
-- 003_foundation_rls.sql
-- Row Level Security — nenhuma tabela é acessível sem policy explícita

alter table public.organizations enable row level security;
alter table public.units enable row level security;
alter table public.user_profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_members enable row level security;
alter table public.user_unit_access enable row level security;
alter table public.audit_logs enable row level security;

-- ===================== organizations =====================
-- created_by = auth.uid() cobre a janela entre o INSERT e o trigger de onboarding
-- (que cria o vínculo em organization_members); sem isso, INSERT...RETURNING
-- falharia por RLS pois a membership ainda não existiria no momento do RETURNING.
create policy org_select on public.organizations
  for select using (public.is_org_member(id) or created_by = auth.uid());

create policy org_insert on public.organizations
  for insert with check (auth.uid() is not null); -- onboarding: qualquer usuário autenticado cria sua própria org

create policy org_update on public.organizations
  for update using (public.user_has_permission(id, 'organization.manage'))
  with check (public.user_has_permission(id, 'organization.manage'));
-- sem policy de DELETE: exclusão de organização é operação administrativa fora do app

-- ===================== units =====================
create policy units_select on public.units
  for select using (public.is_org_member(organization_id));

create policy units_insert on public.units
  for insert with check (public.user_has_permission(organization_id, 'units.manage'));

create policy units_update on public.units
  for update using (public.user_has_permission(organization_id, 'units.manage'))
  with check (public.user_has_permission(organization_id, 'units.manage'));

-- ===================== user_profiles =====================
create policy profile_select_self on public.user_profiles
  for select using (id = auth.uid());

create policy profile_select_org_peers on public.user_profiles
  for select using (
    exists (
      select 1 from public.organization_members me
      join public.organization_members peer on peer.organization_id = me.organization_id
      where me.user_id = auth.uid() and me.status = 'active'
        and peer.user_id = user_profiles.id and peer.status = 'active'
    )
  );

create policy profile_update_self on public.user_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profile_insert_self on public.user_profiles
  for insert with check (id = auth.uid());

-- ===================== permissions (catálogo global, somente leitura) =====================
create policy permissions_select_all on public.permissions
  for select using (auth.uid() is not null);

-- ===================== roles =====================
create policy roles_select on public.roles
  for select using (
    organization_id is null
    or public.is_org_member(organization_id)
  );

create policy roles_insert on public.roles
  for insert with check (
    organization_id is not null
    and public.user_has_permission(organization_id, 'users.administer')
  );

create policy roles_update on public.roles
  for update using (
    organization_id is not null
    and public.user_has_permission(organization_id, 'users.administer')
  )
  with check (
    organization_id is not null
    and public.user_has_permission(organization_id, 'users.administer')
  );

-- ===================== role_permissions =====================
create policy role_permissions_select on public.role_permissions
  for select using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and (r.organization_id is null or public.is_org_member(r.organization_id))
    )
  );

create policy role_permissions_manage on public.role_permissions
  for all using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.organization_id is not null
        and public.user_has_permission(r.organization_id, 'users.administer')
    )
  )
  with check (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id
        and r.organization_id is not null
        and public.user_has_permission(r.organization_id, 'users.administer')
    )
  );

-- ===================== organization_members =====================
create policy org_members_select on public.organization_members
  for select using (public.is_org_member(organization_id));

create policy org_members_insert on public.organization_members
  for insert with check (public.user_has_permission(organization_id, 'users.administer'));

create policy org_members_update on public.organization_members
  for update using (public.user_has_permission(organization_id, 'users.administer'))
  with check (public.user_has_permission(organization_id, 'users.administer'));

-- ===================== user_unit_access =====================
create policy user_unit_access_select on public.user_unit_access
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.id = user_unit_access.organization_member_id
        and public.is_org_member(om.organization_id)
    )
  );

create policy user_unit_access_manage on public.user_unit_access
  for all using (
    exists (
      select 1 from public.organization_members om
      where om.id = user_unit_access.organization_member_id
        and public.user_has_permission(om.organization_id, 'users.administer')
    )
  )
  with check (
    exists (
      select 1 from public.organization_members om
      where om.id = user_unit_access.organization_member_id
        and public.user_has_permission(om.organization_id, 'users.administer')
    )
  );

-- ===================== audit_logs =====================
create policy audit_logs_select on public.audit_logs
  for select using (
    organization_id is not null
    and public.user_has_permission(organization_id, 'audit.view')
  );
-- Nenhuma policy de INSERT/UPDATE/DELETE: apenas funções SECURITY DEFINER escrevem aqui.
