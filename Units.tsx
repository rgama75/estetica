import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../contexts/OrgContext'
import { Button, Card, Input, Label, Badge, EmptyState } from '../../components/ui'
import type { Unit } from '../../types/database'

export default function UnitsPage() {
  const { currentOrganization, hasPermission, refresh } = useOrg()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canManage = hasPermission('units.manage')

  async function loadUnits() {
    if (!currentOrganization) return
    setLoading(true)
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .is('deleted_at', null)
      .order('is_headquarters', { ascending: false })
      .order('name')
    setUnits(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadUnits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentOrganization) return
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('units').insert({
      organization_id: currentOrganization.id,
      name,
      phone: phone || null,
    })

    setSubmitting(false)

    if (error) {
      setError('Não foi possível criar a unidade: ' + error.message)
      return
    }

    setName('')
    setPhone('')
    setShowForm(false)
    await loadUnits()
    await refresh()
  }

  async function handleDeactivate(unit: Unit) {
    if (!confirm(`Inativar a unidade "${unit.name}"? Ela deixará de aparecer na agenda.`)) return
    await supabase.from('units').update({ status: unit.status === 'active' ? 'inactive' : 'active' }).eq('id', unit.id)
    await loadUnits()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Unidades</h1>
          <p className="mt-1 text-sm text-ink-muted">Filiais da {currentOrganization?.name}.</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Cancelar' : 'Nova unidade'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mt-6 max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="unitName">Nome da unidade</Label>
              <Input id="unitName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Filial Jardins" />
            </div>
            <div>
              <Label htmlFor="unitPhone">Telefone (opcional)</Label>
              <Input id="unitPhone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar unidade'}
            </Button>
          </form>
        </Card>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-ink-muted">Carregando…</p>
        ) : units.length === 0 ? (
          <EmptyState title="Nenhuma unidade ainda" description="Crie a primeira unidade da sua clínica." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs font-medium text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5">Unidade</th>
                  <th className="px-4 py-2.5">Telefone</th>
                  <th className="px-4 py-2.5">Status</th>
                  {canManage && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{unit.name}</span>
                      {unit.is_headquarters && (
                        <span className="ml-2">
                          <Badge>Matriz</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{unit.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={unit.status === 'active' ? 'success' : 'default'}>
                        {unit.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDeactivate(unit)} className="text-xs font-medium text-ink-muted hover:text-ink">
                          {unit.status === 'active' ? 'Inativar' : 'Reativar'}
                        </button>
                      </td>
                    )}
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
