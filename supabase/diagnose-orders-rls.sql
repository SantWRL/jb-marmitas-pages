-- Diagnóstico rápido: políticas ativas em public.orders
-- Cole no SQL Editor do Supabase. Se não mostrar a política
-- "Cliente cria pedido" com roles anon,authenticated, o
-- insert de pedidos pode falhar com 42501 de RLS.

select
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public' and tablename = 'orders'
order by cmd;
