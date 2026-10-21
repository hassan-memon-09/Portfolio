export { contactTopics, validateContact, type ContactDetails } from './contact-validation';
import { validateContact, type ContactDetails } from './contact-validation';
export async function sendContactEmail(details: ContactDetails, submissionId: string) {
  if (details.website.trim()) throw new Error('Unable to submit this form.');
  if (Object.keys(validateContact(details)).length) throw new Error('Please check the highlighted fields.');
  const response = await fetch('/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...details, submissionId }), signal: AbortSignal.timeout(60_000),
  });
  const result = await response.json();
  if (!response.ok || result.success !== true) throw new Error(result.error || 'Unable to send your message. Please try again.');
  return result as { success: true; message: string };
}
