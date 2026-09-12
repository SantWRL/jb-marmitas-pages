-- ============================================================
-- JB Marmitas — Correção do RLS da tabela `orders`
-- Erro corrigido: "new row violates row-level security policy
--                 for table \"orders\""
--
-- Quando usar: se o cliente consegue montar o pedido no site, mas
-- o INSERT em `orders` falha com o erro acima.
--
-- Como usar: Dashboard do Supabase > SQL Editor > New query >
-- cole este arquivo inteiro > Run. Pode ser re-executado sem
-- problemas (é idempotente).
-- ============================================================

-- ---------- 1. DIAGNÓSTICO (opcional, só para conferir) ----------
-- Mostra as políticas que estão HOJE na tabela orders. Se houver
-- qualquer política de INSERT que não seja a "Cliente cria pedido"
-- abaixo (ou se não houver nenhuma), era essa a causa do erro.
select policyname, cmd, roles, with_check
from pg_policies
where schemaname = 'public' and tablename = 'orders';

-- ---------- 2. LIMPA todas as políticas antigas de orders ----------
-- Apaga pelo nome real no catálogo (funciona mesmo que o nome
-- seja diferente do schema.sql, ex.: versões antigas).
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', pol.policyname);
  end loop;
end $$;

-- ---------- 3. RECRIA exatamente como no schema.sql ----------

-- Cliente (anon ou logado) pode criar pedido: nenhuma restrição
-- além das constraints da tabela.
create policy "Cliente cria pedido"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- Somente admins autenticados leem, atualizam e excluem pedidos.
create policy "Admin le pedidos"
  on public.orders for select
  to authenticated
  using (true);

create policy "Admin atualiza pedidos"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin exclui pedidos"
  on public.orders for delete
  to authenticated
  using (true);

-- ---------- 4. CONFIRMAÇÃO ----------
-- Deve listar as 4 políticas acima (1 insert, 1 select,
-- 1 update, 1 delete).
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'orders'
order by cmd;
