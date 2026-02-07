// pages/api/cart/suppress.js
// Suppress abandoned cart reminder emails

import { suppressAbandonedCartEmails } from '@/lib/abandoned-cart';

/**
 * GET /api/cart/suppress?token=SESSION_TOKEN
 * Suppress future abandoned cart emails for this cart
 * "Don't remind me" functionality
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invalid Link - Victoria Flooring Outlet</title>
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
          h1 { color: #1E1A15; }
          p { color: #666; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>Invalid Link</h1>
        <p>This link is invalid or incomplete.</p>
      </body>
      </html>
    `);
  }

  try {
    await suppressAbandonedCartEmails(token);

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reminders Stopped - Victoria Flooring Outlet</title>
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
          <h1>✓ Cart reminders stopped</h1>
          <p>You won't receive any more emails about this cart.</p>
          <p>If you change your mind, you can always visit <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://victoriaflooringoutlet.ca'}">our website</a> to see our latest deals.</p>
          <div class="contact">
            Questions? Text Ty at <a href="sms:7788717681">778-871-7681</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Cart suppression error:', error);
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
        <p>We couldn't process your request. Please contact us at <a href="sms:7788717681">778-871-7681</a>.</p>
      </body>
      </html>
    `);
  }
}
