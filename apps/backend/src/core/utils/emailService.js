import nodemailer from 'nodemailer';
import EmailLog from '../db/Models/EmailLog/emailLog.model.js';

/**
 * Escape user-supplied strings before inserting them into HTML email bodies.
 * Prevents XSS in email clients that render HTML.
 */
const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

/** Mask an email address for safe logging (e.g. "j***@example.com"). */
const maskEmail = (email) => {
  const [local, domain] = String(email).split('@');
  return `${local[0]}***@${domain}`;
};

/**
 * Lazy-initialised singleton transporter.
 * Created once on first use so `process.env` is populated by dotenv.
 */
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send a transactional email and write an EmailLog record.
 *
 * @param {{ to: string, subject: string, html: string }} mailOptions
 * @param {{ userId: string, type: string }} logMeta
 */
const sendEmail = async ({ to, subject, html }, { userId, type }) => {
  const from = process.env.DEFAULT_FROM_EMAIL ?? 'no-reply@example.com';
  let status = 'sent';
  let errorMessage = null;

  try {
    await getTransporter().sendMail({ from, to, subject, html });
  } catch (err) {
    status = 'failed';
    errorMessage = err.message;
    console.error(`[Email] Failed to send "${type}" to ${maskEmail(to)}:`, err.message);
  }

  // Always log the attempt — fire-and-forget (don't await so it never blocks)
  EmailLog.create({ userId, type, recipient: to, status, errorMessage }).catch((logErr) =>
    console.error('[Email] Failed to write EmailLog:', logErr.message)
  );
};

// ─── Template helpers ────────────────────────────────────────────────────────

/**
 * Send account-confirmation email with a JWT link.
 *
 * @param {{ userId: string, email: string, token: string }} param0
 */
export const sendConfirmationEmail = ({ userId, email, token }) => {
  const link = `${process.env.FRONTEND_URL}/auth/confirm/${encodeURIComponent(token)}`;
  return sendEmail(
    {
      to: email,
      subject: 'Confirm your email address',
      html: `
        <h2>Welcome!</h2>
        <p>Please confirm your email address by clicking the link below.</p>
        <p><a href="${link}">Confirm Email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    },
    { userId, type: 'confirmation' }
  );
};

/**
 * Send password-reset email.
 *
 * @param {{ userId: string, email: string, token: string }} param0
 */
export const sendPasswordResetEmail = ({ userId, email, token }) => {
  const link = `${process.env.FRONTEND_URL}/auth/reset-password/${encodeURIComponent(token)}`;
  return sendEmail(
    {
      to: email,
      subject: 'Reset your password',
      html: `
        <h2>Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="${link}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    },
    { userId, type: 'password-reset' }
  );
};

// ─── Order notification emails ────────────────────────────────────────────────

/**
 * Format a currency amount for display in emails.
 * @param {number|string} amount
 * @param {string} [currency]
 */
const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));

/**
 * Build an HTML table of order line items for inclusion in email templates.
 */
