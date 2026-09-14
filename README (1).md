# ClinicFlow AI — Fase 1: Fundação SaaS + Frontend Integrado

**Estrutura deste pacote:**
```
clinicflow-ai/
├── migrations/    → SQL para rodar no seu projeto Supabase (nesta ordem)
└── app/           → Frontend React + TS + Tailwind + Supabase JS, já integrado
                      (login, onboarding, dashboard, unidades, equipe/permissões)
```
Comece pelas migrations abaixo, depois vá para `app/README.md` para rodar o frontend.


## Como aplicar no Supabase

No Dashboard do Supabase → SQL Editor, ou via Supabase CLI (`supabase db push` / `supabase migration new`),
rode os arquivos **nesta ordem exata**:

1. `001_foundation_schema.sql` — tabelas
2. `002_foundation_functions.sql` — funções de RLS, triggers, onboarding automático
3. `003_foundation_rls.sql` — políticas de Row Level Security
4. `004_foundation_seed.sql` — catálogo de permissões + papéis de sistema

Não precisa (e não deve) rodar nenhum "000_supabase_env_simulation" — isso não existe aqui;
esse arquivo foi usado só no meu ambiente de teste local para simular `auth.users` e `auth.uid()`,
que no Supabase já existem nativamente.

## O que foi implementado

**Hierarquia de tenant:** Organização (= a clínica) → Unidades (filiais). 2 níveis, conforme definido.

**Tabelas:**
- `organizations` — tenant raiz, com `created_by` para resolver a janela entre criação e vínculo de membro
- `units` — filiais da organização
- `user_profiles` — extensão de `auth.users`
- `permissions` — catálogo fixo de ~36 permissões granulares (patients.*, scheduling.*, financial.*, etc.)
- `roles` — papéis de sistema (compartilhados entre orgs) + suporte a papéis customizados por organização
- `role_permissions` — matriz papel × permissão
- `organization_members` — vínculo usuário ↔ organização (N:N — um usuário pode pertencer a várias organizações, com um papel por organização)
- `user_unit_access` — acesso granular a unidades específicas quando `all_units_access = false`
- `audit_logs` — trilha de auditoria imutável (antes/depois, usuário, timestamp)

**Papéis de sistema seedados:** proprietário, administrador, gestor, recepção, comercial, profissional, financeiro — cada um com seu conjunto de permissões padrão. Organizações podem criar papéis customizados adicionais (`roles.organization_id` não-nulo).

**Funções de segurança (SECURITY DEFINER, evitam recursão de RLS):**
- `is_org_member(org_id)` 
- `user_has_permission(org_id, permission_code)`
- `user_has_unit_access(unit_id)`
- `current_user_org_ids()`

**Automações via trigger:**
- Ao criar uma organização → cria automaticamente o vínculo do criador como `owner` (com acesso a todas as unidades) e a unidade "Matriz"
- Toda alteração em `organization_members` e em `role_permissions` de papéis customizados gera `audit_logs` com estado anterior/posterior
- `updated_at` automático em todas as tabelas mutáveis

## Decisões tomadas com base nas suas respostas
- Organização = 1 clínica; Unidade = filiais (hierarquia de 2 níveis)
- Um usuário pode pertencer a várias organizações (tabela N:N `organization_members`)
- Soft delete em tudo (`deleted_at`, ainda não implementado nas tabelas operacionais das próximas fases, mas já presente em `organizations` e `units`)

## Testado (ambiente Postgres 16 local simulando o Supabase)
1. ✅ Onboarding completo: criar organização → trigger cria membership `owner` + unidade "Matriz" automaticamente
2. ✅ Isolamento multi-tenant: usuário da organização A não enxerga nada da organização B
3. ✅ RBAC aplicado no banco (não só na UI): usuário com papel "recepção" é bloqueado por RLS ao tentar criar uma unidade
4. ✅ `user_has_permission()` retorna corretamente `true`/`false` por permissão e por papel
5. ✅ Promoção de papel (recepção → gestor) libera a ação imediatamente, e fica registrada em `audit_logs` com valores antes/depois
6. ✅ Usuário anônimo (sem JWT) não vê nem consegue inserir nenhuma linha
7. ✅ Catálogo de permissões e papéis populado sem gerar ruído de auditoria (147 inserts do seed corretamente não geram audit_logs, pois papéis de sistema não pertencem a nenhuma organização)

