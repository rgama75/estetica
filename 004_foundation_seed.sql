-- ClinicFlow AI — Fase 1: Fundação SaaS
-- 004_foundation_seed.sql
-- Catálogo inicial de permissões + papéis de sistema (compartilhados entre organizações)

-- ---------- Permissions catalog ----------
insert into public.permissions (code, module, description) values
  ('organization.manage', 'organization', 'Editar dados da organização e configurações gerais'),
  ('units.manage', 'organization', 'Criar e editar unidades'),
  ('users.administer', 'organization', 'Gerenciar usuários, papéis e permissões'),
  ('audit.view', 'organization', 'Visualizar trilha de auditoria'),
  ('patients.view', 'patients', 'Visualizar pacientes'),
  ('patients.create', 'patients', 'Cadastrar pacientes'),
  ('patients.edit', 'patients', 'Editar dados de pacientes'),
  ('patients.delete', 'patients', 'Excluir (inativar) pacientes'),
  ('patients.export', 'patients', 'Exportar dados de pacientes'),
  ('professionals.manage', 'professionals', 'Gerenciar profissionais'),
  ('services.manage', 'services', 'Gerenciar procedimentos e serviços'),
  ('scheduling.view', 'scheduling', 'Visualizar agenda'),
  ('scheduling.create', 'scheduling', 'Criar agendamentos'),
  ('scheduling.edit', 'scheduling', 'Editar/reagendar agendamentos'),
  ('scheduling.cancel', 'scheduling', 'Cancelar agendamentos'),
  ('medical_records.view', 'medical_records', 'Visualizar prontuário clínico'),
  ('medical_records.edit', 'medical_records', 'Editar prontuário clínico'),
  ('photos.view', 'photos', 'Visualizar fotos clínicas'),
  ('photos.upload', 'photos', 'Enviar fotos clínicas'),
  ('crm.view', 'crm', 'Visualizar pipeline comercial'),
  ('crm.manage', 'crm', 'Gerenciar oportunidades e pipeline'),
  ('evaluations.manage', 'evaluations', 'Gerenciar avaliações'),
  ('proposals.view', 'proposals', 'Visualizar propostas'),
  ('proposals.manage', 'proposals', 'Criar e editar propostas'),
  ('discounts.grant', 'proposals', 'Conceder descontos'),
  ('sales.view', 'sales', 'Visualizar vendas'),
  ('sales.create', 'sales', 'Registrar vendas'),
  ('sales.cancel', 'sales', 'Cancelar vendas'),
  ('packages.view', 'packages', 'Visualizar pacotes'),
  ('packages.adjust', 'packages', 'Ajustar saldo/status de pacotes'),
  ('subscriptions.manage', 'subscriptions', 'Gerenciar assinaturas'),
  ('financial.view', 'financial', 'Visualizar financeiro'),
  ('financial.manage', 'financial', 'Lançar e editar financeiro'),
  ('commissions.manage', 'financial', 'Gerenciar comissões'),
  ('reports.access', 'reports', 'Acessar relatórios'),
  ('automations.manage', 'automations', 'Gerenciar automações'),
  ('tasks.manage', 'tasks', 'Gerenciar tarefas')
on conflict (code) do nothing;

-- ---------- System roles ----------
insert into public.roles (organization_id, name, slug, description, is_system) values
  (null, 'Proprietário', 'owner', 'Acesso total à organização', true),
  (null, 'Administrador', 'administrator', 'Acesso administrativo total', true),
  (null, 'Gestor', 'manager', 'Gestão operacional e comercial', true),
  (null, 'Recepção', 'reception', 'Atendimento, agenda e cadastro de pacientes', true),
  (null, 'Comercial', 'sales', 'CRM, avaliações, propostas e vendas', true),
  (null, 'Profissional', 'professional', 'Atendimento clínico e prontuário', true),
  (null, 'Financeiro', 'finance', 'Gestão financeira e comissões', true)
on conflict (slug) where organization_id is null do nothing;

-- ---------- Role x Permission mapping ----------

-- owner e administrator: todas as permissões
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.slug in ('owner','administrator') and r.organization_id is null
on conflict (role_id, permission_id) do nothing;

-- manager: tudo, exceto organization.manage e users.administer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.slug = 'manager' and r.organization_id is null
  and p.code not in ('organization.manage','users.administer')
on conflict (role_id, permission_id) do nothing;

-- reception
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.slug = 'reception' and r.organization_id is null
  and p.code in (
    'patients.view','patients.create','patients.edit',
    'scheduling.view','scheduling.create','scheduling.edit','scheduling.cancel',
    'crm.view','tasks.manage'
  )
on conflict (role_id, permission_id) do nothing;

-- sales (comercial)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.slug = 'sales' and r.organization_id is null
  and p.code in (
    'patients.view','patients.create',
    'crm.view','crm.manage','evaluations.manage',
    'proposals.view','proposals.manage',
    'sales.view','sales.create',
    'packages.view','subscriptions.manage',
    'tasks.manage','reports.access'
  )
on conflict (role_id, permission_id) do nothing;

-- professional (profissional clínico)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.slug = 'professional' and r.organization_id is null
  and p.code in (
    'patients.view',
    'scheduling.view',
    'medical_records.view','medical_records.edit',
    'photos.view','photos.upload',
    'evaluations.manage'
  )
on conflict (role_id, permission_id) do nothing;

-- finance
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.slug = 'finance' and r.organization_id is null
  and p.code in (
    'financial.view','financial.manage','commissions.manage',
    'sales.view','packages.view','subscriptions.manage',
    'reports.access','audit.view'
  )
on conflict (role_id, permission_id) do nothing;
