-- ============================================================
-- JB Marmitas — Registro do Administrador do Painel
-- ============================================================
-- Este arquivo NÃO precisa ser executado se você criar o usuário
-- pela interface: Dashboard > Authentication > Users > Add user.
--
-- Prefira a interface (recomendado). Só use este SQL se você tiver
-- configurado o SMTP no Supabase (sem SMTP o Supabase não envia o
-- convite por email e a conta fica pendente de confirmação).
--
-- IMPORTANTE: antes de rodar, confira se o email abaixo é o mesmo
-- do admin em supabase/schema.sql (função is_admin).
-- ============================================================

-- 1) Verificação rápida de acesso: o SQL Editor consegue ler auth.users?
--    Deve retornar uma única linha com acesso_ok = t.
--    (O "select auth.users where false" antigo era SQL inválido:
--    erro 42P01 missing FROM-clause entry for table "auth".)
select exists (select 1 from auth.users) as acesso_ok;

insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@jbmarmitas.com.br',                    -- ⚠️ email do admin
  crypt('TroqueEstaSenhaAgora@2026', gen_salt('bf', 12)),  -- ⚠️ senha inicial
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"admin"}'::jsonb,
  now(), now(), '', ''
)
-- Sem alvo de conflito: funciona em qualquer versão do schema auth
-- (o índice único de email varia entre versões do GoTrue/Supabase).
on conflict do nothing;

-- 2) Confirma que a função is_admin() reconhece o email:
--    (rode e veja se retorna t; se retornar f, os emails não batem)
create or replace function public.temp_check_admin()
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from auth.users
    where lower(email) = 'admin@jbmarmitas.com.br'
  );
$$;

select public.temp_check_admin() as admin_email_encontrado;

-- 3) Limpeza da função temporária:
drop function public.temp_check_admin();

-- ============================================================
-- Depois de criar a conta:
--   1. No código: confira o email em supabase/schema.sql (is_admin)
--      e reexecute o schema.sql para atualizar as políticas RLS.
--   2. No Supabase: Authentication > Providers > Email — mantenha
--      "Confirm email" LIGADO (bom para LGPD e anti-abuse).
--   3. Acesse /painel-jb-2026.html e entre com o email e a senha.
--   4. Troque a senha inicial em "Sua conta JB" no site ou pelo
--      painel do Supabase (Authentication > Users > ... > Send
--      password recovery), se preferir.
-- ============================================================
