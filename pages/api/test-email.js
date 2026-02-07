// Test endpoint to verify email configuration
// DELETE THIS FILE after testing!

export default async function handler(req, res) {
  // Only allow in development or with secret key
  if (process.env.NODE_ENV === 'production' && req.query.secret !== 'test123') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const config = {
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10) || 'MISSING',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  };

  // Try to send a test email
  let emailResult = null;
  if (config.hasResendKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      emailResult = await resend.emails.send({
        from: config.fromEmail,
        to: 'brettlc2113@gmail.com', // Your email
        subject: 'Test Email from VFO',
        html: '<p>This is a test email. If you received this, email sending works!</p>',
      });
      
      return res.status(200).json({
        success: true,
        config,
        emailResult,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        config,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      });
    }
  }

  return res.status(500).json({
    success: false,
    config,
    error: 'No Resend API key configured',
  });
}
