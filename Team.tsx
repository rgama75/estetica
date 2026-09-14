import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../contexts/OrgContext'
import { Card, Badge, EmptyState } from '../../components/ui'
import type { OrganizationMember, Role } from '../../types/database'

type MemberRow = OrganizationMember & { role: Role; user_profile: { full_name: string | null } | null }

export default function TeamPage() {
  const { currentOrganization, currentMember, hasPermission } = useOrg()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const canAdminister = hasPermission('users.administer')

  async function loadMembers() {
    if (!currentOrganization) return
    setLoading(true)

    const [{ data: memberData }, { data: roleData }] = await Promise.all([
      supabase
        .from('organization_members')
        .select('*, role:roles(*), user_profile:user_profiles(full_name)')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .order('created_at'),
      // papéis de sistema (organization_id null) + papéis customizados desta organização
      supabase.from('roles').select('*').or(`organization_id.eq.${currentOrganization.id},organization_id.is.null`).order('name'),
    ])

    setMembers((memberData ?? []) as unknown as MemberRow[])
    setRoles(roleData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization])

  async function handleRoleChange(member: MemberRow, roleId: string) {
    const { error } = await supabase.from('organization_members').update({ role_id: roleId }).eq('id', member.id)
    if (error) {
      alert('Não foi possível alterar o papel: ' + error.message)
      return
    }
    await loadMembers()
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Equipe</h1>
      <p className="mt-1 text-sm text-ink-muted">Pessoas com acesso à {currentOrganization?.name}.</p>

      <Card className="mt-6 bg-primary-soft border-primary/20">
        <p className="text-sm text-ink">
          Convites por e-mail para novos usuários exigem uma função de backend (Edge Function) — a chave necessária
          para criar contas nunca pode ficar no navegador. Essa função está planejada para a próxima fase. Por
          enquanto, esta tela já gerencia papéis e permissões dos membros existentes com aplicação real no banco de dados.
        </p>
      </Card>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-ink-muted">Carregando…</p>
        ) : members.length === 0 ? (
          <EmptyState title="Nenhum membro" description="" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs font-medium text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5">Pessoa</th>
                  <th className="px-4 py-2.5">Papel</th>
                  <th className="px-4 py-2.5">Unidades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{member.user_profile?.full_name ?? 'Sem nome cadastrado'}</span>
                      {member.id === currentMember?.id && <span className="ml-2"><Badge>Você</Badge></span>}
                    </td>
                    <td className="px-4 py-3">
                      {canAdminister ? (
                        <select
                          value={member.role_id}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          disabled={member.id === currentMember?.id}
                          className="rounded-md border border-border-strong bg-surface px-2 py-1 text-sm text-ink disabled:opacity-50"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge>{member.role.name}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{member.all_units_access ? 'Todas' : 'Restrito'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
