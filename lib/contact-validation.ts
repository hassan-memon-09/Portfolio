export type ContactDetails = {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
  website: string;
  consent: boolean;
};
export const contactTopics = ['Project inquiry', 'AI integration', 'Job opportunity', 'Something else'];

export function validateContact(details: ContactDetails) {
  const errors: Record<string, string> = {};
  if (details.name.trim().length < 2 || details.name.trim().length > 80 || /[\r\n\x00-\x1f]/.test(details.name)) errors.name = 'Enter a name between 2 and 80 characters.';
  if (details.email.length > 254 || !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(details.email.trim())) errors.email = 'Enter a valid email address.';
  if (details.company.length > 100 || /[\r\n\x00-\x1f]/.test(details.company)) errors.company = 'Keep the company name under 100 characters.';
  if (!contactTopics.includes(details.topic)) errors.topic = 'Choose what you would like to discuss.';
  if (details.message.trim().length < 20 || details.message.trim().length > 4000 || /\x00/.test(details.message)) errors.message = 'Write a message between 20 and 4,000 characters.';
  if (!details.consent) errors.consent = 'Please agree to be contacted about your inquiry.';
  return errors;
}

