import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Organization, OrganizationMember, PermissionCode, Unit } from '../types/database'

interface OrgContextValue {
  loading: boolean
  organizations: Organization[] // todas as organizações às quais o usuário pertence
  currentOrganization: Organization | null
  currentMember: OrganizationMember | null
  permissions: Set<PermissionCode>
  units: Unit[] // unidades que o usuário atual pode acessar dentro da org atual
  hasPermission: (code: PermissionCode) => boolean
  switchOrganization: (organizationId: string) => void
  refresh: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

const LAST_ORG_KEY = 'clinicflow.currentOrganizationId'

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [currentMember, setCurrentMember] = useState<OrganizationMember | null>(null)
  const [permissions, setPermissions] = useState<Set<PermissionCode>>(new Set())
  const [units, setUnits] = useState<Unit[]>([])

  const load = useCallback(async () => {
    if (!user) {
      setOrganizations([])
      setCurrentOrganization(null)
      setCurrentMember(null)
      setPermissions(new Set())
      setUnits([])
      setLoading(false)
      return
    }

    setLoading(true)

    // RLS já garante que só voltam memberships do próprio usuário.
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select('*, role:roles(*), organization:organizations(*)')
      .eq('status', 'active')

    if (membershipsError) {
      console.error('Erro ao carregar organizações do usuário:', membershipsError.message)
      setLoading(false)
      return
    }

    type MembershipRow = OrganizationMember & { organization: Organization }
    const rows = (memberships ?? []) as unknown as MembershipRow[]
    const orgs = rows.map((m) => m.organization).filter(Boolean)
    setOrganizations(orgs)

    if (rows.length === 0) {
      setCurrentOrganization(null)
      setCurrentMember(null)
      setPermissions(new Set())
      setUnits([])
      setLoading(false)
      return
    }

    const storedId = localStorage.getItem(LAST_ORG_KEY)
    const chosen = rows.find((m) => m.organization_id === storedId) ?? rows[0]

    setCurrentOrganization(chosen.organization)
    setCurrentMember(chosen)
    localStorage.setItem(LAST_ORG_KEY, chosen.organization_id)

    // Permissões do papel do usuário nesta organização
    const { data: rolePerms, error: permsError } = await supabase
      .from('role_permissions')
      .select('permission:permissions(code)')
      .eq('role_id', chosen.role_id)

    if (permsError) {
      console.error('Erro ao carregar permissões:', permsError.message)
    }
    type RolePermRow = { permission: { code: PermissionCode } }
    const permSet = new Set(
      ((rolePerms ?? []) as unknown as RolePermRow[]).map((rp) => rp.permission.code)
    )
    setPermissions(permSet)

    // Unidades acessíveis
    if (chosen.all_units_access) {
      const { data: allUnits } = await supabase
        .from('units')
        .select('*')
        .eq('organization_id', chosen.organization_id)
        .is('deleted_at', null)
      setUnits(allUnits ?? [])
    } else {
      const { data: accessRows } = await supabase
        .from('user_unit_access')
        .select('unit:units(*)')
        .eq('organization_member_id', chosen.id)
      type AccessRow = { unit: Unit }
      setUnits(((accessRows ?? []) as unknown as AccessRow[]).map((r) => r.unit))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  function switchOrganization(organizationId: string) {
    localStorage.setItem(LAST_ORG_KEY, organizationId)
    load()
  }

  function hasPermission(code: PermissionCode) {
    return permissions.has(code)
  }

  return (
    <OrgContext.Provider
      value={{
        loading,
        organizations,
        currentOrganization,
        currentMember,
        permissions,
        units,
        hasPermission,
        switchOrganization,
        refresh: load,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg precisa estar dentro de <OrgProvider>')
  return ctx
}