## Bug real encontrado e corrigido durante o teste
O fluxo de onboarding (`INSERT ... RETURNING`, que é exatamente o que o Supabase JS faz com `.insert().select()`)
falhava por RLS: a política de SELECT de `organizations` checava se o usuário já era membro, mas o vínculo de
membro só é criado pelo trigger *depois* que o Postgres já avalia a visibilidade da linha para o `RETURNING`.
Corrigido adicionando `organizations.created_by` e liberando a visibilidade também para `created_by = auth.uid()`.
Sem esse teste real, esse bug só apareceria em produção, no primeiro cadastro de clínica.

## Frontend integrado (atualização)
Construí o app em `app/` (React + TypeScript + Vite + Tailwind v4 + `@supabase/supabase-js`),
com TypeScript compilando limpo e build de produção validado (`npm run build`). Ele já implementa,
de ponta a ponta, exatamente os fluxos testados na seção acima: cadastro/login, onboarding (criação
de organização com `INSERT ... RETURNING`, usando a correção do `created_by`), dashboard com checklist
inicial, CRUD de unidades e gestão de papéis da equipe — cada tela consultando o Supabase diretamente
e respeitando as políticas de RLS (não há lógica de permissão duplicada "confiável" no frontend;
a UI só espelha o que o banco já impõe).

**Importante — o que eu não consegui testar de ponta a ponta:** meu ambiente de execução não tem
acesso de rede a `*.supabase.co` (só a registries de pacotes como npm/pip/GitHub), então não criei
um projeto Supabase real nem rodei o app contra um backend ao vivo. O que validei com certeza:
o SQL das migrations (rodado de verdade, com os 12 testes já relatados) e o código do frontend
(TypeScript sem erros, build de produção passando). A integração entre os dois segue exatamente o
schema/RLS testado, mas o fluxo de UI final (clicar em "Criar conta" → onboarding → dashboard num
navegador de verdade) ainda precisa ser conferido por você com um projeto Supabase real — veja
`app/README.md` para os passos.

## Pendências / próximos passos
- Convite de novos usuários por e-mail precisa de uma Edge Function com a `service_role` key (nunca pode ir para o frontend) — não implementado ainda; a tela de Equipe já gerencia papéis de quem já tem conta
- `user_unit_access` e `all_units_access` estão prontos no schema e no frontend (contexto `OrgContext`), mas a tela de atribuir unidades específicas por usuário ainda não foi construída
- Falta CI: recomendo versionar `migrations/` e `app/` no GitHub e usar `supabase db diff` / `supabase migration up` no pipeline
- Deploy: recomendo Lovable (importar do GitHub, conectar ao mesmo projeto Supabase) já que era a compatibilidade pedida na spec original; Vercel/Netlify também funcionam sem ajuste

## Riscos identificados
- **Papéis de sistema compartilhados entre todas as organizações**: se uma clínica pedir para customizar o que "recepção" pode fazer, ela precisará criar um papel próprio (`roles.organization_id` preenchido) em vez de editar o papel de sistema — os papéis de sistema são somente leitura por design. Isso é intencional, mas vale confirmar que está alinhado com a expectativa de produto antes da Fase 2.
- `permissions.code` é um catálogo fixo definido em SQL — adicionar uma permissão nova sempre exigirá uma migration. Isso é proposital (não queremos permissões arbitrárias criadas via app), mas é bom deixar registrado.

## Próximo passo recomendado
Fase 2: `patients`, `professionals`, `services`, `rooms`, `resources`, todos com `organization_id` + `unit_id`,
reutilizando exatamente as mesmas funções de RLS (`is_org_member`, `user_has_permission`, `user_has_unit_access`)
já validadas nesta fase.
