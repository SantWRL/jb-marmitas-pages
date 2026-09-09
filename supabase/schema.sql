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
  category    text not null default 'pratos' check (category in ('pratos', 'bebidas')),
  price       numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  out_of_stock boolean not null default false,
  image_url   text not null default 'assets/img/marmita-placeholder.svg',
  sort_order  int not null default 0
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text not null default 'novo' check (status in ('novo', 'aceito', 'entregue', 'cancelado')),
  customer_name  text not null,
  customer_email text,
  delivery_type  text not null default 'entrega' check (delivery_type in ('entrega', 'retirada')),
  address        text,
  reference      text,
  cutlery        boolean not null default false,
  payment_method text not null default 'pix' check (payment_method in ('pix', 'cartao', 'dinheiro')),
  payment_details text,
  total          numeric(10,2) not null default 0,
  items          jsonb not null default '[]'::jsonb
);

-- ---------- ROW LEVEL SECURITY ----------

alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Produtos: qualquer visitante lê o cardápio; só admins autenticados modificam
drop policy if exists "Cardápio público" on public.products;
create policy "Cardápio público"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin gerencia produtos" on public.products;
create policy "Admin gerencia produtos"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- Pedidos: qualquer visitante cria; só admins autenticados leem/editam
drop policy if exists "Cliente cria pedido" on public.orders;
create policy "Cliente cria pedido"
  on public.orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admin le pedidos" on public.orders;
create policy "Admin le pedidos"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "Admin atualiza pedidos" on public.orders;
create policy "Admin atualiza pedidos"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin exclui pedidos" on public.orders;
create policy "Admin exclui pedidos"
  on public.orders for delete
  to authenticated
  using (true);

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

insert into public.products (name, description, category, price, image_url)
values
  ('Marmita Comercial de Bife', 'Arroz branco, feijão tropeiro, bife acebolado, batata frita e salada.', 'pratos', 22.00, 'assets/img/marmita-placeholder.svg'),
  ('Marmita Frango Grelhado Fit', 'Arroz integral, feijão preto, filé de frango grelhado e legumes no vapor.', 'pratos', 19.90, 'assets/img/marmita-placeholder.svg'),
  ('Suco Natural de Laranja 500ml', 'Suco 100% natural, sem adição de açúcar.', 'bebidas', 7.00, 'assets/img/marmita-placeholder.svg')
on conflict do nothing;
