/**
 * Pure mapping helpers between Supabase rows (snake_case) and the app's types.
 * No network or Supabase imports here so they are easy to unit test.
 */
import {
  AuthenticatedUser,
  CartItem,
  CustomerOrder,
  EmailLogRecord,
  OrderStatusStage,
  PackTierId,
  Product,
  ProductCategory,
} from '../types/store';
import { buildOrderTimeline, calculateVariantPrice } from './storeLogic';

// ---------------------------------------------------------------- products
export interface ProductRow {
  slug: string;
  title: string;
  brand: string;
  category: string;
  price_aed: number | string;
  original_price_aed: number | string | null;
  puff_count: string | null;
  nicotine_strength: string;
  flavor_profile: string;
  image: string;
  stock_count: number;
  in_stock: boolean;
  is_offer: boolean;
  description: string;
  flavors: string[];
  nicotine_options: string[];
  specs: Product['specs'];
  details: {
    gallery?: string[];
    longDescription?: string[];
    highlights?: string[];
    tastingNotes?: Product['tastingNotes'] | null;
    boxContents?: string[];
  } | null;
}

const nonEmpty = <T,>(arr: T[] | undefined | null): T[] | undefined =>
  Array.isArray(arr) && arr.length > 0 ? arr : undefined;

export function mapProductRow(row: ProductRow): Product {
  const details = row.details ?? {};
  return {
    id: row.slug,
    title: row.title,
    brand: row.brand,
    category: row.category as ProductCategory,
    price: Number(row.price_aed),
    originalPrice: row.original_price_aed != null ? Number(row.original_price_aed) : undefined,
    puffCount: row.puff_count ?? undefined,
    nicotineStrength: row.nicotine_strength,
    flavorProfile: row.flavor_profile,
    image: row.image,
    gallery: nonEmpty(details.gallery),
    isOffer: row.is_offer,
    inStock: row.in_stock,
    stockCount: row.stock_count,
    variants: {
      flavors: Array.isArray(row.flavors) ? row.flavors : [],
      nicotineOptions: Array.isArray(row.nicotine_options) ? row.nicotine_options : [],
    },
    specs: row.specs ?? { battery: '', capacity: '', display: '' },
    description: row.description,
    longDescription: nonEmpty(details.longDescription),
    highlights: nonEmpty(details.highlights),
    tastingNotes: details.tastingNotes ?? undefined,
    boxContents: nonEmpty(details.boxContents),
  };
}

export function productToRow(p: Product): ProductRow {
  return {
    slug: p.id,
    title: p.title,
    brand: p.brand,
    category: p.category,
    price_aed: p.price,
    original_price_aed: p.originalPrice ?? null,
    puff_count: p.puffCount ?? null,
    nicotine_strength: p.nicotineStrength,
    flavor_profile: p.flavorProfile,
    image: p.image,
    stock_count: Math.max(0, Math.floor(p.stockCount ?? 0)),
    in_stock: p.inStock,
    is_offer: Boolean(p.isOffer),
    description: p.description,
    flavors: p.variants.flavors,
    nicotine_options: p.variants.nicotineOptions,
    specs: p.specs,
    details: {
      gallery: p.gallery ?? [],
      longDescription: p.longDescription ?? [],
      highlights: p.highlights ?? [],
      tastingNotes: p.tastingNotes ?? null,
      boxContents: p.boxContents ?? [],
    },
  };
}

// ------------------------------------------------------------------ orders
export interface OrderRow {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  emirate: string;
  delivery_address: string;
  payment_method: string;
  status: string;
  courier_name: string;
  estimated_arrival: string;
  subtotal_aed: number | string;
  shipping_fee_aed: number | string;
  total_aed: number | string;
  items: StoredOrderItem[] | null;
  created_at: string;
}

export interface StoredOrderItem {
  productId: string;
  title: string;
  flavor: string;
  nicotine: string;
  packId: PackTierId;
  packLabel: string;
  quantity: number;
  unitPrice: number;
}

const STAGES: OrderStatusStage[] = [
  'order_placed',
  'age_verified',
  'packed_al_quoz',
  'out_for_delivery',
  'delivered',
];

function stubProduct(item: StoredOrderItem, fallbackImage: string): Product {
  return {
    id: item.productId,
    title: item.title,
    brand: '',
    category: 'Disposable Vape',
    price: Number(item.unitPrice),
    nicotineStrength: item.nicotine,
    flavorProfile: item.flavor,
    image: fallbackImage,
    inStock: true,
    variants: { flavors: [item.flavor], nicotineOptions: [item.nicotine] },
    specs: { battery: '', capacity: '', display: '' },
    description: '',
  };
}

