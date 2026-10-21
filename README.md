# Muhammad Hassan — Portfolio

Next.js portfolio with a Nodemailer SMTP contact form at `/contact`.

## Run

`npm run dev` for development. `npm run build` then `npm start` for production. `npm run test:contact` tests the real API handler with mocked SMTP; no actual emails are sent.

## Gmail setup

1. Enable Google 2-Step Verification for the sending Gmail account.
2. Open https://myaccount.google.com/apppasswords and generate an App Password for this portfolio. Availability depends on account settings.
3. In root `.env`, fill `SMTP_PASSWORD` with the generated App Password. Never use your normal Gmail password or put it in a NEXT_PUBLIC_ variable. SMTP_USER is the sending account, CONTACT_TO_EMAIL is the owner inquiry recipient.
4. Restart the server. For production, set these server environment variables in hosting and run as a full Next.js application with Node.js and outbound SMTP access. Static hosting cannot run the email API.
5. Submit an inquiry using an email address you control; check both inboxes and spam folders. SMTP acceptance does not guarantee inbox delivery.

EmailJS is no longer used; existing EmailJS values in `.env` are ignored and can be removed. No EmailJS templates are needed. Email bodies are maintained in `app/api/contact/route.ts`.

The owner receives the inquiry with Reply-To set to the visitor. A separate, fixed acknowledgement is sent to the visitor with Reply-To set to the owner. If only the acknowledgement fails, the UI reports that the inquiry succeeded and does not ask for another submission.

Validation, escaped email HTML, bounded bodies, honeypot, origin checks, and in-memory rate limiting are included. In-flight/accepted submissions are deduplicated for one hour per Node.js process. These controls reset on restart and are not shared across instances; use shared durable storage and hosting-level abuse protection for stronger production guarantees. SMTP timeouts may leave delivery uncertain; do not retry blindly.

No Git operations or deployment are required by this setup.
