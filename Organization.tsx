import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../contexts/OrgContext'
import { Button, Card, Input, Label } from '../../components/ui'
import UnitsPage from './Units'

export default function OrganizationSettings() {
  const { currentOrganization, hasPermission, refresh } = useOrg()
  const canManage = hasPermission('organization.manage')

  const [name, setName] = useState(currentOrganization?.name ?? '')
  const [document, setDocument] = useState(currentOrganization?.document ?? '')
  const [phone, setPhone] = useState(currentOrganization?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentOrganization) return
    setError(null)
    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('organizations')
      .update({ name, document: document || null, phone: phone || null })
      .eq('id', currentOrganization.id)

    setSaving(false)

    if (error) {
      setError('Não foi possível salvar: ' + error.message)
      return
    }

    setSaved(true)
    await refresh()
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl text-ink">Configurações</h1>
      <p className="mt-1 text-sm text-ink-muted">Dados gerais da clínica.</p>

      <Card className="mt-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="orgName">Nome da clínica</Label>
            <Input id="orgName" required disabled={!canManage} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="orgDoc">CNPJ / CPF</Label>
            <Input id="orgDoc" disabled={!canManage} value={document ?? ''} onChange={(e) => setDocument(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <Label htmlFor="orgPhone">Telefone</Label>
            <Input id="orgPhone" disabled={!canManage} value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {!canManage && <p className="text-sm text-ink-muted">Você não tem permissão para editar estes dados.</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Salvo.</p>}

          {canManage && (
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          )}
        </form>
      </Card>

      <div className="mt-10">
        <UnitsPage />
      </div>
    </div>
  )
}
