import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Label } from '../../components/ui'

export default function Signup() {
  const { session, signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    setSubmitting(true)
    const { error } = await signUp(email, password, fullName)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }

    // Se o projeto Supabase exigir confirmação de e-mail, ainda não há sessão aqui.
    setConfirmEmailSent(true)
    setTimeout(() => navigate('/login'), 4000)
  }

  if (confirmEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-8">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl text-ink">Quase lá</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Se a confirmação de e-mail estiver ativada no seu projeto, enviamos um link de confirmação para {email}.
            Depois de confirmar, faça login para configurar sua clínica.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:mx-auto sm:w-[420px]">
        <div>
          <span className="font-display text-2xl text-ink">ClinicFlow</span>
          <span className="font-display text-2xl text-primary"> AI</span>
        </div>
        <h1 className="mt-8 font-display text-2xl text-ink">Criar sua conta</h1>
        <p className="mt-1.5 text-sm text-ink-muted">Depois você configura os dados da sua clínica.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="fullName">Seu nome</Label>
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Silva" />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@clinica.com" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
      <div className="hidden flex-1 bg-primary-soft lg:block" />
    </div>
  )
}
