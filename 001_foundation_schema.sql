-- ClinicFlow AI — Fase 1: Fundação SaaS
-- 001_foundation_schema.sql
-- Tabelas: organizations, units, user_profiles, permissions, roles,
-- role_permissions, organization_members, user_unit_access, audit_logs

create extension if not exists pgcrypto;

-- =========================================================
-- ORGANIZATIONS (tenant raiz = a clínica)
-- =========================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id),
  name text not null,
  legal_name text,
  document text, -- CNPJ ou CPF
  specialty text not null default 'estetica'
    check (specialty in ('estetica','odontologia','medicina','outro')),
  phone text,
  email text,
  logo_url text,
  address jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Sao_Paulo',
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','suspended','cancelled')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.organizations is 'Tenant raiz do SaaS. Cada organização = uma clínica contratante (2 níveis: organização > unidades).';

-- =========================================================
-- UNITS (filiais dentro da organização)
-- =========================================================
create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_headquarters boolean not null default false,
  address jsonb not null default '{}'::jsonb,
  phone text,
  business_hours jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_units_org on public.units(organization_id) where deleted_at is null;

-- =========================================================
-- USER PROFILES (extensão 1:1 de auth.users)
-- =========================================================
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- PERMISSIONS (catálogo fixo, global — referência do sistema)
-- =========================================================
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  description text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROLES (papéis de sistema, compartilhados, OU customizados por organização)
-- =========================================================
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade, -- null = papel padrão do sistema
  name text not null,
  slug text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_roles_org_slug on public.roles(organization_id, slug)
  where organization_id is not null;
create unique index idx_roles_system_slug on public.roles(slug)
  where organization_id is null;

-- =========================================================
-- ROLE_PERMISSIONS
-- =========================================================
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

-- =========================================================
-- ORGANIZATION_MEMBERS (vínculo usuário <-> organização, N:N)
-- =========================================================
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  all_units_access boolean not null default false,
  status text not null default 'active'
    check (status in ('invited','active','suspended','removed')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_org_members_org on public.organization_members(organization_id) where status = 'active';
create index idx_org_members_user on public.organization_members(user_id) where status = 'active';

-- =========================================================
-- USER_UNIT_ACCESS (unidades específicas quando all_units_access = false)
-- =========================================================
create table public.user_unit_access (
  id uuid primary key default gen_random_uuid(),
  organization_member_id uuid not null references public.organization_members(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (organization_member_id, unit_id)
);

-- =========================================================
-- AUDIT_LOGS (trilha de auditoria genérica, imutável)
-- =========================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_org_created on public.audit_logs(organization_id, created_at desc);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);
