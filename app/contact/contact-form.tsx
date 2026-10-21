'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, LoaderCircle, Send } from 'lucide-react';
import { contactTopics, sendContactEmail, validateContact, type ContactDetails } from '../../lib/contact-email';

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastSent = useRef(0);
  const submission = useRef<{ body: string; id: string } | null>(null);
  const submitting = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const fields: ContactDetails = {
      name: String(data.get('name') || ''), email: String(data.get('email') || ''),
      company: String(data.get('company') || ''), topic: String(data.get('topic') || ''),
      message: String(data.get('message') || ''), website: String(data.get('website') || ''),
      consent: data.get('consent') === 'on',
    };
    const fieldErrors = validateContact(fields);
    setErrors(fieldErrors); setNotice('');
    if (Object.keys(fieldErrors).length) {
      (form.elements.namedItem(Object.keys(fieldErrors)[0]) as HTMLElement | null)?.focus();
      return;
    }
    if (Date.now() - lastSent.current < 60_000) {
      setNotice('Your previous message was sent. Please wait a minute before sending another.');
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    submitting.current = true; setSending(true);
    try {
      const body = JSON.stringify(fields);
      if (submission.current?.body !== body) submission.current = { body, id: crypto.randomUUID() };
      const result = await sendContactEmail(fields, submission.current.id);
      lastSent.current = Date.now();
      setSuccess(true);
      setNotice(result.message);
      submission.current = null;
      form.reset();
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (error) {
      const message = error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError'
        ? error.message
        : 'We could not confirm your submission. Please check your inbox before retrying, or email mhdhassan.dev@gmail.com directly.';
      setNotice(message);
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally { setSending(false); submitting.current = false; }
  }

  if (success) return <div className="form-success" ref={statusRef} tabIndex={-1} role="status"><span className="success-icon"><Check size={28}/></span><span className="eyebrow">CONVERSATION STARTED</span><h2>You’re on my radar.</h2><p>{notice}</p><button className="button primary" onClick={() => { setSuccess(false); setNotice(''); }}>Send another message <ArrowUpRight size={17}/></button><a href="/">Back to portfolio</a></div>;

  const errorProps = (name: string) => ({ 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const error = (name: string) => errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name]}</span>;
  return <form className="inquiry-form" onSubmit={onSubmit} aria-label="Contact Muhammad Hassan" aria-busy={sending}>
    <div className="form-heading"><span className="eyebrow">LET’S START WITH A HELLO</span><h2>Tell me what’s on your mind.</h2><p>Share a few details and I’ll take it from there.</p></div>
    <fieldset disabled={sending}>
      <div className="form-row"><label htmlFor="name">Full name <span>*</span><input id="name" name="name" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={80} required {...errorProps('name')}/>{error('name')}</label><label htmlFor="email">Email address <span>*</span><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required {...errorProps('email')}/>{error('email')}</label></div>
      <div className="form-row"><label htmlFor="company">Company <span className="optional">Optional</span><input id="company" name="company" autoComplete="organization" placeholder="Your company or team" maxLength={100} {...errorProps('company')}/>{error('company')}</label><label htmlFor="topic">What’s this about? <span>*</span><select id="topic" name="topic" required defaultValue="" {...errorProps('topic')}><option value="" disabled>Select a topic</option>{contactTopics.map(t => <option key={t}>{t}</option>)}</select>{error('topic')}</label></div>
      <label htmlFor="message">Your message <span>*</span><textarea id="message" name="message" rows={6} placeholder="Tell me about your idea, the challenge you’re solving, or what you’d like to discuss…" minLength={20} maxLength={4000} required {...errorProps('message')}/>{error('message')}<small>A little context helps. 20–4,000 characters.</small></label>
      <div className="form-trap" aria-hidden="true"><label htmlFor="website">Leave this field empty<input id="website" name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className="consent-label" htmlFor="consent"><input id="consent" name="consent" type="checkbox" required {...errorProps('consent')}/><span>I agree to receive a reply and a confirmation email about this inquiry. My details will only be used for this conversation.</span></label>{error('consent')}
      <div ref={statusRef} tabIndex={-1} role="alert" className={notice ? 'form-notice' : undefined}>{notice}</div>
      <button type="submit" className="button primary submit-button" disabled={sending}>{sending ? <><LoaderCircle size={17} className="loading-spinner"/> Sending your message…</> : <>Send message <Send size={16}/></>}</button>
      <p className="form-footnote">A confirmation email will follow once your message is submitted.</p>
    </fieldset>
  </form>;
}
