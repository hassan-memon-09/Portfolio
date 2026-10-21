import nodemailer from 'nodemailer';
import { createHash } from 'node:crypto';
import { validateContact, type ContactDetails } from '../../../lib/contact-validation';
export const runtime = 'nodejs';
export const maxDuration = 60;
const rates = new Map<string, { count: number; until: number }>();
const submissions = new Map<string, { until: number; result: Promise<Response> }>();
const address = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const layout = (title: string, body: string) => `<html><body style="font-family:Arial,sans-serif;color:#18263e;background:#f1f5fb;padding:24px"><div style="max-width:560px;margin:auto;background:white;padding:32px;border-radius:16px"><p style="color:#315dba;font-size:12px">MUHAMMAD HASSAN / PORTFOLIO</p><h1 style="font-size:26px">${title}</h1>${body}<hr><p style="font-size:12px;color:#62718a">Full-Stack AI Engineer · Lahore, Pakistan</p></div></body></html>`;
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Please submit from this website.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Invalid form submission.' }, 415);
  let raw: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Please complete the form.' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16000) { await reader.cancel(); return json({ error: 'Message is too long.' }, 413); }
      chunks.push(value);
    }
    raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error();
  } catch { return json({ error: 'Invalid form submission.' }, 400); }
  const field = (k: string) => typeof raw[k] === 'string' ? (raw[k] as string).trim() : '';
  const details: ContactDetails = { name: field('name'), email: field('email').toLowerCase(), company: field('company'), topic: field('topic'), message: field('message'), website: field('website'), consent: raw.consent === true };
  if (details.website) return json({ error: 'Unable to submit this form.' }, 400);
  const errors = validateContact(details);
  if (Object.keys(errors).length) return json({ error: 'Please check the form details.', errors }, 400);
  const id = field('submissionId');
  if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) return json({ error: 'Please refresh the page and try again.' }, 400);
  const user = process.env.SMTP_USER?.trim(), pass = process.env.SMTP_PASSWORD?.replace(/\s/g, '');
  const to = process.env.CONTACT_TO_EMAIL?.trim() || 'mhdhassan.dev@gmail.com';
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com', port = Number(process.env.SMTP_PORT || 465);
  if (!user || !address.test(user) || !pass || !address.test(to) || ![465, 587].includes(port)) return json({ error: 'Email sending is not configured yet. Please email mhdhassan.dev@gmail.com directly.' }, 503);
  const now = Date.now();
  for (const [key, entry] of rates) if (entry.until < now) rates.delete(key);
  for (const [key, entry] of submissions) if (entry.until < now) submissions.delete(key);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rateKey = createHash('sha256').update(ip).digest('hex'), rate = rates.get(rateKey);
  if ((rate?.count || 0) >= 5 || rates.size > 2000) return json({ error: 'Too many attempts. Please wait ten minutes before trying again.' }, 429);
  rates.set(rateKey, { count: (rate?.count || 0) + 1, until: rate?.until || now + 600000 });
  const key = createHash('sha256').update(JSON.stringify({ id, details })).digest('hex');
  const existing = submissions.get(key);
  if (existing) return (await existing.result).clone();
  if (submissions.size >= 2000) return json({ error: 'The contact form is busy. Please try again shortly.' }, 429);
  const result = (async () => {
    const transport = nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: port === 587,
      auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
    try {
      const info = await transport.sendMail({
        from: { name: 'Muhammad Hassan — Portfolio', address: user }, to, replyTo: details.email,
        subject: `Portfolio inquiry: ${details.topic}`,
        text: `Name: ${details.name}\nEmail: ${details.email}\nCompany: ${details.company || 'Not provided'}\nTopic: ${details.topic}\n\n${details.message}`,
        html: layout('A new inquiry.', `<p><strong>Name:</strong> ${escape(details.name)}<br><strong>Email:</strong> ${escape(details.email)}<br><strong>Company:</strong> ${escape(details.company || 'Not provided')}<br><strong>Topic:</strong> ${escape(details.topic)}</p><p style="white-space:pre-wrap;line-height:1.8">${escape(details.message)}</p>`),
      });
      if (!info.accepted?.length) throw new Error('Owner recipient not accepted');
    } catch {
      return json({ error: 'We could not confirm your submission. Please check your inbox before retrying, or email mhdhassan.dev@gmail.com directly.' }, 502);
    }
    try {
      const receipt = await transport.sendMail({
        from: { name: 'Muhammad Hassan', address: user }, to: details.email, replyTo: to,
        subject: 'Thanks for reaching out — Muhammad Hassan',
        text: 'Thanks for reaching out!\n\nYour message has been received. I will review it and get back to you. You can reply to this email to add anything else.\n\nMuhammad Hassan\nFull-Stack AI Engineer\n\nIf you did not submit an inquiry on my portfolio, you can ignore this email.',
        html: layout('Thanks for reaching out.', '<p>Your message has been received. I will review it and get back to you.</p><p>You can reply to this email to add anything else.</p><p>Muhammad Hassan<br>Full-Stack AI Engineer</p><p style="font-size:12px;color:#62718a">If you did not submit an inquiry on my portfolio, you can ignore this email.</p>'),
      });
      if (!receipt.accepted?.length) throw new Error('Visitor recipient not accepted');
      return json({ success: true, message: 'Thanks! Your inquiry and confirmation email have been accepted for sending. Please check your inbox or spam folder.' });
    } catch {
      return json({ success: true, message: 'Your message was received, but the confirmation email could not be sent. There is no need to submit again.' });
    }
  })();
  submissions.set(key, { until: now + 3600000, result });
  return (await result).clone();
}
