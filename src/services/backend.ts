/**
 * All Supabase network calls live here so the store stays readable.
 * Security is enforced by Postgres Row Level Security + the database
 * functions in supabase/migrations, never by this client code.
 */
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  buildPlaceOrderPayload,
  EmailLogRow,
  mapEmailLogRow,
  mapOrderRow,
  mapProductRow,
  mapProfileToUser,
  OrderRow,
  PlaceOrderInput,
  ProductRow,
  productToRow,
  ProfileRow,
} from '../utils/backendMappers';
import { AuthenticatedUser, CustomerOrder, EmailLogRecord, OrderStatusStage, Product } from '../types/store';
import { buildOrderTimeline } from '../utils/storeLogic';

const NOT_CONFIGURED = 'The store backend is not configured yet. Please try again later.';

function assertConfigured(): void {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);
}

// ------------------------------------------------------------------ catalog
export async function fetchCatalog(): Promise<Product[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Could not load products from Supabase:', error.message);
    return null;
  }
  return (data as ProductRow[]).map(mapProductRow);
}

export async function upsertProduct(product: Product): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('products').upsert(productToRow(product), { onConflict: 'slug' });
  if (error) throw new Error(error.message);
}

export async function deleteProduct(slug: string): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('products').delete().eq('slug', slug);
  if (error) throw new Error(error.message);
}

// --------------------------------------------------------------------- auth
export async function fetchProfile(authUser: {
  id: string;
  email?: string | null;
}): Promise<AuthenticatedUser> {
  const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  return mapProfileToUser((data as ProfileRow | null) ?? null, authUser);
}

export async function updateOwnProfile(
  userId: string,
  fields: { display_name?: string; phone?: string; emirate?: string }
): Promise<void> {
  assertConfigured();
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------- orders
export interface PlacedOrderResult {
  orderNumber: string;
  courierName: string;
  estimatedArrival: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatusStage;
  items: Array<{
    productId: string;
    title: string;
    flavor: string;
    nicotine: string;
    packId: 'single' | 'pack3' | 'pack5';
    packLabel: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrderResult> {
  assertConfigured();
  const { data, error } = await supabase.rpc('place_order', {
    p_order: buildPlaceOrderPayload(input),
  });
  if (error) {
    // The database raises "invalid_order: <reason>" for anything it rejects.
    const reason = error.message.startsWith('invalid_order:')
      ? error.message.replace('invalid_order:', '').trim()
      : 'We could not place your order. Please try again.';
    throw new Error(reason);
  }
  return {
    orderNumber: data.order_number,
    courierName: data.courier_name,
    estimatedArrival: data.estimated_arrival,
    subtotal: Number(data.subtotal),
    shippingFee: Number(data.shipping_fee),
    total: Number(data.total),
    status: data.status,
    items: data.items,
  };
}

/** Orders belonging to the signed-in customer (Row Level Security limits the rows). */
export async function fetchMyOrders(catalog: Product[], userId: string): Promise<CustomerOrder[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as OrderRow[]).map((row) => mapOrderRow(row, catalog));
}

/** Guest order refresh: a lookup only matches when order number AND email both match. */
export async function trackOrders(
  lookups: Array<{ order_number: string; email: string }>,
  catalog: Product[]
): Promise<CustomerOrder[]> {
  assertConfigured();
  if (lookups.length === 0) return [];
  const { data, error } = await supabase.rpc('track_orders', { p_lookups: lookups.slice(0, 20) });
  if (error) throw new Error(error.message);
  return ((data ?? []) as OrderRow[]).map((row) => mapOrderRow(row, catalog));
}

// -------------------------------------------------------------------- admin
export async function fetchAllOrders(catalog: Product[]): Promise<CustomerOrder[]> {
  assertConfigured();
  // Row Level Security returns every order only when the caller is an admin.
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as OrderRow[]).map((row) => mapOrderRow(row, catalog));
}

export async function fetchEmailLogs(): Promise<EmailLogRecord[]> {
  assertConfigured();
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as EmailLogRow[]).map(mapEmailLogRow);
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatusStage,
  courierName?: string,
  estimatedArrival?: string
): Promise<void> {
  assertConfigured();
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      timeline: buildOrderTimeline(status),
      ...(courierName ? { courier_name: courierName } : {}),
      ...(estimatedArrival ? { estimated_arrival: estimatedArrival } : {}),
    })
    .eq('order_number', orderNumber)
    .select('order_number');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('Order not found or you are not allowed to update it.');
}

// ------------------------------------------------------------------- emails
type EmailRequest =
  | { type: 'order_confirmation'; orderNumber: string; email: string }
  | { type: 'newsletter'; email: string; name?: string }
  | { type: 'status_update'; orderNumber: string }
  | {
      type: 'admin_dispatch';
      orderNumber: string;
      recipientEmail: string;
      customerName: string;
      statusLabel: string;
      totalAed: string;
      emirate: string;
    };

export async function sendEmail(
  request: EmailRequest
): Promise<{ emailLog?: EmailLogRecord; alreadySubscribed?: boolean; discountCode?: string }> {
  assertConfigured();
  const { data, error } = await supabase.functions.invoke('send-email', { body: request });
  if (error) {
    let message = error.message;
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return {
    emailLog: data?.emailLog
      ? {
          ...data.emailLog,
          createdAt: new Date(data.emailLog.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }
      : undefined,
    alreadySubscribed: data?.alreadySubscribed,
    discountCode: data?.discountCode,
  };
}
