// Supabase Edge Function: send-email
// Replaces the old Express `/api/admin/resend-email`, order-confirmation and
// newsletter endpoints. Sends via Resend and records every send in email_logs.
//
// Deploy:   supabase functions deploy send-email
// Secrets:  supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM_EMAIL="Vape Dubai King <orders@yourdomain.com>"
//
// Request body: { type: 'order_confirmation' | 'status_update' | 'admin_dispatch' | 'newsletter', ... }
//   order_confirmation  public   { orderNumber, email }   (must match the stored order)
//   newsletter          public   { email, name? }         (one welcome email per address)
//   status_update       admin    { orderNumber }          (recipient/status read from the order)
//   admin_dispatch      admin    { orderNumber, recipientEmail, customerName, statusLabel, totalAed, emirate }

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'Vape Dubai King <onboarding@resend.dev>';

const NEWSLETTER_DISCOUNT_CODE = 'DUBAIKING15';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const STATUS_LABELS: Record<string, string> = {
  order_placed: 'Order Confirmed & Logged',
  age_verified: '21+ Adult ID & ESMA Excise Verified',
  packed_al_quoz: 'Thermal-Sealed & Dispatched',
  out_for_delivery: 'Courier En Route',
  delivered: 'Delivered',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const escapeHtml = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatAed = (n: number | string) => `AED ${Number(n).toFixed(2)}`;

type DeliveryStatus = 'sent' | 'simulated_no_api_key' | 'failed';

async function deliver(to: string, subject: string, html: string): Promise<{
  deliveryStatus: DeliveryStatus;
  messageId: string | null;
}> {
  const hasKey = RESEND_API_KEY && !RESEND_API_KEY.startsWith('MY_') && RESEND_API_KEY !== 're_123456789_example';
  if (!hasKey) {
    return { deliveryStatus: 'simulated_no_api_key', messageId: `sim_${Date.now()}` };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.id) return { deliveryStatus: 'sent', messageId: data.id };
    console.warn('Resend rejected the email:', res.status, data);
    return { deliveryStatus: 'failed', messageId: null };
  } catch (err) {
    console.warn('Resend request failed:', err);
    return { deliveryStatus: 'failed', messageId: null };
  }
}

