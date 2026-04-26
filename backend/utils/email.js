//email.js handles sending verification emails 
// using multiple providers (MailSender, Resend, SMTP) 
// with a fallback mechanism. It includes detailed 
// diagnostics and error logging to help identify 
// issues with email delivery. The module exports 
// the sendVerificationEmail function for 
// sending emails and getEmailDiagnostics for 
// retrieving recent email send attempts and errors.

//const
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const useMailSender = !!(process.env.MAILSENDER_API_TOKEN || process.env.MAILERSEND_API_KEY);
const useResend = !!process.env.RESEND_API_KEY;
const hasSmtpCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
const emailProviderMode = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
const mailSenderToken = process.env.MAILSENDER_API_TOKEN || process.env.MAILERSEND_API_KEY;
const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
const EMAIL_DIAGNOSTICS_MAX = 50;
const emailDiagnostics = [];
//const end 



//block 1 
// Helper functions for diagnostics and error logging
function pushEmailDiagnostic(entry) {

  // Add timestamp and ensure diagnostics array doesn't exceed max length
  emailDiagnostics.unshift({
    at: new Date().toISOString(),
    ...entry,
  });

  // Trim diagnostics array if it exceeds the maximum length
  if (emailDiagnostics.length > EMAIL_DIAGNOSTICS_MAX) {
    emailDiagnostics.length = EMAIL_DIAGNOSTICS_MAX;
  }
}
//block 1 end









//block 2 
function getEmailDiagnostics(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, EMAIL_DIAGNOSTICS_MAX));
  return emailDiagnostics.slice(0, safeLimit);
}
//block 2 end








//block 3
function logEmailProviderError(provider, email, fromAddress, error) {

  // Construct a detailed error object for logging
  const providerError = {
    provider,
    email,
    fromAddress,
    message: error?.message,
    name: error?.name,
    code: error?.code,
    statusCode: error?.statusCode,
    responseBody: error?.response?.body || error?.response?.data || null,
    response: error?.response || null,
    rejected: error?.rejected || null,
    command: error?.command || null,
  };

  pushEmailDiagnostic({
    type: 'provider-error',
    provider,
    email,
    fromAddress,
    message: providerError.message,
    code: providerError.code,
    statusCode: providerError.statusCode,
    responseBody: providerError.responseBody,
  });

  console.error('Verification email provider error:', providerError);
}
//block 3 end










//block 4
function withTimeout(promise, timeoutMs, label) {

  // Create a timeout promise that rejects after the specified time
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}
//block 4 end




//block 5
// SMTP transporter (fallback for local/dev)
const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null;
//block 5 end



// Alternative: For development/testing, you can use Mailtrap or similar
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });



