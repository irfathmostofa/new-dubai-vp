import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlaceOrderPayload,
  mapEmailLogRow,
  mapOrderRow,
  mapProductRow,
  mapProfileToUser,
  productToRow,
  reconcileCartWithCatalog,
  OrderRow,
} from './backendMappers.ts';
import { MOCK_PRODUCTS } from '../data/products.ts';
import { CartItem } from '../types/store.ts';

test('every built-in product survives a Product -> DB row -> Product round trip', () => {
  for (const product of MOCK_PRODUCTS) {
    const row = productToRow(product);
    const back = mapProductRow({ ...row, price_aed: String(row.price_aed) }); // numeric may arrive as string
    assert.equal(back.id, product.id);
    assert.equal(back.price, product.price);
    assert.equal(back.originalPrice, product.originalPrice);
    assert.deepEqual(back.variants, product.variants);
    assert.deepEqual(back.specs, product.specs);
    assert.deepEqual(back.longDescription, product.longDescription);
    assert.deepEqual(back.highlights, product.highlights);
    assert.deepEqual(back.tastingNotes, product.tastingNotes);
    assert.deepEqual(back.boxContents, product.boxContents);
    assert.equal(back.inStock, product.inStock);
  }
});

test('productToRow never produces negative or fractional stock', () => {
  const row = productToRow({ ...MOCK_PRODUCTS[0], stockCount: -5.7 });
  assert.equal(row.stock_count, 0);
  assert.equal(productToRow({ ...MOCK_PRODUCTS[0], stockCount: 12.9 }).stock_count, 12);
});

test('place_order payload carries NO prices (the database computes them)', () => {
  const p = MOCK_PRODUCTS[0];
  const items: CartItem[] = [
    {
      product: p,
      quantity: 2,
      selectedVariant: { flavor: 'Mint', nicotine: '50mg', packId: 'pack3', packLabel: 'x', unitPrice: 0.01 },
    },
    { product: MOCK_PRODUCTS[1], quantity: 1 },
  ];
  const payload = buildPlaceOrderPayload({
    fullName: 'T', email: 't@x.com', phone: '1', emirate: 'Dubai', address: 'a',
    paymentMethod: 'Cash on Delivery', items,
  });
  const text = JSON.stringify(payload);
  assert.ok(!/price|total|subtotal|shipping/i.test(text), 'payload must not include any price field');
  assert.deepEqual(payload.items[0], { productId: p.id, flavor: 'Mint', nicotine: '50mg', packId: 'pack3', quantity: 2 });
  assert.equal(payload.items[1].packId, 'single');
  assert.equal(payload.items[1].flavor, MOCK_PRODUCTS[1].flavorProfile);
});

const orderRow: OrderRow = {
  order_number: 'VDK-123456',
  customer_name: 'Tariq', customer_email: 't@x.com', customer_phone: '+971500000000',
  emirate: 'Dubai', delivery_address: 'Tower 1', payment_method: 'Cash on Delivery',
  status: 'out_for_delivery', courier_name: 'Bike 14', estimated_arrival: '30 mins',
  subtotal_aed: '216.00', shipping_fee_aed: '25.00', total_aed: '241.00',
  created_at: '2026-11-15T10:00:00Z',
  items: [{ productId: MOCK_PRODUCTS[0].id, title: 'T', flavor: 'Mint', nicotine: '50mg', packId: 'pack3', packLabel: '3-Pack', quantity: 2, unitPrice: 108 }],
};

test('mapOrderRow converts numerics, links products, and builds the timeline', () => {
  const o = mapOrderRow(orderRow, MOCK_PRODUCTS);
  assert.equal(o.orderId, 'VDK-123456');
  assert.equal(o.total, 241);
  assert.equal(o.items[0].product.id, MOCK_PRODUCTS[0].id);
  assert.equal(o.items[0].selectedVariant?.unitPrice, 108);
  assert.equal(o.timeline.find((t) => t.current)?.status, 'out_for_delivery');
});

test('mapOrderRow tolerates deleted products, bad status and null items', () => {
  const o = mapOrderRow({ ...orderRow, status: 'weird', items: [{ ...orderRow.items![0], productId: 'gone' }] }, MOCK_PRODUCTS);
  assert.equal(o.status, 'order_placed');
  assert.equal(o.items[0].product.id, 'gone');
  assert.equal(mapOrderRow({ ...orderRow, items: null }, MOCK_PRODUCTS).items.length, 0);
});

test('mapProfileToUser: only role "admin" from the database grants admin', () => {
  const base = { id: 'u1', email: 'a@x.com', display_name: 'A', phone: null, emirate: null };
  assert.equal(mapProfileToUser({ ...base, role: 'admin' }, { id: 'u1' }).role, 'admin');
  assert.equal(mapProfileToUser({ ...base, role: 'customer' }, { id: 'u1' }).role, 'customer');
  assert.equal(mapProfileToUser({ ...base, role: 'ADMIN' }, { id: 'u1' }).role, 'customer');
  assert.equal(mapProfileToUser(null, { id: 'u1', email: 'who@x.com' }).role, 'customer');
  assert.equal(mapProfileToUser(null, { id: 'u1', email: 'who@x.com' }).displayName, 'who');
});

test('mapEmailLogRow maps snake_case to the app shape', () => {
  const l = mapEmailLogRow({
    id: 1, order_number: 'VDK-1', recipient_email: 'a@x.com', subject: 's', email_type: 'status_update',
    provider: 'resend', resend_message_id: 'm', delivery_status: 'sent', created_at: '2026-11-15T10:00:00Z',
  });
  assert.equal(l.orderNumber, 'VDK-1');
  assert.equal(l.deliveryStatus, 'sent');
});

test('reconcileCartWithCatalog refreshes prices and drops removed products', () => {
  const p = MOCK_PRODUCTS[0];
  const cart: CartItem[] = [
    { product: p, quantity: 1, selectedVariant: { flavor: 'a', nicotine: 'b', packId: 'pack3', packLabel: 'x', unitPrice: 1 } },
    { product: { ...MOCK_PRODUCTS[1], id: 'deleted-product' }, quantity: 1 },
  ];
  const live = [{ ...p, price: 50 }];
  const out = reconcileCartWithCatalog(cart, live);
  assert.equal(out.length, 1);
  assert.equal(out[0].product.price, 50);
  assert.equal(out[0].selectedVariant?.unitPrice, 135); // 50 x 3 units, 10% off
});
