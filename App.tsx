import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OrgProvider } from './contexts/OrgContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import CreateOrganization from './pages/onboarding/CreateOrganization'
import Dashboard from './pages/dashboard/Dashboard'
import OrganizationSettings from './pages/settings/Organization'
import TeamPage from './pages/settings/Team'
import ComingSoon from './pages/ComingSoon'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <CreateOrganization />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Shell><Dashboard /></Shell>} />
            <Route path="/configuracoes" element={<Shell><OrganizationSettings /></Shell>} />
            <Route path="/equipe" element={<Shell><TeamPage /></Shell>} />

            {/* Módulos das próximas fases — a fundação (org/unidades/permissões) já os suporta */}
            <Route path="/agenda" element={<Shell><ComingSoon moduleName="Agenda" phase="Fase 3" /></Shell>} />
            <Route path="/crm" element={<Shell><ComingSoon moduleName="CRM" phase="Fase 5" /></Shell>} />
            <Route path="/pacientes" element={<Shell><ComingSoon moduleName="Pacientes" phase="Fase 2" /></Shell>} />
            <Route path="/avaliacoes" element={<Shell><ComingSoon moduleName="Avaliações" phase="Fase 5" /></Shell>} />
            <Route path="/propostas" element={<Shell><ComingSoon moduleName="Propostas" phase="Fase 6" /></Shell>} />
            <Route path="/vendas" element={<Shell><ComingSoon moduleName="Vendas" phase="Fase 6" /></Shell>} />
            <Route path="/pacotes" element={<Shell><ComingSoon moduleName="Pacotes" phase="Fase 7" /></Shell>} />
            <Route path="/assinaturas" element={<Shell><ComingSoon moduleName="Assinaturas" phase="Fase 8" /></Shell>} />
            <Route path="/financeiro" element={<Shell><ComingSoon moduleName="Financeiro" phase="Fase 9" /></Shell>} />
            <Route path="/automacoes" element={<Shell><ComingSoon moduleName="Automações" phase="Fase 11" /></Shell>} />
            <Route path="/relatorios" element={<Shell><ComingSoon moduleName="Relatórios" phase="Fase 12" /></Shell>} />
          </Routes>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