//block 6
async function sendVerificationEmail(email, username, verificationCode) {

  // Construct email content
  const subject = 'Verify Your Stay Fit Account';

  // HTML email template with inline styles for better compatibility across email clients
  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Stay Fit</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Welcome, ${username}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up with Stay Fit. To complete your registration and secure your account, please use the verification code below.
            </p>
            <div style="text-align: center; margin: 30px 0; background: white; padding: 20px; border-radius: 8px; border: 2px dashed #667eea;">
              <p style="color: #999; font-size: 14px; margin: 0 0 10px 0;">Your verification code:</p>
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
            </div>
            <p style="color: #666; line-height: 1.6; text-align: center;">
              Enter this code on the verification page to activate your account.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This code will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        </div>
      `;

      // Determine provider queue based on configuration
  const providerQueue = [];

  // If a specific provider mode is set, use only that provider
  if (emailProviderMode === 'mailsender') {
    providerQueue.push('mailsender');
  } else if (emailProviderMode === 'resend') {
    providerQueue.push('resend');
  } else if (emailProviderMode === 'smtp') {
    providerQueue.push('smtp');
  } else {
    if (useMailSender) providerQueue.push('mailsender');
    if (useResend) providerQueue.push('resend');
    if (transporter) providerQueue.push('smtp');
  }

  // If no providers are configured, log an error and return
  if (providerQueue.length === 0) {
    console.error('No email provider configured. Set MAILSENDER_API_TOKEN (or MAILERSEND_API_KEY), RESEND_API_KEY, or EMAIL_USER/EMAIL_PASSWORD.');
    pushEmailDiagnostic({
      type: 'provider-config-error',
      provider: 'none',
      email,
      message: 'No email provider configured',
    });
    return false;
  }

  for (const provider of providerQueue) {
    const fromAddress =
      provider === 'mailsender'
        ? process.env.EMAIL_FROM_MAILSENDER || process.env.EMAIL_FROM || process.env.EMAIL_USER
        : provider === 'resend'
        ? process.env.EMAIL_FROM_RESEND || process.env.EMAIL_FROM || 'onboarding@resend.dev'
        : process.env.EMAIL_FROM || process.env.EMAIL_USER;

    try {
      if (!fromAddress) {
        throw new Error(`Missing sender address for provider ${provider}. Set EMAIL_FROM (or provider-specific EMAIL_FROM_MAILSENDER/EMAIL_FROM_RESEND).`);
      }

      if (provider === 'mailsender') {
        console.log(`Sending email via MailSender to ${email} from ${fromAddress}`);
        const response = await withTimeout(
          fetch('https://api.mailersend.com/v1/email', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${mailSenderToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: { email: fromAddress },
              to: [{ email }],
              subject,
              html,
            }),
          }),
          EMAIL_SEND_TIMEOUT_MS,
          'MailSender email send'
        );

        // MailSender's API may return a 200 status code even if the email wasn't accepted for delivery,
        //  so we check the response status and log accordingly
        if (!response.ok) {
          const errorBody = await response.text().catch(() => null);
          const mailSenderError = new Error(`MailSender request failed with status ${response.status}`);
          mailSenderError.statusCode = response.status;
          mailSenderError.response = { body: errorBody };
          throw mailSenderError;
        }

        pushEmailDiagnostic({
          type: 'provider-success',
          provider,
          email,
          fromAddress,
          statusCode: response.status,
          messageId: response.headers.get('x-message-id') || null,
        });

        // Note: MailSender's API may not return a message ID or may 
        // not throw on all errors, so we check the response status and log accordingly
      } else if (provider === 'resend') {
        console.log(`📧 Sending email via Resend to ${email} from ${fromAddress}`);
        const response = await withTimeout(
          resend.emails.send({
            from: fromAddress,
            to: email,
            subject,
            html,
          }),
          EMAIL_SEND_TIMEOUT_MS,
          'Resend email send'
        );
        console.log('Resend response:', response);
        pushEmailDiagnostic({
          type: 'provider-success',
          provider,
          email,
          fromAddress,
          resendId: response?.data?.id || response?.id || null,
        });

        // Note: Resend's send method may not throw on all errors, 
        // so we check the response for success indicators
      } else if (provider === 'smtp') {
        if (!transporter) {
          throw new Error('SMTP provider selected but EMAIL_USER/EMAIL_PASSWORD are not configured.');
        }
        console.log(`Sending email via SMTP to ${email} from ${fromAddress}`);
        const mailOptions = {
          from: fromAddress,
          to: email,
          subject,
          html,
        };

        // Wrap sendMail in a timeout to prevent hanging
        await withTimeout(
          transporter.sendMail(mailOptions),
          EMAIL_SEND_TIMEOUT_MS,
          'SMTP email send'
        );

        // Log success for SMTP
        pushEmailDiagnostic({
          type: 'provider-success',
          provider,
          email,
          fromAddress,
        });
      }

      // If we reach here, the email was sent successfully with the current provider, so we can return
      console.log(`Verification email sent to ${email} using ${provider}`);
      return true;
    } catch (error) {
      logEmailProviderError(provider, email, fromAddress, error);
      console.error(`Email send failed via ${provider}, trying next provider if available.`);
    }
  }

  // If we exhaust all providers and fail, log a final error
  console.error(`All email providers failed for ${email}`);
  pushEmailDiagnostic({
    type: 'all-providers-failed',
    provider: 'all',
    email,
    message: 'All configured providers failed',
  });
  return false;
}
//block 6 end





module.exports = { sendVerificationEmail, getEmailDiagnostics };