function orderEmailHtml(o: {
  orderNumber: string;
  customerName: string;
  statusLabel: string;
  totalAed: string;
  emirate: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #18181b; padding: 24px; background: #ffffff; color: #09090b;">
      <div style="border-bottom: 2px solid #09090b; padding-bottom: 12px; margin-bottom: 16px;">
        <strong style="font-size: 18px; letter-spacing: -0.02em;">VAPE DUBAI KING · UAE EXPRESS DISPATCH</strong>
      </div>
      <p style="font-size: 14px;">Marhaba <strong>${escapeHtml(o.customerName)}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5;">
        Your UAE order <strong>#${escapeHtml(o.orderNumber)}</strong> status is now:
        <span style="background: #09090b; color: #ffffff; padding: 3px 8px; font-weight: bold;">${escapeHtml(o.statusLabel)}</span>
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e4e4e7; color: #52525b;">Destination Emirate</td>
          <td style="padding: 8px; border: 1px solid #e4e4e7; font-weight: bold;">${escapeHtml(o.emirate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e4e4e7; color: #52525b;">Amount Due (Cash / Link on Delivery)</td>
          <td style="padding: 8px; border: 1px solid #e4e4e7; font-weight: bold;">${escapeHtml(o.totalAed)}</td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #71717a; margin-top: 20px;">
        ESMA UAE Standard Regulated Retailer · Strictly 21+ Adult Verification Upon Delivery.
      </p>
    </div>`;
}

function newsletterHtml(name: string) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #18181b; padding: 24px; background: #ffffff; color: #09090b;">
      <div style="border-bottom: 2px solid #09090b; padding-bottom: 12px; margin-bottom: 16px;">
        <strong style="font-size: 18px; letter-spacing: -0.02em;">VAPE DUBAI KING · VIP NEWSLETTER CLUB</strong>
      </div>
      <p style="font-size: 14px;">Marhaba <strong>${escapeHtml(name)}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5;">
        Welcome to the Vape Dubai King VIP Dispatch list. Use your exclusive voucher code below for <strong>15% OFF</strong> your next Cash on Delivery order across all 7 UAE Emirates:
      </p>
      <div style="margin: 20px 0; padding: 16px; background: #09090b; color: #ffffff; text-align: center; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 0.12em;">
        ${NEWSLETTER_DISCOUNT_CODE}
      </div>
      <p style="font-size: 12px; color: #71717a; margin-top: 20px;">
        ESMA UAE Standard Regulated Retailer · Strictly 21+ Adult Verification Mandatory.
      </p>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const isAdmin = async () => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;
    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await asCaller.rpc('is_admin');
    return !error && data === true;
  };

  const logEmail = async (entry: {
    orderNumber: string;
    recipient: string;
    subject: string;
    type: string;
    status: DeliveryStatus;
    messageId: string | null;
  }) => {
    const { data, error } = await service
      .from('email_logs')
      .insert({
        order_number: entry.orderNumber,
        recipient_email: entry.recipient,
        subject: entry.subject,
        email_type: entry.type,
        provider: 'resend',
        resend_message_id: entry.messageId,
        delivery_status: entry.status,
      })
      .select()
      .single();
    if (error) console.error('Failed to write email_logs:', error);
    return data;
  };

  const toLogShape = (row: any) =>
    row && {
      id: row.id,
      orderNumber: row.order_number,
      recipientEmail: row.recipient_email,
      subject: row.subject,
      emailType: row.email_type,
      provider: row.provider,
      resendMessageId: row.resend_message_id,
      deliveryStatus: row.delivery_status,
      createdAt: row.created_at,
    };

  try {
    switch (body.type) {
      // ---------------------------------------------------------- public
      case 'order_confirmation': {
        const orderNumber = String(body.orderNumber ?? '');
        const email = String(body.email ?? '').trim().toLowerCase();
        const { data: order } = await service
          .from('orders')
          .select('order_number, customer_name, customer_email, emirate, total_aed')
          .eq('order_number', orderNumber)
          .maybeSingle();
        // Same response whether the order is missing or the email is wrong.
        if (!order || order.customer_email.toLowerCase() !== email) {
          return json({ error: 'Order not found' }, 404);
        }
        const { data: existing } = await service
          .from('email_logs')
          .select('id')
          .eq('order_number', orderNumber)
          .eq('email_type', 'order_confirmation')
          .limit(1);
        if (existing && existing.length > 0) return json({ ok: true, alreadySent: true });

        const totalAed = formatAed(order.total_aed);
        const subject = `Vape Dubai King — Order #${orderNumber} Confirmed (${totalAed})`;
        const result = await deliver(
          order.customer_email,
          subject,
          orderEmailHtml({
            orderNumber,
            customerName: order.customer_name,
            statusLabel: STATUS_LABELS.order_placed,
            totalAed,
            emirate: order.emirate,
          })
        );
        await logEmail({
          orderNumber,
          recipient: order.customer_email,
          subject,
          type: 'order_confirmation',
          status: result.deliveryStatus,
          messageId: result.messageId,
        });
        return json({ ok: true });
      }

      case 'newsletter': {
        const email = String(body.email ?? '').trim().toLowerCase();
        const name = String(body.name ?? '').trim().slice(0, 80) || 'UAE VIP Member';
        if (!EMAIL_RE.test(email) || email.length > 254) {
          return json({ error: 'Please enter a valid email address.' }, 400);
        }
        const { data: existing } = await service
          .from('newsletter_leads')
          .select('email')
          .eq('email', email)
          .maybeSingle();
        if (existing) return json({ ok: true, alreadySubscribed: true });

        const { error: insertError } = await service
          .from('newsletter_leads')
          .insert({ email, name, discount_code: NEWSLETTER_DISCOUNT_CODE });
        if (insertError) {
          console.error('newsletter insert failed:', insertError);
          return json({ error: 'Could not save your subscription.' }, 500);
        }
        const subject = `Vape Dubai King VIP Club — Your 15% OFF Code (${NEWSLETTER_DISCOUNT_CODE}) Inside`;
        const result = await deliver(email, subject, newsletterHtml(name));
        await logEmail({
          orderNumber: `VIP-${NEWSLETTER_DISCOUNT_CODE}`,
          recipient: email,
          subject,
          type: 'newsletter_welcome',
          status: result.deliveryStatus,
          messageId: result.messageId,
        });
        return json({ ok: true, discountCode: NEWSLETTER_DISCOUNT_CODE });
      }

      // ----------------------------------------------------------- admin
      case 'status_update': {
        if (!(await isAdmin())) return json({ error: 'Admin access required' }, 403);
        const orderNumber = String(body.orderNumber ?? '');
        const { data: order } = await service
          .from('orders')
          .select('order_number, customer_name, customer_email, emirate, total_aed, status')
          .eq('order_number', orderNumber)
          .maybeSingle();
        if (!order) return json({ error: 'Order not found' }, 404);

        const statusLabel = STATUS_LABELS[order.status] ?? order.status;
        const subject = `Vape Dubai King — Order #${orderNumber} Update: ${statusLabel}`;
        const result = await deliver(
          order.customer_email,
          subject,
          orderEmailHtml({
            orderNumber,
            customerName: order.customer_name,
            statusLabel,
            totalAed: formatAed(order.total_aed),
            emirate: order.emirate,
          })
        );
        const row = await logEmail({
          orderNumber,
          recipient: order.customer_email,
          subject,
          type: 'status_update',
          status: result.deliveryStatus,
          messageId: result.messageId,
        });
        return json({ ok: true, emailLog: toLogShape(row) });
      }

      case 'admin_dispatch': {
        if (!(await isAdmin())) return json({ error: 'Admin access required' }, 403);
        const recipient = String(body.recipientEmail ?? '').trim();
        if (!EMAIL_RE.test(recipient)) return json({ error: 'Invalid recipient email' }, 400);
        const orderNumber = String(body.orderNumber ?? '').slice(0, 40);
        const statusLabel = String(body.statusLabel ?? 'Update').slice(0, 120);
        const subject = `Vape Dubai King — Order #${orderNumber} Update: ${statusLabel}`;
        const result = await deliver(
          recipient,
          subject,
          orderEmailHtml({
            orderNumber,
            customerName: String(body.customerName ?? 'Customer').slice(0, 120),
            statusLabel,
            totalAed: String(body.totalAed ?? '').slice(0, 40),
            emirate: String(body.emirate ?? '').slice(0, 40),
          })
        );
        const row = await logEmail({
          orderNumber,
          recipient,
          subject,
          type: 'admin_dispatch',
          status: result.deliveryStatus,
          messageId: result.messageId,
        });
        return json({ ok: true, emailLog: toLogShape(row) });
      }

      default:
        return json({ error: 'Unknown email type' }, 400);
    }
  } catch (err) {
    console.error('send-email failed:', err);
    return json({ error: 'Email request failed' }, 500);
  }
});