export function mapOrderRow(row: OrderRow, catalog: Product[]): CustomerOrder {
  const status = (STAGES.includes(row.status as OrderStatusStage)
    ? row.status
    : 'order_placed') as OrderStatusStage;
  const fallbackImage = catalog[0]?.image ?? '';

  const items: CartItem[] = (Array.isArray(row.items) ? row.items : []).map((it, idx) => ({
    cartItemId: `${row.order_number}-${idx}`,
    product: catalog.find((p) => p.id === it.productId) ?? stubProduct(it, fallbackImage),
    quantity: Number(it.quantity),
    selectedVariant: {
      flavor: it.flavor,
      nicotine: it.nicotine,
      packId: it.packId,
      packLabel: it.packLabel,
      unitPrice: Number(it.unitPrice),
    },
  }));

  return {
    orderId: row.order_number,
    fullName: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
    emirate: row.emirate,
    address: row.delivery_address,
    paymentMethod: row.payment_method as CustomerOrder['paymentMethod'],
    items,
    subtotal: Number(row.subtotal_aed),
    shippingFee: Number(row.shipping_fee_aed),
    total: Number(row.total_aed),
    createdAt: new Date(row.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    status,
    courierName: row.courier_name,
    estimatedArrival: row.estimated_arrival,
    timeline: buildOrderTimeline(status),
  };
}

export interface PlaceOrderInput {
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  address: string;
  paymentMethod: CustomerOrder['paymentMethod'];
  items: CartItem[];
}

/** Builds the argument for the place_order() database function. Never sends prices. */
export function buildPlaceOrderPayload(input: PlaceOrderInput) {
  return {
    customerName: input.fullName,
    customerEmail: input.email,
    customerPhone: input.phone,
    emirate: input.emirate,
    deliveryAddress: input.address,
    paymentMethod: input.paymentMethod,
    timeline: buildOrderTimeline('order_placed'),
    items: input.items.map((i) => ({
      productId: i.product.id,
      flavor: i.selectedVariant?.flavor || i.product.flavorProfile,
      nicotine: i.selectedVariant?.nicotine || i.product.nicotineStrength,
      packId: i.selectedVariant?.packId ?? 'single',
      quantity: i.quantity,
    })),
  };
}

// -------------------------------------------------------------- email logs
export interface EmailLogRow {
  id: number;
  order_number: string;
  recipient_email: string;
  subject: string;
  email_type: EmailLogRecord['emailType'];
  provider: string;
  resend_message_id: string | null;
  delivery_status: EmailLogRecord['deliveryStatus'];
  created_at: string;
}

export function mapEmailLogRow(row: EmailLogRow): EmailLogRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    emailType: row.email_type,
    provider: row.provider,
    resendMessageId: row.resend_message_id,
    deliveryStatus: row.delivery_status,
    createdAt: new Date(row.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

// ---------------------------------------------------------------- profiles
export interface ProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  emirate: string | null;
  role: string;
}

export function mapProfileToUser(
  profile: ProfileRow | null,
  authUser: { id: string; email?: string | null }
): AuthenticatedUser {
  const email = profile?.email || authUser.email || '';
  return {
    uid: authUser.id,
    email,
    displayName: profile?.display_name || email.split('@')[0] || 'Customer',
    phone: profile?.phone ?? '',
    emirate: profile?.emirate ?? 'Dubai',
    role: profile?.role === 'admin' ? 'admin' : 'customer',
  };
}

// -------------------------------------------------------------------- cart
/**
 * After the live catalog loads, point cart lines at the current product data
 * (so prices match what the database will charge) and drop products that no
 * longer exist.
 */
export function reconcileCartWithCatalog(items: CartItem[], catalog: Product[]): CartItem[] {
  const next: CartItem[] = [];
  for (const line of items) {
    const live = catalog.find((p) => p.id === line.product.id);
    if (!live) continue;
    next.push({
      ...line,
      product: live,
      selectedVariant: line.selectedVariant
        ? {
            ...line.selectedVariant,
            unitPrice: calculateVariantPrice(live.price, line.selectedVariant.packId),
          }
        : line.selectedVariant,
    });
  }
  return next;
}
