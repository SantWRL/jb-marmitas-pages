-- ============================================================
-- JB Marmitas — Schema Supabase
-- Cole e execute este arquivo inteiro no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New query > Run)
-- ============================================================

-- ---------- TABELAS ----------

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  description text not null default '',
  category    text not null default 'pratos' check (category in ('pratos', 'bebidas', 'porcoes', 'sobremesas', 'combos')),
  price       numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  out_of_stock boolean not null default false,
  best_seller boolean not null default false,
  image_url   text not null default 'assets/img/marmita-placeholder.svg',
  sort_order  int not null default 0
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text not null default 'novo' check (status in ('novo', 'aceito', 'entregue', 'cancelado')),
  customer_name  text not null,
  customer_email text,
  customer_phone text,
  delivery_type  text not null default 'entrega' check (delivery_type in ('entrega', 'retirada')),
  address        text,
  district       text,
  reference      text,
  cutlery        boolean not null default false,
  payment_method text not null default 'pix' check (payment_method in ('pix', 'cartao', 'dinheiro')),
  payment_details text,
  lgpd_consent_at timestamptz,
  order_number   bigint,
  total          numeric(10,2) not null default 0,
  items          jsonb not null default '[]'::jsonb
);

-- Nº do pedido (exibição). Índice comum, NÃO único: dois pedidos
-- simultâneos podem calcular o mesmo número (contagem no navegador) e um
-- índice único rejeitaria o pedido de um cliente de verdade. Duplicado é
-- inofensivo; pedido perdido não.
create index if not exists orders_order_number_idx
  on public.orders (order_number)
  where order_number is not null;

-- Migração para tabelas criadas por versões anteriores do schema: adiciona
-- as colunas novas sem tocar em nada que já existe. Pode re-executar.
alter table public.orders add column if not exists customer_phone   text;
alter table public.orders add column if not exists district         text;
alter table public.orders add column if not exists order_number     bigint;
-- LGPD art. 7º, I: guarda o momento do consentimento dado pelo cliente
-- (checkbox do checkout). Nulo = pedido criado antes da migração.
alter table public.orders add column if not exists lgpd_consent_at  timestamptz;

-- ---------- HORÁRIO DE FUNCIONAMENTO (11h às 14h) ----------
-- Balsas-MA é UTC-3 o ano inteiro (sem horário de verão no Brasil desde
-- 2019), então a janela 11h-14h local equivale a 14h-17h UTC. A checagem
-- usa o relógio DO SERVIDOR (now()): relógio errado no celular do cliente
-- ou um site adulterado não conseguem cadastrar pedido fora do horário.
-- O erro volta claro para o checkout ("Erro ao enviar o pedido: ...").
create or replace function public.enforce_order_hours()
returns trigger
language plpgsql
as $$
begin
  if extract(hour from (now() at time zone 'UTC')) not between 14 and 16 then
    raise exception using
      errcode = 'check_violation',
      message = 'Pedidos aceitos apenas das 11h às 14h (horário de Balsas). Volte no horário!';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_hours_guard on public.orders;
create trigger orders_hours_guard
  before insert on public.orders
  for each row
  execute function public.enforce_order_hours();

-- ---------- ADMINISTRADOR (LGPD + segurança) ----------

-- Função central de autorização: SECURITY DEFINER para enxergar auth.users
-- dentro das políticas de RLS. STABLE = resultado igual dentro do statement.
-- O email é comparado em minúsculas para evitar bisbilhotar caixa alta/baixa.
-- REGISTRE O ADMIN em Authentication > Users com EXATAMENTE este email
-- (ou edite o email abaixo e rode este arquivo de novo).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = 'admin@jbmarmitas.com.br'
      and id = auth.uid()
  );
$$;

-- ---------- ROW LEVEL SECURITY ----------

alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Produtos: qualquer visitante lê o cardápio; SÓ O ADMIN modifica
-- (antes, qualquer conta autenticada podia apagar o cardápio inteiro).
drop policy if exists "Cardápio público" on public.products;
create policy "Cardápio público"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin gerencia produtos" on public.products;
drop policy if exists "Admin gerencia produtos (is_admin)" on public.products;
create policy "Admin gerencia produtos (is_admin)"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Pedidos: qualquer visitante cria (com consentimento LGPD);
-- leitura, edição e exclusão SÓ PARA O ADMIN.
drop policy if exists "Cliente cria pedido" on public.orders;
create policy "Cliente cria pedido"
  on public.orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admin le pedidos" on public.orders;
