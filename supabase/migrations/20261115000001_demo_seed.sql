-- =====================================================================
-- Vape Dubai King: Demo Seed Migration Schema
-- Seeds sample UAE Cash-on-Delivery orders, line items, transactional
-- email audit logs, and VIP newsletter leads so a freshly provisioned
-- Supabase project immediately has realistic customer order tracking
-- and admin operations telemetry.
-- =====================================================================

-- Allow authenticated customers to read orders that match their verified
-- account email address (in addition to user_id), so guest or demo orders
-- placed under their email automatically appear in their account history
-- after login.
drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin"
  on public.orders for select
  using (
    user_id = (select auth.uid())
    or lower(customer_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    or public.is_admin()
  );

drop policy if exists "order_items: read own or admin" on public.order_items;
create policy "order_items: read own or admin"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.user_id = (select auth.uid())
          or lower(o.customer_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
        )
    )
  );

-- Seed 3 realistic UAE customer orders (safe to re-run via ON CONFLICT)
insert into public.orders (
  order_number,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  emirate,
  delivery_address,
  payment_method,
  status,
  courier_name,
  estimated_arrival,
  subtotal_aed,
  shipping_fee_aed,
  total_aed,
  items,
  timeline
) values
(
  'VDK-892410',
  null,
  'Tariq Al Maktoum',
  'tariq.almaktoum@dubai.ae',
  '+971 50 842 9910',
  'Dubai',
  'Boulevard Point Tower, Apt 3402, Downtown Dubai',
  'Cash on Delivery',
  'packed_al_quoz',
  'Rashid Al-Mansoor · Dubai Express Bike #14',
  '35 mins (Sheikh Zayed Rd Route)',
  145.00,
  25.00,
  170.00,
  '[{"productId":"elf-bar-10000-puffs","title":"Elf Bar 10000 Puffs Digital Display — Blue Razz Ice","flavor":"Chilled Blue Raspberry","nicotine":"50mg (5%)","packId":"single","packLabel":"Single Unit (1x)","quantity":2,"unitPrice":40.00},{"productId":"pod-salt-35k-puffs","title":"Pod Salt 35K Puffs Smart Screen — Double Apple Shisha","flavor":"Authentic Two Apple Molasses","nicotine":"20mg (2%)","packId":"single","packLabel":"Single Unit (1x)","quantity":1,"unitPrice":65.00}]'::jsonb,
  '[{"status":"order_placed","label":"Order Confirmed & Logged","location":"Vape Dubai King Online Dispatch Desk","description":"Order received and assigned to same-day UAE fulfillment queue.","timestamp":"14:10 GST","completed":true,"current":false},{"status":"age_verified","label":"21+ Adult ID & ESMA Excise Verified","location":"Dubai Compliance & Tax Stamp Unit","description":"All hardware QR codes and UAE Federal Tax Authority stamps verified.","timestamp":"14:18 GST","completed":true,"current":false},{"status":"packed_al_quoz","label":"Thermal-Sealed & Dispatched","location":"Al Quoz Industrial Area 3 Hub, Dubai","description":"Insulated climate-protected pouch handed over to express bike courier.","timestamp":"14:35 GST","completed":true,"current":true},{"status":"out_for_delivery","label":"Courier En Route (Live GPS Telemetry)","location":"Sheikh Zayed Rd → Customer Emirate","description":"Rider is approaching your building with Cash & Card Link terminal.","timestamp":"Est. 14:52 GST","completed":false,"current":false},{"status":"delivered","label":"Delivered & Settled at Doorstep","location":"Customer Destination","description":"Handover complete with 21+ verification and doorstep payment.","timestamp":"Est. 15:20 GST","completed":false,"current":false}]'::jsonb
),
(
  'VDK-891855',
  null,
  'Tariq Al Maktoum',
  'tariq.almaktoum@dubai.ae',
  '+971 50 842 9910',
  'Dubai',
  'Marina Gate Tower 1, Apt 1904, Dubai Marina',
  'Card Link on Delivery',
  'out_for_delivery',
  'Zayed Al-Nuaimi · Marina Dispatch Van #07',
  '15 mins (Jumeirah Beach Rd)',
  280.00,
  25.00,
  305.00,
  '[{"productId":"juul-2-starter-kit","title":"Juul 2 Starter Kit — Slate Grey Device + 2 Virginia & Menthol Pods","flavor":"Virginia Tobacco & Crisp Menthol","nicotine":"18mg/ml Official UAE Spec","packId":"single","packLabel":"Single Unit (1x)","quantity":1,"unitPrice":135.00},{"productId":"vaporesso-xros-4-pro-kit","title":"Vaporesso XROS 4 Pro Vape Kit — Brushed Titanium Alloy","flavor":"Brushed Titanium Alloy","nicotine":"0.4Ω + 0.8Ω COREX 2.0 Mesh","packId":"single","packLabel":"Single Unit (1x)","quantity":1,"unitPrice":145.00}]'::jsonb,
  '[{"status":"order_placed","label":"Order Confirmed & Logged","location":"Vape Dubai King Online Dispatch Desk","description":"Order received and assigned to same-day UAE fulfillment queue.","timestamp":"11:45 GST","completed":true,"current":false},{"status":"age_verified","label":"21+ Adult ID & ESMA Excise Verified","location":"Dubai Compliance & Tax Stamp Unit","description":"All hardware QR codes and UAE Federal Tax Authority stamps verified.","timestamp":"11:55 GST","completed":true,"current":false},{"status":"packed_al_quoz","label":"Thermal-Sealed & Dispatched","location":"Al Quoz Industrial Area 3 Hub, Dubai","description":"Insulated climate-protected pouch handed over to express bike courier.","timestamp":"12:15 GST","completed":true,"current":false},{"status":"out_for_delivery","label":"Courier En Route (Live GPS Telemetry)","location":"Sheikh Zayed Rd → Customer Emirate","description":"Rider is approaching your building with Cash & Card Link terminal.","timestamp":"12:40 GST","completed":true,"current":true},{"status":"delivered","label":"Delivered & Settled at Doorstep","location":"Customer Destination","description":"Handover complete with 21+ verification and doorstep payment.","timestamp":"Est. 13:05 GST","completed":false,"current":false}]'::jsonb
),
(
  'VDK-889302',
  null,
  'Tariq Al Maktoum',
  'tariq.almaktoum@dubai.ae',
  '+971 50 842 9910',
  'Dubai',
  'Executive Towers East, Business Bay, Dubai',
  'Cash on Delivery',
  'delivered',
  'Hamdan Courier · Business Bay Bike #03',
  'Delivered & COD Verified',
  102.60,
  25.00,
  127.60,
  '[{"productId":"tugboat-super-12000-puffs","title":"Tugboat Super 12000 Puffs Digital — Mango Passionfruit Freeze","flavor":"Alphonso Mango & Passionfruit Ice","nicotine":"50mg (5%)","packId":"pack3","packLabel":"3-Pack Bundle (Save 10%)","quantity":1,"unitPrice":102.60}]'::jsonb,
  '[{"status":"order_placed","label":"Order Confirmed & Logged","location":"Vape Dubai King Online Dispatch Desk","description":"Order received and assigned to same-day UAE fulfillment queue.","timestamp":"14:10 GST","completed":true,"current":false},{"status":"age_verified","label":"21+ Adult ID & ESMA Excise Verified","location":"Dubai Compliance & Tax Stamp Unit","description":"All hardware QR codes and UAE Federal Tax Authority stamps verified.","timestamp":"14:18 GST","completed":true,"current":false},{"status":"packed_al_quoz","label":"Thermal-Sealed & Dispatched","location":"Al Quoz Industrial Area 3 Hub, Dubai","description":"Insulated climate-protected pouch handed over to express bike courier.","timestamp":"14:35 GST","completed":true,"current":false},{"status":"out_for_delivery","label":"Courier En Route (Live GPS Telemetry)","location":"Sheikh Zayed Rd → Customer Emirate","description":"Rider is approaching your building with Cash & Card Link terminal.","timestamp":"14:52 GST","completed":true,"current":false},{"status":"delivered","label":"Delivered & Settled at Doorstep","location":"Customer Destination","description":"Handover complete with 21+ verification and doorstep payment.","timestamp":"15:20 GST","completed":true,"current":true}]'::jsonb
)
on conflict (order_number) do update set
  status = excluded.status,
  courier_name = excluded.courier_name,
  estimated_arrival = excluded.estimated_arrival,
  items = excluded.items,
  timeline = excluded.timeline;

