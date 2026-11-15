-- =====================================================================
-- Vape Dubai King: Supabase schema (Postgres + Row Level Security)
-- Replaces the old Express + Drizzle + Cloud SQL + Firebase backend.
--
-- Run via the Supabase CLI (`supabase db push`) or paste into the
-- Supabase Dashboard > SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: one row per auth user. `role` decides admin access.
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  phone        text,
  emirate      text default 'Dubai',
  role         text not null default 'customer' check (role in ('admin', 'customer')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- True when the calling user is an admin. SECURITY DEFINER so it can read
-- profiles without recursing through that table's own RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Create a profile automatically when someone signs up. The role is ALWAYS
-- 'customer' here; it is never read from user-supplied signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Customer'
    ),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change a role. Direct SQL (SQL editor / service role, where
-- there is no signed-in user) is allowed, which is how the first admin is made.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change a role' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;

create policy "profiles: read own or admin"
  on public.profiles for select
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- categories + products (public read, admin write)
-- ---------------------------------------------------------------------
create table public.categories (
  slug               text primary key,
  name               text not null,
  tagline            text not null,
  description        text not null,
  starting_price_aed numeric(10, 2) not null check (starting_price_aed >= 0),
  created_at         timestamptz not null default now()
);

create table public.products (
  slug                text primary key,
  title               text not null,
  brand               text not null,
  category            text not null,
  price_aed           numeric(10, 2) not null check (price_aed >= 0),
  original_price_aed  numeric(10, 2) check (original_price_aed is null or original_price_aed >= 0),
  puff_count          text,
  nicotine_strength   text not null,
  flavor_profile      text not null,
  image               text not null,
  stock_count         integer not null default 0 check (stock_count >= 0),
  in_stock            boolean not null default true,
  is_offer            boolean not null default false,
  description         text not null,
  flavors             jsonb not null default '[]'::jsonb,
  nicotine_options    jsonb not null default '[]'::jsonb,
  specs               jsonb not null default '{}'::jsonb,
  -- gallery, longDescription, highlights, tastingNotes, boxContents
  details             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index products_category_idx on public.products (category);

alter table public.categories enable row level security;
alter table public.products   enable row level security;

create policy "categories: public read" on public.categories for select using (true);
create policy "categories: admin insert" on public.categories for insert with check (public.is_admin());
create policy "categories: admin update" on public.categories for update using (public.is_admin()) with check (public.is_admin());
create policy "categories: admin delete" on public.categories for delete using (public.is_admin());

create policy "products: public read" on public.products for select using (true);
create policy "products: admin insert" on public.products for insert with check (public.is_admin());
create policy "products: admin update" on public.products for update using (public.is_admin()) with check (public.is_admin());
create policy "products: admin delete" on public.products for delete using (public.is_admin());

-- ---------------------------------------------------------------------
-- orders + order_items
-- Customers cannot insert/update these directly. They create orders through
-- place_order() below, which recomputes every price from the products table.
-- ---------------------------------------------------------------------
create table public.orders (
  id                bigint generated always as identity primary key,
  order_number      text not null unique check (order_number ~ '^VDK-[0-9]{6}$'),
  user_id           uuid references auth.users (id) on delete set null,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  emirate           text not null,
  delivery_address  text not null,
  payment_method    text not null check (payment_method in ('Cash on Delivery', 'Card Link on Delivery')),
  status            text not null default 'order_placed'
                    check (status in ('order_placed', 'age_verified', 'packed_al_quoz', 'out_for_delivery', 'delivered')),
  courier_name      text not null default 'Rashid Al-Mansoor · Dubai Express Bike #14',
  estimated_arrival text not null default 'Within 90 mins (Same-Day UAE Dispatch)',
  subtotal_aed      numeric(10, 2) not null check (subtotal_aed >= 0),
  shipping_fee_aed  numeric(10, 2) not null check (shipping_fee_aed >= 0),
  total_aed         numeric(10, 2) not null check (total_aed >= 0),
  items             jsonb not null default '[]'::jsonb,
  timeline          jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index orders_user_id_idx on public.orders (user_id);
create index orders_email_idx on public.orders (lower(customer_email));
create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id               bigint generated always as identity primary key,
  order_id         bigint not null references public.orders (id) on delete cascade,
  product_slug     text not null,
  product_title    text not null,
  selected_flavor  text not null,
  selected_nicotine text not null,
  pack_label       text not null,
  quantity         integer not null check (quantity > 0),
  unit_price_aed   numeric(10, 2) not null check (unit_price_aed >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "orders: read own or admin"
  on public.orders for select
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "orders: admin update"
  on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

create policy "order_items: read own or admin"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- email_logs + newsletter_leads (written only by the send-email Edge Function
-- via the service role, which bypasses RLS; admins can read them)
-- ---------------------------------------------------------------------
create table public.email_logs (
  id                 bigint generated always as identity primary key,
  order_number       text not null,
  recipient_email    text not null,
  subject            text not null,
  email_type         text not null
                     check (email_type in ('order_confirmation', 'status_update', 'admin_dispatch', 'newsletter_welcome')),
  provider           text not null default 'resend',
  resend_message_id  text,
  delivery_status    text not null check (delivery_status in ('sent', 'simulated_no_api_key', 'failed')),
  created_at         timestamptz not null default now()
);

create index email_logs_created_at_idx on public.email_logs (created_at desc);
create index email_logs_order_type_idx on public.email_logs (order_number, email_type);

create table public.newsletter_leads (
  email         text primary key check (email = lower(email)),
  name          text,
  discount_code text not null,
  created_at    timestamptz not null default now()
);

alter table public.email_logs        enable row level security;
alter table public.newsletter_leads  enable row level security;

create policy "email_logs: admin read" on public.email_logs for select using (public.is_admin());
create policy "newsletter_leads: admin read" on public.newsletter_leads for select using (public.is_admin());

-- Defense in depth: the anonymous role has no business touching private tables.
revoke all on table public.profiles, public.orders, public.order_items,
                    public.email_logs, public.newsletter_leads from anon;

-- ---------------------------------------------------------------------
-- place_order(): the ONLY way to create an order.
--   * works for guests and signed-in customers
--   * ignores any price the browser sends; totals come from public.products
--   * generates the order number
-- ---------------------------------------------------------------------
create or replace function public.place_order(p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_free_shipping_threshold constant numeric := 350;
  c_standard_shipping       constant numeric := 25;

  v_name     text := btrim(coalesce(p_order ->> 'customerName', ''));
  v_email    text := lower(btrim(coalesce(p_order ->> 'customerEmail', '')));
  v_phone    text := btrim(coalesce(p_order ->> 'customerPhone', ''));
  v_emirate  text := btrim(coalesce(p_order ->> 'emirate', ''));
  v_address  text := btrim(coalesce(p_order ->> 'deliveryAddress', ''));
  v_payment  text := coalesce(p_order ->> 'paymentMethod', '');
  v_timeline jsonb := coalesce(p_order -> 'timeline', '[]'::jsonb);

  v_item      jsonb;
  v_product   public.products%rowtype;
  v_pack_id   text;
  v_units     integer;
  v_discount  numeric;
  v_pack_lbl  text;
  v_qty       integer;
  v_unit      numeric(10, 2);
  v_subtotal  numeric(10, 2) := 0;
  v_shipping  numeric(10, 2);
  v_total     numeric(10, 2);
  v_lines     jsonb := '[]'::jsonb;
  v_attempt   integer := 0;
  v_row       public.orders%rowtype;
begin
  if v_name = '' or length(v_name) > 120 then
    raise exception 'invalid_order: name is required (max 120 characters)' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email) > 254 then
    raise exception 'invalid_order: a valid email address is required' using errcode = '22023';
  end if;
  if v_phone = '' or length(v_phone) > 30 then
    raise exception 'invalid_order: phone number is required' using errcode = '22023';
  end if;
  if v_emirate = '' or length(v_emirate) > 40 then
    raise exception 'invalid_order: emirate is required' using errcode = '22023';
  end if;
  if v_address = '' or length(v_address) > 500 then
    raise exception 'invalid_order: delivery address is required (max 500 characters)' using errcode = '22023';
  end if;
  if v_payment not in ('Cash on Delivery', 'Card Link on Delivery') then
    raise exception 'invalid_order: unsupported payment method' using errcode = '22023';
  end if;
  if jsonb_typeof(p_order -> 'items') is distinct from 'array'
     or jsonb_array_length(p_order -> 'items') not between 1 and 50 then
    raise exception 'invalid_order: cart must contain 1-50 line items' using errcode = '22023';
  end if;
  if jsonb_typeof(v_timeline) is distinct from 'array' or jsonb_array_length(v_timeline) > 20 then
    v_timeline := '[]'::jsonb;
  end if;

  for v_item in select value from jsonb_array_elements(p_order -> 'items') loop
    select * into v_product from public.products where slug = v_item ->> 'productId';
    if not found then
      raise exception 'invalid_order: unknown product %', left(coalesce(v_item ->> 'productId', ''), 60)
        using errcode = '22023';
    end if;
    if not v_product.in_stock then
      raise exception 'invalid_order: % is out of stock', v_product.title using errcode = '22023';
    end if;

    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty not between 1 and 20 then
      raise exception 'invalid_order: quantity must be between 1 and 20' using errcode = '22023';
    end if;

    v_pack_id := coalesce(v_item ->> 'packId', 'single');
    if v_pack_id = 'single' then
      v_units := 1; v_discount := 0;  v_pack_lbl := 'Single Unit (1x)';
    elsif v_pack_id = 'pack3' then
      v_units := 3; v_discount := 10; v_pack_lbl := '3-Pack Bundle (Save 10%)';
    elsif v_pack_id = 'pack5' then
      v_units := 5; v_discount := 15; v_pack_lbl := '5-Pack Box (Save 15%)';
    else
      raise exception 'invalid_order: unknown pack option' using errcode = '22023';
    end if;

    v_unit := round(v_product.price_aed * v_units * (1 - v_discount / 100), 2);
    v_subtotal := v_subtotal + v_unit * v_qty;

    v_lines := v_lines || jsonb_build_object(
      'productId', v_product.slug,
      'title',     v_product.title,
      'flavor',    left(coalesce(nullif(v_item ->> 'flavor', ''), v_product.flavor_profile), 120),
      'nicotine',  left(coalesce(nullif(v_item ->> 'nicotine', ''), v_product.nicotine_strength), 60),
      'packId',    v_pack_id,
      'packLabel', v_pack_lbl,
      'quantity',  v_qty,
      'unitPrice', v_unit
    );
  end loop;

  v_shipping := case when v_subtotal >= c_free_shipping_threshold then 0 else c_standard_shipping end;
  v_total := v_subtotal + v_shipping;

  -- Generate a unique order number (retry on the rare collision).
  loop
    begin
      insert into public.orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        emirate, delivery_address, payment_method,
        subtotal_aed, shipping_fee_aed, total_aed, items, timeline
      ) values (
        'VDK-' || lpad((floor(random() * 900000) + 100000)::integer::text, 6, '0'),
        (select auth.uid()), v_name, v_email, v_phone,
        v_emirate, v_address, v_payment,
        v_subtotal, v_shipping, v_total, v_lines, v_timeline
      )
      returning * into v_row;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 8 then raise; end if;
    end;
  end loop;

  insert into public.order_items (
    order_id, product_slug, product_title, selected_flavor, selected_nicotine,
    pack_label, quantity, unit_price_aed
  )
  select v_row.id, l."productId", l.title, l.flavor, l.nicotine, l."packLabel", l.quantity, l."unitPrice"
  from jsonb_to_recordset(v_lines) as l(
    "productId" text, title text, flavor text, nicotine text,
    "packLabel" text, quantity integer, "unitPrice" numeric
  );

  return jsonb_build_object(
    'order_number', v_row.order_number,
    'status',       v_row.status,
    'courier_name', v_row.courier_name,
    'estimated_arrival', v_row.estimated_arrival,
    'subtotal',     v_row.subtotal_aed,
    'shipping_fee', v_row.shipping_fee_aed,
    'total',        v_row.total_aed,
    'created_at',   v_row.created_at,
    'items',        v_lines
  );
end;
$$;

-- ---------------------------------------------------------------------
-- track_orders(): lets guests refresh the status of orders they placed.
-- A lookup only matches when BOTH the order number and the email match,
-- so nobody can list orders by guessing or knowing just one of them.
-- ---------------------------------------------------------------------
create or replace function public.track_orders(p_lookups jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(o) - 'id' - 'user_id' order by o.created_at desc), '[]'::jsonb)
  from public.orders o
  join jsonb_to_recordset(
    case when jsonb_typeof(p_lookups) = 'array' and jsonb_array_length(p_lookups) <= 20
         then p_lookups else '[]'::jsonb end
  ) as l(order_number text, email text)
    on o.order_number = l.order_number
   and lower(o.customer_email) = lower(l.email);
$$;

revoke all on function public.place_order(jsonb)  from public;
revoke all on function public.track_orders(jsonb) from public;
grant execute on function public.place_order(jsonb)  to anon, authenticated;
grant execute on function public.track_orders(jsonb) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