drop policy if exists "Admin le pedidos (is_admin)" on public.orders;
create policy "Admin le pedidos (is_admin)"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin atualiza pedidos" on public.orders;
drop policy if exists "Admin atualiza pedidos (is_admin)" on public.orders;
create policy "Admin atualiza pedidos (is_admin)"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin exclui pedidos" on public.orders;
drop policy if exists "Admin exclui pedidos (is_admin)" on public.orders;
create policy "Admin exclui pedidos (is_admin)"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- ---------- STORAGE (fotos dos produtos) ----------

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "Leitura pública das fotos" on storage.objects;
create policy "Leitura pública das fotos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'produtos');

drop policy if exists "Admin envia fotos" on storage.objects;
create policy "Admin envia fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'produtos');

drop policy if exists "Admin atualiza fotos" on storage.objects;
create policy "Admin atualiza fotos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'produtos')
  with check (bucket_id = 'produtos');

drop policy if exists "Admin exclui fotos" on storage.objects;
create policy "Admin exclui fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'produtos');

-- ---------- REALTIME (painel atualiza sozinho) ----------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- ---------- DADOS INICIAIS ----------

-- Cardápio real da JB Marmitas. O insert é idempotente (on conflict do
-- nothing), então pode ser re-executado sem duplicar itens já existentes.
insert into public.products (name, description, category, price, image_url)
values
  ('Bisteca Suína P', 'Bisteca suína com arroz, feijão, farofa e salada verde.', 'pratos', 19.00, 'assets/img/marmita-placeholder.svg'),
  ('Bisteca Suína G', 'Bisteca suína com arroz, feijão, farofa e salada verde. Porção grande.', 'pratos', 22.00, 'assets/img/marmita-placeholder.svg'),
  ('Filé de Frango P', 'Filé de frango com arroz, feijão, macarrão e salada verde.', 'pratos', 19.00, 'assets/img/marmita-placeholder.svg'),
  ('Filé de Frango G', 'Filé de frango com arroz, feijão, macarrão e salada verde. Porção grande.', 'pratos', 22.00, 'assets/img/marmita-placeholder.svg'),
  ('Strogonoff de Frango', 'Strogonoff de frango com arroz, purê de batata, legumes salteados e salada verde.', 'pratos', 25.00, 'assets/img/marmita-placeholder.svg'),
  ('Carne Trinchada', 'Carne trinchada com arroz, feijão, batata frita e salada verde.', 'pratos', 25.00, 'assets/img/marmita-placeholder.svg'),
  ('Bife Acebolado P', 'Bife acebolado com acompanhamentos do dia. Tamanho P.', 'pratos', 19.00, 'assets/img/marmita-placeholder.svg'),
  ('Bife Acebolado G', 'Bife acebolado com acompanhamentos do dia. Tamanho G.', 'pratos', 22.00, 'assets/img/marmita-placeholder.svg'),
  ('Coca-Cola 1 Litro', 'Refrigerante Coca-Cola garrafa 1 litro.', 'bebidas', 12.00, 'assets/img/marmita-placeholder.svg'),
  ('Refrigerante Mini Lata', 'Refrigerante mini lata gelado.', 'bebidas', 5.00, 'assets/img/marmita-placeholder.svg'),
  ('Refrigerante Lata', 'Refrigerante lata 350ml gelado.', 'bebidas', 6.00, 'assets/img/marmita-placeholder.svg'),
  ('Água com Gás', 'Água mineral com gás 500ml.', 'bebidas', 5.00, 'assets/img/marmita-placeholder.svg'),
  ('H2O Limoneto', 'Água saborizada H2O! Limoneto 500ml.', 'bebidas', 10.00, 'assets/img/marmita-placeholder.svg')
on conflict do nothing;

-- Especiais da semana e adicionais ainda sem preço definido. Cadastre o valor
-- no painel admin (ou descomente a linha com o preço) para publicá-los:
-- Toda quarta: Combo especial | Toda sexta: Peixe frito
-- Sábados e domingos: Vatapá de frango | Feijoada
-- Adicionais: arroz, feijão, farofa e batata frita
-- Exemplo:
-- insert into public.products (name, description, category, price, image_url)
-- values ('Combo Especial de Quarta', '...', 'combos', 0.00, 'assets/img/marmita-placeholder.svg');

-- Itens criados depois de rodar a versão antiga do schema: migre com
--   alter table public.products
--     drop constraint products_category_check;
--     add constraint products_category_check
--       check (category in ('pratos', 'bebidas', 'porcoes', 'sobremesas', 'combos'));
--   alter table public.products add column if not exists best_seller boolean not null default false;
-- (o check antigo não é recriado automaticamente em tabelas já existentes).