const buildItemsTable = (items) => `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px;text-align:left;border:1px solid #ddd;">Product</th>
        <th style="padding:8px;text-align:center;border:1px solid #ddd;">Qty</th>
        <th style="padding:8px;text-align:right;border:1px solid #ddd;">Unit Price</th>
        <th style="padding:8px;text-align:right;border:1px solid #ddd;">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">
            ${
              item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${escapeHtml(item.productNameSnapshot)}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;">`
                : ''
            }
            ${escapeHtml(item.productNameSnapshot)}
          </td>
          <td style="padding:8px;text-align:center;border:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px;text-align:right;border:1px solid #ddd;">${formatCurrency(item.priceSnapshot)}</td>
          <td style="padding:8px;text-align:right;border:1px solid #ddd;">${formatCurrency(item.lineTotal)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table>
`;

/**
 * Send "order placed" confirmation email to the customer.
 *
 * @param {{
 *   userId: string,
 *   email: string,
 *   firstName: string,
 *   orderId: string,
 *   items: Array<{ productNameSnapshot: string, quantity: number, priceSnapshot: number, lineTotal: number }>,
 *   subtotal: number,
 *   discountAmount: number,
 *   shippingCost: number,
 *   total: number,
 *   placedAt: Date
 * }} param0
 */
export const sendOrderPlacedEmail = ({
  userId,
  email,
  firstName,
  orderId,
  items,
  subtotal,
  discountAmount,
  shippingCost,
  total,
  placedAt,
}) => {
  const orderLink = `${process.env.FRONTEND_URL}/orders/${orderId}`;
  const date = new Date(placedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return sendEmail(
    {
      to: email,
      subject: `Order confirmed — #${orderId}`,
      html: `
        <h2>Thank you for your order, ${escapeHtml(firstName)}!</h2>
        <p>We've received your order and it is now being processed.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Date:</strong> ${date}</p>
        ${buildItemsTable(items)}
        <table style="width:100%;margin:8px 0;">
          <tr><td>Subtotal</td><td style="text-align:right;">${formatCurrency(subtotal)}</td></tr>
          ${Number(discountAmount) > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-${formatCurrency(discountAmount)}</td></tr>` : ''}
          <tr><td>Shipping</td><td style="text-align:right;">${formatCurrency(shippingCost)}</td></tr>
          <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${formatCurrency(total)}</strong></td></tr>
        </table>
        <p><a href="${orderLink}">View your order</a></p>
      `,
    },
    { userId, type: 'order-placed' }
  );
};

/**
 * Send "order processing" status update email to the customer.
 *
 * @param {{ userId: string, email: string, firstName: string, orderId: string }} param0
 */
export const sendOrderProcessingEmail = ({
  userId,
  email,
  firstName,
  orderId,
  items,
  subtotal,
  discountAmount,
  shippingCost,
  total,
}) => {
  const orderLink = `${process.env.FRONTEND_URL}/orders/${orderId}`;
  return sendEmail(
    {
      to: email,
      subject: `Your order #${orderId} is being processed`,
      html: `
        <h2>Good news, ${escapeHtml(firstName)}!</h2>
        <p>Your order <strong>#${orderId}</strong> is now being processed and will be shipped soon.</p>
        ${buildItemsTable(items)}
        <table style="width:100%;margin:8px 0;">
          <tr><td>Subtotal</td><td style="text-align:right;">${formatCurrency(subtotal)}</td></tr>
          ${Number(discountAmount) > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-${formatCurrency(discountAmount)}</td></tr>` : ''}
          <tr><td>Shipping</td><td style="text-align:right;">${formatCurrency(shippingCost ?? 0)}</td></tr>
          <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${formatCurrency(total)}</strong></td></tr>
        </table>
        <p><a href="${orderLink}">Track your order</a></p>
      `,
    },
    { userId, type: 'order-processing' }
  );
};

/**
 * Send "order shipped" email with tracking information.
 *
 * @param {{ userId: string, email: string, firstName: string, orderId: string, trackingNumber: string | null }} param0
 */
export const sendOrderShippedEmail = ({
  userId,
  email,
  firstName,
  orderId,
  trackingNumber,
  items,
  subtotal,
  discountAmount,
  shippingCost,
  total,
}) => {
  const orderLink = `${process.env.FRONTEND_URL}/orders/${orderId}`;
  return sendEmail(
    {
      to: email,
      subject: `Your order #${orderId} has shipped!`,
      html: `
        <h2>Your order is on its way, ${escapeHtml(firstName)}!</h2>
        <p>Order <strong>#${orderId}</strong> has been shipped.</p>
        ${trackingNumber ? `<p><strong>Tracking number:</strong> ${escapeHtml(trackingNumber)}</p>` : ''}
        ${buildItemsTable(items)}
        <table style="width:100%;margin:8px 0;">
          <tr><td>Subtotal</td><td style="text-align:right;">${formatCurrency(subtotal)}</td></tr>
          ${Number(discountAmount) > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-${formatCurrency(discountAmount)}</td></tr>` : ''}
          <tr><td>Shipping</td><td style="text-align:right;">${formatCurrency(shippingCost ?? 0)}</td></tr>
          <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${formatCurrency(total)}</strong></td></tr>
        </table>
        <p><a href="${orderLink}">View order details</a></p>
      `,
    },
    { userId, type: 'order-shipped' }
  );
};
