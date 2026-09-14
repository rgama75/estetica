import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Label } from '../../components/ui'

export default function Login() {
  const { session, signInWithPassword } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signInWithPassword(email, password)
    setSubmitting(false)
    if (error) setError(traduzirErro(error))
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:mx-auto sm:w-[420px]">
        <div>
          <span className="font-display text-2xl text-ink">ClinicFlow</span>
          <span className="font-display text-2xl text-primary"> AI</span>
        </div>
        <h1 className="mt-8 font-display text-2xl text-ink">Entrar na sua conta</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Acompanhe a jornada dos seus pacientes do primeiro contato à fidelização.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@clinica.com" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          Ainda não tem conta?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
      <div className="hidden flex-1 bg-primary-soft lg:block" />
    </div>
  )
}

function traduzirErro(msg: string): string {
  if (msg.toLowerCase().includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.toLowerCase().includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  return msg
}
