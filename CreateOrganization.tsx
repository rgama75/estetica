import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useOrg } from '../../contexts/OrgContext'
import { Button, Input, Label } from '../../components/ui'
import type { Specialty } from '../../types/database'

const SPECIALTIES: { value: Specialty; label: string }[] = [
  { value: 'estetica', label: 'Estética' },
  { value: 'odontologia', label: 'Odontologia' },
  { value: 'medicina', label: 'Medicina' },
  { value: 'outro', label: 'Outro' },
]

export default function CreateOrganization() {
  const { refresh } = useOrg()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState<Specialty>('estetica')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    // O trigger handle_new_organization() cuida de tornar o criador "owner"
    // e criar a unidade "Matriz" automaticamente — não precisamos fazer isso aqui.
    const { error } = await supabase.from('organizations').insert({ name, specialty, phone: phone || null })

    setSubmitting(false)

    if (error) {
      setError('Não foi possível criar a clínica: ' + error.message)
      return
    }

    await refresh()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-ink">Vamos configurar sua clínica</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Leva menos de um minuto. Você poderá adicionar unidades, profissionais e serviços depois.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="name">Nome da clínica</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Clínica Estética Bella" />
          </div>

          <div>
            <Label htmlFor="specialty">Especialidade</Label>
            <select
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as Specialty)}
              className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Criando…' : 'Criar clínica'}
          </Button>
        </form>
      </div>
    </div>
  )
}
