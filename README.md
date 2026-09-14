# ClinicFlow AI — Frontend (Fase 1)

React + TypeScript + Vite + Tailwind v4 + Supabase JS. Cobre login, cadastro, onboarding
(criação da clínica), dashboard com checklist inicial, gestão de unidades e gestão de
equipe/permissões — todos integrados de verdade com as políticas de RLS das migrations em `../migrations`.

## Passo a passo para rodar

1. **Crie um projeto no Supabase** (supabase.com) se ainda não tiver um.
2. **Rode as migrations**: no SQL Editor do seu projeto Supabase, execute na ordem, de `../migrations`:
   `001_foundation_schema.sql` → `002_foundation_functions.sql` → `003_foundation_rls.sql` → `004_foundation_seed.sql`.
3. **Confirmação de e-mail**: em Authentication > Providers > Email, desative "Confirm email"
   para testar rapidamente (ou deixe ativado e confirme o e-mail antes do primeiro login).
4. **Configure o ambiente**:
   ```bash
   cp .env.example .env
   ```
   Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings > API no Supabase).
5. **Instale e rode**:
   ```bash
   npm install
   npm run dev
   ```
6. Acesse `http://localhost:5173`, crie uma conta, e você cairá direto no onboarding para criar sua clínica.

## O que já funciona de ponta a ponta
- Cadastro e login (Supabase Auth)
- Onboarding: criar organização → vira `owner` automaticamente, unidade "Matriz" criada
- Dashboard com checklist de configuração inicial
- CRUD de unidades (respeitando a permissão `units.manage`)
- Gestão de papéis da equipe (respeitando a permissão `users.administer`)
- Toda ação é filtrada por RLS no banco — a UI só reflete o que o backend já impõe

## O que ainda não está aqui
- Convite de novos usuários por e-mail (precisa de uma Edge Function com a `service_role` key —
  nunca no frontend). Por enquanto, para adicionar alguém à equipe, essa pessoa precisa criar a
  própria conta e você (ou um administrador) insere manualmente a linha em `organization_members`
  via SQL Editor até essa Edge Function existir.
- Agenda, CRM, Pacientes, Prontuário, Financeiro etc. — módulos das próximas fases (ver menu lateral,
  cada item ainda não construído mostra em qual fase ele está planejado).

## Deploy
Este projeto é compatível com Vercel, Netlify, ou importação direta no **Lovable** (que já resolve o
provisionamento do Supabase e o deploy pela própria interface — recomendado, já que era a compatibilidade
pedida originalmente). Se for usar o Lovable, importe este código do GitHub e conecte-o ao mesmo projeto
Supabase onde você rodou as migrations.
