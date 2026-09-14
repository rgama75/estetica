import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../contexts/OrgContext'
import { Card, Badge } from '../../components/ui'

interface ChecklistState {
  unitsCount: number
  membersCount: number
}

export default function Dashboard() {
  const { currentOrganization, currentMember, units } = useOrg()
  const [state, setState] = useState<ChecklistState>({ unitsCount: 0, membersCount: 0 })

  useEffect(() => {
    if (!currentOrganization) return
    async function load() {
      const [{ count: unitsCount }, { count: membersCount }] = await Promise.all([
        supabase.from('units').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrganization!.id),
        supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrganization!.id).eq('status', 'active'),
      ])
      setState({ unitsCount: unitsCount ?? 0, membersCount: membersCount ?? 0 })
    }
    load()
  }, [currentOrganization])

  const checklist = [
    {
      label: 'Dados da clínica configurados',
      done: Boolean(currentOrganization?.name),
      href: '/configuracoes',
    },
    {
      label: 'CNPJ/CPF e endereço preenchidos',
      done: Boolean(currentOrganization?.document),
      href: '/configuracoes',
    },
    {
      label: 'Unidades cadastradas',
      done: state.unitsCount > 0,
      detail: `${state.unitsCount} unidade${state.unitsCount === 1 ? '' : 's'}`,
      href: '/configuracoes',
    },
    {
      label: 'Equipe convidada',
      done: state.membersCount > 1,
      detail: `${state.membersCount} pessoa${state.membersCount === 1 ? '' : 's'} na equipe`,
      href: '/equipe',
    },
  ]

  const pending = checklist.filter((c) => !c.done)

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Olá, {currentMember?.role?.name === 'Proprietário' ? 'bem-vindo(a)' : 'bem-vindo(a) de volta'}</h1>
      <p className="mt-1 text-sm text-ink-muted">{currentOrganization?.name}</p>

      {pending.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-display text-lg text-ink">Configuração inicial</h2>
          <p className="mt-1 text-sm text-ink-muted">Complete estes passos para aproveitar o ClinicFlow AI.</p>
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm hover:bg-canvas"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                        item.done ? 'border-success bg-success-soft text-success' : 'border-border-strong text-ink-muted'
                      }`}
                    >
                      {item.done ? '✓' : ''}
                    </span>
                    <span className={item.done ? 'text-ink-muted line-through' : 'text-ink'}>{item.label}</span>
                  </span>
                  {item.detail && <span className="text-xs text-ink-muted">{item.detail}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink-muted">Unidades</p>
          <p className="mt-1 font-display text-3xl text-ink">{units.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Equipe</p>
          <p className="mt-1 font-display text-3xl text-ink">{state.membersCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">Status</p>
          <p className="mt-2">
            <Badge tone={currentOrganization?.status === 'active' ? 'success' : 'warning'}>
              {currentOrganization?.status === 'active' ? 'Ativa' : currentOrganization?.status}
            </Badge>
          </p>
        </Card>
      </div>

      <p className="mt-8 text-sm text-ink-muted">
        Indicadores comerciais e financeiros (faturamento, conversão, no-show, etc.) chegam nas próximas fases,
        junto com Agenda, CRM e Financeiro.
      </p>
    </div>
  )
}