-- Normalized order_items for the 3 demo orders
delete from public.order_items
where order_id in (
  select id from public.orders where order_number in ('VDK-892410', 'VDK-891855', 'VDK-889302')
);

insert into public.order_items (
  order_id,
  product_slug,
  product_title,
  selected_flavor,
  selected_nicotine,
  pack_label,
  quantity,
  unit_price_aed
)
select
  o.id,
  item ->> 'productId',
  item ->> 'title',
  item ->> 'flavor',
  item ->> 'nicotine',
  item ->> 'packLabel',
  (item ->> 'quantity')::integer,
  (item ->> 'unitPrice')::numeric
from public.orders o
cross join lateral jsonb_array_elements(o.items) as item
where o.order_number in ('VDK-892410', 'VDK-891855', 'VDK-889302');

-- Demo transactional email audit logs
insert into public.email_logs (
  order_number,
  recipient_email,
  subject,
  email_type,
  provider,
  resend_message_id,
  delivery_status
)
select * from (values
  ('VDK-892410', 'tariq.almaktoum@dubai.ae', 'Order #VDK-892410 Confirmed — Same-Day Dubai Dispatch', 'order_confirmation', 'resend', 're_dubai_892410_conf', 'sent'),
  ('VDK-892410', 'tariq.almaktoum@dubai.ae', 'Order #VDK-892410 Packed at Al Quoz Hub — Bike #14 Assigned', 'status_update', 'resend', 're_dubai_892410_pack', 'sent'),
  ('VDK-891855', 'tariq.almaktoum@dubai.ae', 'Courier En Route: Order #VDK-891855 (ETA 15 mins to Dubai Marina)', 'status_update', 'resend', 're_dubai_891855_gps', 'sent'),
  ('VDK-889302', 'tariq.almaktoum@dubai.ae', 'Delivered & COD Settled: Order #VDK-889302 in Business Bay', 'status_update', 'resend', 're_dubai_889302_dlv', 'sent')
) as v(order_number, recipient_email, subject, email_type, provider, resend_message_id, delivery_status)
where not exists (
  select 1 from public.email_logs e where e.resend_message_id = v.resend_message_id
);

-- Demo VIP newsletter leads
insert into public.newsletter_leads (email, name, discount_code) values
  ('tariq.almaktoum@dubai.ae', 'Tariq Al Maktoum', 'DUBAIKING15'),
  ('layla.alnahyan@abudhabi.ae', 'Layla Al Nahyan', 'DUBAIKING15')
on conflict (email) do nothing;
