// Tipos espelhando as tabelas criadas em /migrations (Fase 1 — Fundação SaaS).
// Quando novas tabelas forem criadas nas próximas fases, gere os tipos oficiais com:
//   npx supabase gen types typescript --project-id <seu-projeto> > src/types/database.ts
// Este arquivo manual serve para já começarmos com tipagem forte antes de rodar esse comando.

export type OrganizationStatus = 'active' | 'suspended' | 'cancelled'
export type Specialty = 'estetica' | 'odontologia' | 'medicina' | 'outro'
export type UnitStatus = 'active' | 'inactive'
export type MemberStatus = 'invited' | 'active' | 'suspended' | 'removed'

export interface Organization {
  id: string
  created_by: string
  name: string
  legal_name: string | null
  document: string | null
  specialty: Specialty
  phone: string | null
  email: string | null
  logo_url: string | null
  address: Record<string, unknown>
  timezone: string
  settings: Record<string, unknown>
  status: OrganizationStatus
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Unit {
  id: string
  organization_id: string
  name: string
  is_headquarters: boolean
  address: Record<string, unknown>
  phone: string | null
  business_hours: Record<string, unknown>
  status: UnitStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  default_organization_id: string | null
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  organization_id: string | null
  name: string
  slug: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  code: string
  module: string
  description: string
  created_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role_id: string
  all_units_access: boolean
  status: MemberStatus
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
  // relações expandidas quando usamos select com join
  role?: Role
  user_profile?: UserProfile
}

export interface UserUnitAccess {
  id: string
  organization_member_id: string
  unit_id: string
  created_at: string
}

export interface AuditLog {
  id: string
  organization_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  metadata: Record<string, unknown>
  created_at: string
}

// Códigos de permissão do catálogo (seed em 004_foundation_seed.sql).
// Manter em sincronia com a tabela `permissions` no banco.
export type PermissionCode =
  | 'organization.manage'
  | 'units.manage'
  | 'users.administer'
  | 'audit.view'
  | 'patients.view'
  | 'patients.create'
  | 'patients.edit'
  | 'patients.delete'
  | 'patients.export'
  | 'professionals.manage'
  | 'services.manage'
  | 'scheduling.view'
  | 'scheduling.create'
  | 'scheduling.edit'
  | 'scheduling.cancel'
  | 'medical_records.view'
  | 'medical_records.edit'
  | 'photos.view'
  | 'photos.upload'
  | 'crm.view'
  | 'crm.manage'
  | 'evaluations.manage'
  | 'proposals.view'
  | 'proposals.manage'
  | 'discounts.grant'
  | 'sales.view'
  | 'sales.create'
  | 'sales.cancel'
  | 'packages.view'
  | 'packages.adjust'
  | 'subscriptions.manage'
  | 'financial.view'
  | 'financial.manage'
  | 'commissions.manage'
  | 'reports.access'
  | 'automations.manage'
  | 'tasks.manage'
