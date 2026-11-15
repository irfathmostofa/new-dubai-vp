export type ProductCategory =
  | 'Disposable Vape'
  | 'Pods System'
  | 'E-Liquid'
  | 'Vape Kit'
  | 'Brands'
  | 'Offers';

export type PackTierId = 'single' | 'pack3' | 'pack5';

export interface PackOption {
  id: PackTierId;
  label: string;
  units: number;
  discountPercent: number;
  badge?: string;
}

export interface ProductTastingNotes {
  inhale: string;
  body: string;
  finish: string;
  iceLevel: string;
  sweetnessLevel: string;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  puffCount?: string;
  nicotineStrength: string;
  flavorProfile: string;
  image: string;
  gallery?: string[];
  isOffer?: boolean;
  inStock: boolean;
  stockCount?: number;
  variants: {
    flavors: string[];
    nicotineOptions: string[];
  };
  specs: {
    battery: string;
    capacity: string;
    display: string;
    coil?: string;
  };
  description: string;
  longDescription?: string[];
  highlights?: string[];
  tastingNotes?: ProductTastingNotes;
  boxContents?: string[];
}

export interface PopularCategoryCardItem {
  id: string;
  category: ProductCategory;
  title: string;
  subtitle: string;
  badge: string;
  startingPrice: number;
  itemCountLabel: string;
  image: string;
  featuredBrands: string[];
  accentTheme: 'dark' | 'light';
}

export interface SelectedVariant {
  flavor: string;
  nicotine: string;
  packId: PackTierId;
  packLabel: string;
  unitPrice: number;
}

export interface CartItem {
  cartItemId?: string;
  product: Product;
  quantity: number;
  selectedVariant?: SelectedVariant;
}

export type OrderStatusStage =
  | 'order_placed'
  | 'age_verified'
  | 'packed_al_quoz'
  | 'out_for_delivery'
  | 'delivered';

export interface OrderTimelineStep {
  status: OrderStatusStage;
  label: string;
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface CustomerOrder {
  orderId: string;
  fullName: string;
  email?: string;
  phone: string;
  emirate: string;
  address: string;
  paymentMethod: 'Cash on Delivery' | 'Card Link on Delivery';
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  status: OrderStatusStage;
  courierName: string;
  estimatedArrival: string;
  timeline: OrderTimelineStep[];
}

export interface EmailLogRecord {
  id: number | string;
  orderNumber: string;
  recipientEmail: string;
  subject: string;
  emailType: 'order_confirmation' | 'status_update' | 'admin_dispatch' | 'newsletter_welcome';
  provider: string;
  resendMessageId?: string | null;
  deliveryStatus: 'sent' | 'simulated_no_api_key' | 'failed';
  createdAt: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  emirate?: string;
  role: 'admin' | 'customer';
}

export interface MegaMenuSubItem {
  label: string;
  description: string;
  filterBrand?: string;
  filterQuery?: string;
}
