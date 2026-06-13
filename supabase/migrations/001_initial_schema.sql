-- ============================================================
-- Utama POS — Initial Schema Migration
-- Jalankan di Supabase SQL Editor (atau via supabase db push)
-- ============================================================

-- ── Extension ────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ============================================================
-- TABEL: roles
-- ============================================================
create table if not exists public.roles (
  role_id   uuid primary key default gen_random_uuid(),
  role_name varchar(20) not null unique check (role_name in ('owner', 'cashier'))
);

insert into public.roles (role_name)
values ('owner'), ('cashier')
on conflict (role_name) do nothing;

-- ============================================================
-- TABEL: users  (extension dari auth.users)
-- ============================================================
create table if not exists public.users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role_id    uuid not null references public.roles (role_id),
  email      varchar(255) not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABEL: brands
-- ============================================================
create table if not exists public.brands (
  brand_id   uuid primary key default gen_random_uuid(),
  brand_name varchar(100) not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABEL: products
-- ============================================================
create table if not exists public.products (
  product_id      uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references public.brands (brand_id) on delete restrict,
  serial_number   varchar(100) not null unique,
  barcode         varchar(50) not null unique,
  base_price      numeric(15,2) not null check (base_price > 0),
  available_stock integer not null default 0 check (available_stock >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_products_barcode on public.products (barcode);
create index if not exists idx_products_brand on public.products (brand_id);

-- ============================================================
-- TABEL: transactions
-- ============================================================
create table if not exists public.transactions (
  transaction_id   uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (user_id),
  product_id       uuid not null references public.products (product_id) on delete restrict,
  transaction_time timestamptz not null default now(),
  final_price      numeric(15,2) not null check (final_price > 0),
  quantity         integer not null default 1 check (quantity >= 1),
  created_at       timestamptz not null default now()
);

create index if not exists idx_transactions_time on public.transactions (transaction_time);
create index if not exists idx_transactions_user on public.transactions (user_id);

-- ============================================================
-- TABEL: stock_opname_sessions
-- ============================================================
create table if not exists public.stock_opname_sessions (
  session_id   uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (user_id),
  session_date date not null default current_date,
  status       varchar(20) not null default 'ongoing' check (status in ('ongoing', 'completed')),
  notes        text,
  created_at   timestamptz not null default now()
);

-- Hanya boleh ada satu sesi 'ongoing' pada satu waktu
create unique index if not exists idx_one_ongoing_session
  on public.stock_opname_sessions (status)
  where status = 'ongoing';

-- ============================================================
-- TABEL: stock_opname_scanned_items
-- ============================================================
create table if not exists public.stock_opname_scanned_items (
  item_id          uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.stock_opname_sessions (session_id) on delete cascade,
  product_id       uuid not null references public.products (product_id) on delete restrict,
  scanned_quantity integer not null default 1 check (scanned_quantity >= 0),
  unique (session_id, product_id)
);

-- ============================================================
-- TRIGGER: auto-update updated_at di products
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- HELPER: ambil role_name dari user yang sedang login
-- ============================================================
create or replace function public.current_user_role()
returns varchar as $$
  select r.role_name
  from public.users u
  join public.roles r on r.role_id = u.role_id
  where u.user_id = auth.uid();
$$ language sql security definer stable;

-- ============================================================
-- RPC: record_transaction (atomic — insert transaksi + kurangi stok)
-- ============================================================
create or replace function public.record_transaction(
  p_product_id uuid,
  p_final_price numeric,
  p_quantity integer
)
returns uuid as $$
declare
  v_stock integer;
  v_transaction_id uuid;
begin
  -- Kunci baris produk untuk mencegah race condition
  select available_stock into v_stock
  from public.products
  where product_id = p_product_id
  for update;

  if v_stock is null then
    raise exception 'Produk tidak ditemukan';
  end if;

  if v_stock < p_quantity then
    raise exception 'Stok tidak mencukupi. Tersedia: %, diminta: %', v_stock, p_quantity;
  end if;

  insert into public.transactions (user_id, product_id, final_price, quantity)
  values (auth.uid(), p_product_id, p_final_price, p_quantity)
  returning transaction_id into v_transaction_id;

  update public.products
  set available_stock = available_stock - p_quantity
  where product_id = p_product_id;

  return v_transaction_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: scan_opname_item (upsert — increment scanned_quantity)
-- ============================================================
create or replace function public.scan_opname_item(
  p_session_id uuid,
  p_barcode varchar
)
returns public.stock_opname_scanned_items as $$
declare
  v_product_id uuid;
  v_row public.stock_opname_scanned_items;
begin
  select product_id into v_product_id
  from public.products
  where barcode = p_barcode;

  if v_product_id is null then
    raise exception 'Barcode tidak terdaftar: %', p_barcode;
  end if;

  insert into public.stock_opname_scanned_items (session_id, product_id, scanned_quantity)
  values (p_session_id, v_product_id, 1)
  on conflict (session_id, product_id)
  do update set scanned_quantity = public.stock_opname_scanned_items.scanned_quantity + 1
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.stock_opname_sessions enable row level security;
alter table public.stock_opname_scanned_items enable row level security;

-- roles: semua authenticated boleh baca
create policy "roles_select" on public.roles
  for select to authenticated using (true);

-- users: hanya baca/ubah data sendiri
create policy "users_select_own" on public.users
  for select to authenticated using (auth.uid() = user_id);
create policy "users_update_own" on public.users
  for update to authenticated using (auth.uid() = user_id);

-- brands: semua baca; hanya owner yang ubah
create policy "brands_select" on public.brands
  for select to authenticated using (true);
create policy "brands_modify_owner" on public.brands
  for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- products: semua baca; hanya owner yang ubah
create policy "products_select" on public.products
  for select to authenticated using (true);
create policy "products_modify_owner" on public.products
  for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- transactions: owner lihat semua, cashier lihat miliknya; semua boleh insert
create policy "transactions_select" on public.transactions
  for select to authenticated
  using (public.current_user_role() = 'owner' or user_id = auth.uid());
create policy "transactions_insert" on public.transactions
  for insert to authenticated with check (user_id = auth.uid());

-- stock opname: hanya owner
create policy "opname_sessions_owner" on public.stock_opname_sessions
  for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');
create policy "opname_items_owner" on public.stock_opname_scanned_items
  for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- ============================================================
-- CATATAN SETUP MANUAL
-- ============================================================
-- 1. Buat user via Supabase Dashboard > Authentication > Users (Add user).
-- 2. Setelah user dibuat, jalankan insert ke public.users dengan role yang sesuai:
--
--    insert into public.users (user_id, role_id, email)
--    values (
--      '<uuid-dari-auth-users>',
--      (select role_id from public.roles where role_name = 'owner'),
--      'owner@utamaarloji.com'
--    );
--
-- 3. Ulangi untuk akun cashier dengan role_name = 'cashier'.
