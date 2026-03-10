#!/usr/bin/env node
/**
 * scripts/test-smtp.js
 *
 * Simple script to verify SMTP settings and send a test message.
 * Usage:
 *   node scripts/test-smtp.js
 *
 * Requires environment variables in `apps/backend/.env` or your shell:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DEFAULT_FROM_EMAIL
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.DEFAULT_FROM_EMAIL || 'no-reply@example.com';
const to = process.env.SMTP_TEST_TO || user || ''; // fallback to auth user if provided

if (!host) {
  console.error('Missing SMTP_HOST in environment. Fill apps/backend/.env or export vars.');
  process.exit(2);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for 465, false for other ports
  auth: user && pass ? { user, pass } : undefined,
});

(async () => {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection OK.');

    if (!to) {
      console.log('No recipient configured. Set SMTP_TEST_TO or SMTP_USER to send a test message.');
      process.exit(0);
    }

    console.log(`Sending test message to ${to}...`);
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Ecommerce — SMTP test',
      text: 'This is a test email from your Ecommerce app SMTP settings.',
    });

    console.log('Message sent. Response:', info.response || info);
  } catch (err) {
    console.error('SMTP test failed:', err.message || err);
    process.exitCode = 1;
  }
})();
