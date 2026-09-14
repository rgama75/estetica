import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useOrg } from '../../contexts/OrgContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/agenda', label: 'Agenda' },
  { to: '/crm', label: 'CRM' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/avaliacoes', label: 'Avaliações' },
  { to: '/propostas', label: 'Propostas' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/pacotes', label: 'Pacotes' },
  { to: '/assinaturas', label: 'Assinaturas' },
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/automacoes', label: 'Automações' },
  { to: '/relatorios', label: 'Relatórios' },
]

const SETTINGS_ITEMS = [
  { to: '/equipe', label: 'Equipe' },
  { to: '/configuracoes', label: 'Configurações' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { currentOrganization, organizations, switchOrganization, currentMember } = useOrg()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-canvas">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex h-16 items-center px-5">
          <span className="font-display text-lg text-ink">ClinicFlow</span>
          <span className="font-display text-lg text-primary"> AI</span>
        </div>

        {organizations.length > 1 ? (
          <select
            value={currentOrganization?.id}
            onChange={(e) => switchOrganization(e.target.value)}
            className="mx-4 mb-2 rounded-md border border-border-strong bg-canvas px-2 py-1.5 text-sm text-ink"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="mx-4 mb-2 truncate px-2 text-sm font-medium text-ink-muted">
            {currentOrganization?.name}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </ul>
          <div className="mt-5 mb-1.5 px-3 text-xs font-medium text-ink-muted">Organização</div>
          <ul className="space-y-0.5">
            {SETTINGS_ITEMS.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user?.email}</p>
              <p className="truncate text-xs text-ink-muted">{currentMember?.role?.name}</p>
            </div>
            <button onClick={handleSignOut} className="shrink-0 text-xs font-medium text-ink-muted hover:text-ink">
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

function SidebarLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `block rounded-md px-3 py-1.5 text-sm transition-colors ${
            isActive ? 'bg-primary-soft font-medium text-primary' : 'text-ink-muted hover:bg-canvas hover:text-ink'
          }`
        }
      >
        {label}
      </NavLink>
    </li>
  )
}
