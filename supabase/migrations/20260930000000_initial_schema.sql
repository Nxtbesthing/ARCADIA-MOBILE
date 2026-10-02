create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.product_availability as enum ('active', 'out_of_stock', 'hidden');
create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('pending', 'awaiting_confirmation', 'paid', 'failed', 'refunded');
create type public.repair_status as enum ('requested', 'received', 'diagnosing', 'awaiting_approval', 'repairing', 'testing', 'ready', 'completed', 'cancelled');

create table public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.manufacturer_series (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manufacturer_id, name),
  unique (id, manufacturer_id)
);

create table public.manufacturer_models (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.manufacturer_series(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, name),
  unique (id, series_id)
);

create table public.model_storage_options (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.manufacturer_models(id) on delete cascade,
  storage_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, storage_label),
  unique (id, model_id)
);

create table public.model_storage_colors (
  storage_option_id uuid not null references public.model_storage_options(id) on delete cascade,
  color_name text not null,
  created_at timestamptz not null default now(),
  primary key (storage_option_id, color_name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  manufacturer_model_id uuid not null references public.manufacturer_models(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, manufacturer_model_id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  manufacturer_model_id uuid not null,
  model_storage_option_id uuid not null,
  color_name text not null,
  sku text not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  availability public.product_availability not null default 'active',
  condition text not null default 'New',
  original_price numeric(12, 2) not null check (original_price >= 0),
  discount_percentage numeric(5, 2) not null default 0 check (discount_percentage >= 0 and discount_percentage <= 100),
  discount_amount numeric(12, 2) generated always as (round(original_price * discount_percentage / 100, 2)) stored,
  final_price numeric(12, 2) generated always as (round(original_price - (original_price * discount_percentage / 100), 2)) stored,
  warranty text not null default 'No Warranty',
  battery_health smallint check (battery_health is null or (battery_health >= 0 and battery_health <= 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, product_id),
  foreign key (product_id, manufacturer_model_id) references public.products(id, manufacturer_model_id),
  foreign key (model_storage_option_id, manufacturer_model_id) references public.model_storage_options(id, model_id),
  foreign key (model_storage_option_id, color_name) references public.model_storage_colors(storage_option_id, color_name)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  storage_path text not null unique,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (variant_id, product_id) references public.product_variants(id, product_id) on delete cascade
);

create unique index product_images_one_primary_per_product on public.product_images(product_id) where is_primary;
create unique index product_variants_sku_lower_idx on public.product_variants(lower(sku));

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, variant_id),
  foreign key (variant_id, product_id) references public.product_variants(id, product_id) on delete cascade
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid,
  created_at timestamptz not null default now(),
  foreign key (variant_id, product_id) references public.product_variants(id, product_id) on delete cascade
);

create unique index wishlists_product_unique_idx on public.wishlists(user_id, product_id) where variant_id is null;
create unique index wishlists_variant_unique_idx on public.wishlists(user_id, product_id, variant_id) where variant_id is not null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  status public.order_status not null default 'pending',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount_total numeric(12, 2) not null default 0 check (discount_total >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  grand_total numeric(12, 2) not null check (grand_total >= 0),
  payment_method text not null default 'bank_transfer' check (payment_method = 'bank_transfer'),
  payment_status public.payment_status not null default 'pending',
  delivery_method text not null check (delivery_method in ('delivery', 'pickup')),
  delivery_state text,
  delivery_city text,
  delivery_address text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_description text,
  sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  final_unit_price numeric(12, 2) not null check (final_unit_price >= 0),
  warranty text,
  line_total numeric(12, 2) generated always as (round(final_unit_price * quantity, 2)) stored,
  created_at timestamptz not null default now()
);

create table public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  device text not null,
  device_details text,
  problem text not null,
  description text,
  contacted boolean not null default false,
  repair_cost numeric(12, 2) check (repair_cost is null or repair_cost >= 0),
  communication_notes text,
  status public.repair_status not null default 'requested',
  preferred_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index manufacturer_models_series_id_idx on public.manufacturer_models(series_id);
create index model_storage_options_model_id_idx on public.model_storage_options(model_id);
create index products_model_id_idx on public.products(manufacturer_model_id);
create index products_category_id_idx on public.products(category_id);
create index products_active_idx on public.products(active);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_variants_availability_idx on public.product_variants(availability);
create index product_variants_stock_idx on public.product_variants(stock_quantity);
create index product_images_variant_id_idx on public.product_images(variant_id);
create index carts_user_id_idx on public.carts(user_id);
create index wishlists_user_id_idx on public.wishlists(user_id);
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index order_items_order_id_idx on public.order_items(order_id);
create index repair_requests_user_id_idx on public.repair_requests(user_id);
create index repair_requests_status_idx on public.repair_requests(status);
create index repair_requests_ticket_number_idx on public.repair_requests(ticket_number);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create or replace function public.validate_customer_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.user_id is distinct from (select auth.uid()) then
      raise exception 'Orders must belong to the authenticated customer.';
    end if;
    if new.status <> 'pending' or new.payment_status <> 'pending' then
      raise exception 'Customer orders must begin as pending.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger prevent_profile_role_escalation before update on public.profiles for each row execute function public.prevent_profile_role_escalation();
create trigger manufacturers_updated_at before update on public.manufacturers for each row execute function public.set_updated_at();
create trigger manufacturer_series_updated_at before update on public.manufacturer_series for each row execute function public.set_updated_at();
create trigger manufacturer_models_updated_at before update on public.manufacturer_models for each row execute function public.set_updated_at();
create trigger model_storage_options_updated_at before update on public.model_storage_options for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger product_images_updated_at before update on public.product_images for each row execute function public.set_updated_at();
create trigger carts_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger repair_requests_updated_at before update on public.repair_requests for each row execute function public.set_updated_at();
create trigger validate_customer_order_before_insert before insert on public.orders for each row execute function public.validate_customer_order();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.manufacturers enable row level security;
alter table public.manufacturer_series enable row level security;
alter table public.manufacturer_models enable row level security;
alter table public.model_storage_options enable row level security;
alter table public.model_storage_colors enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.repair_requests enable row level security;

create policy "public can read manufacturers" on public.manufacturers for select using (true);
create policy "public can read manufacturer series" on public.manufacturer_series for select using (true);
create policy "public can read manufacturer models" on public.manufacturer_models for select using (true);
create policy "public can read storage options" on public.model_storage_options for select using (true);
create policy "public can read storage colors" on public.model_storage_colors for select using (true);
create policy "public can read active categories" on public.categories for select using (active = true);
create policy "public can read active products" on public.products for select using (active = true);
create policy "public can read active variants" on public.product_variants for select using (
  availability = 'active'
  and exists (select 1 from public.products p where p.id = product_id and p.active = true)
);
create policy "public can read active product images" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and p.active = true)
);

create policy "admins manage manufacturers" on public.manufacturers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage manufacturer series" on public.manufacturer_series for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage manufacturer models" on public.manufacturer_models for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage storage options" on public.model_storage_options for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage storage colors" on public.model_storage_colors for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage repairs" on public.repair_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "customers manage own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "customers update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "customers manage own cart" on public.carts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "customers manage own wishlist" on public.wishlists for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "customers read own orders" on public.orders for select to authenticated using (user_id = (select auth.uid()));
create policy "customers create own pending orders" on public.orders for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending' and payment_status = 'pending');
create policy "customers read items from own orders" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
);
create policy "customers create items for own orders" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
);
create policy "customers read own repairs" on public.repair_requests for select to authenticated using (user_id = (select auth.uid()));
create policy "customers create own repairs" on public.repair_requests for insert to authenticated with check (user_id = (select auth.uid()));
create policy "guests may submit unowned repairs" on public.repair_requests for insert to anon with check (user_id is null);
