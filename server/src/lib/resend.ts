import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

// resend is undefined when key is missing — routes that need it check at call time
export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@example.com';
