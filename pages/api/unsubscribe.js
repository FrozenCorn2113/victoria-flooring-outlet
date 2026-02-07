// pages/api/unsubscribe.js
// CASL-compliant one-click unsubscribe with HMAC verification

import { withdrawConsent, verifyUnsubscribeToken } from '@/lib/consent';
import { query } from '@/lib/db';
import { unsubscribe as unsubscribeFromMailerLite } from '@/lib/mailerlite';

/**
 * GET /api/unsubscribe?email=BASE64&token=HMAC
 * One-click unsubscribe with signed token verification
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: encodedEmail, token } = req.query;

  if (!encodedEmail || !token) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invalid Unsubscribe Link - Victoria Flooring Outlet</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #1E1A15; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Invalid Unsubscribe Link</h1>
        <p>This unsubscribe link is invalid or incomplete. Please use the link from your email or contact us at <a href="sms:7788717681">778-871-7681</a>.</p>
      </body>
      </html>
    `);
  }

  // Decode base64url email
  let email;
  try {
    email = Buffer.from(encodedEmail, 'base64url').toString('utf-8');
  } catch (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invalid Email - Victoria Flooring Outlet</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #1E1A15; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Invalid Email</h1>
        <p>The email address in this link is invalid.</p>
      </body>
      </html>
    `);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verify HMAC signature
  const isValid = verifyUnsubscribeToken(normalizedEmail, token);
  if (!isValid) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invalid Token - Victoria Flooring Outlet</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #1E1A15; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Invalid or Expired Link</h1>
        <p>This unsubscribe link is invalid or has been tampered with. Please contact us at <a href="sms:7788717681">778-871-7681</a> to unsubscribe.</p>
      </body>
      </html>
    `);
  }

  try {
    // 1. Withdraw all consents in DB
    await withdrawConsent(normalizedEmail, 'User clicked unsubscribe link');

    // 2. Mark as unsubscribed in local DB
    await query(
      `UPDATE newsletter_subscribers
       SET 
         status = 'unsubscribed',
         unsubscribed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE email = $1`,
      [normalizedEmail]
    );

    // 3. Unsubscribe from MailerLite (async, non-blocking)
    unsubscribeFromMailerLite(normalizedEmail).catch(err => {
      console.error('MailerLite unsubscribe error:', err);
    });

    // 4. Clear subscriber cookie
    res.setHeader('Set-Cookie', 'vfo_subscriber=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

    // 5. Return success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Victoria Flooring Outlet</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 600px; 
            margin: 80px auto; 
            padding: 40px 20px; 
            text-align: center;
            background-color: #f5f5f5;
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { 
            color: #1E1A15; 
            font-size: 28px;
            margin: 0 0 16px;
          }
          p { 
            color: #666; 
            line-height: 1.8; 
            margin: 0 0 20px;
            font-size: 16px;
          }
          .email {
            background: #f9f9f9;
            padding: 12px 20px;
            border-radius: 6px;
            color: #1E1A15;
            font-weight: 600;
            margin: 20px 0;
          }
          a {
            color: #1F1C19;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            text-decoration: underline;
          }
          .contact {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✓ You've been unsubscribed</h1>
          <div class="email">${normalizedEmail}</div>
          <p>You won't receive any more emails from Victoria Flooring Outlet.</p>
          <p>If you change your mind, you can always <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca'}">resubscribe on our website</a>.</p>
          <div class="contact">
            Questions? Text Ty at <a href="sms:7788717681">778-871-7681</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Error - Victoria Flooring Outlet</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #1E1A15; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Something went wrong</h1>
        <p>We couldn't process your unsubscribe request. Please contact us at <a href="sms:7788717681">778-871-7681</a>.</p>
      </body>
      </html>
    `);
  }
}
