const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { Resend } = require('resend');

const useSendGrid = !!process.env.SENDGRID_API_KEY;
const useResend = !!process.env.RESEND_API_KEY;
const hasSmtpCredentials = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

if (useSendGrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS || 12000);
const EMAIL_DIAGNOSTICS_MAX = 50;
const emailDiagnostics = [];

function pushEmailDiagnostic(entry) {
  emailDiagnostics.unshift({
    at: new Date().toISOString(),
    ...entry,
  });
  if (emailDiagnostics.length > EMAIL_DIAGNOSTICS_MAX) {
    emailDiagnostics.length = EMAIL_DIAGNOSTICS_MAX;
  }
}

function getEmailDiagnostics(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, EMAIL_DIAGNOSTICS_MAX));
  return emailDiagnostics.slice(0, safeLimit);
}

function logEmailProviderError(provider, email, fromAddress, error) {
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

  console.error('❌ Verification email provider error:', providerError);
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

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

// Alternative: For development/testing, you can use Mailtrap or similar
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

async function sendVerificationEmail(email, username, verificationCode) {
  const subject = 'Verify Your Stay Fit Account';
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

  const providerQueue = [];
  if (useSendGrid) providerQueue.push('sendgrid');
  if (useResend) providerQueue.push('resend');
  if (transporter) providerQueue.push('smtp');

  if (providerQueue.length === 0) {
    console.error('❌ No email provider configured. Set SENDGRID_API_KEY, RESEND_API_KEY, or EMAIL_USER/EMAIL_PASSWORD.');
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
      provider === 'sendgrid'
        ? process.env.EMAIL_FROM_SENDGRID || process.env.EMAIL_FROM || process.env.EMAIL_USER
        : provider === 'resend'
        ? process.env.EMAIL_FROM_RESEND || process.env.EMAIL_FROM || 'onboarding@resend.dev'
        : process.env.EMAIL_FROM || process.env.EMAIL_USER;

    try {
      if (!fromAddress) {
        throw new Error(`Missing sender address for provider ${provider}. Set EMAIL_FROM (or provider-specific EMAIL_FROM_SENDGRID/EMAIL_FROM_RESEND).`);
      }

      if (provider === 'sendgrid') {
        console.log(`📧 Sending email via SendGrid to ${email} from ${fromAddress}`);
        const response = await withTimeout(
          sgMail.send({
            to: email,
            from: fromAddress,
            subject,
            html,
          }),
          EMAIL_SEND_TIMEOUT_MS,
          'SendGrid email send'
        );
        console.log('✅ SendGrid response:', response?.[0]?.statusCode || 'ok');
        pushEmailDiagnostic({
          type: 'provider-success',
          provider,
          email,
          fromAddress,
          statusCode: response?.[0]?.statusCode || null,
        });
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
        console.log('✅ Resend response:', response);
        pushEmailDiagnostic({
          type: 'provider-success',
          provider,
          email,
          fromAddress,
          resendId: response?.data?.id || response?.id || null,
        });
      } else if (provider === 'smtp') {
        console.log(`📧 Sending email via SMTP to ${email} from ${fromAddress}`);
        const mailOptions = {
          from: fromAddress,
          to: email,
          subject,
          html,
        };
        await withTimeout(
          transporter.sendMail(mailOptions),
          EMAIL_SEND_TIMEOUT_MS,
          'SMTP email send'
        );
        pushEmailDiagnostic({
          type: 'provider-success',
          provider,
          email,
          fromAddress,
        });
      }

      console.log(`✅ Verification email sent to ${email} using ${provider}`);
      return true;
    } catch (error) {
      logEmailProviderError(provider, email, fromAddress, error);
      console.error(`❌ Email send failed via ${provider}, trying next provider if available.`);
    }
  }

  console.error(`❌ All email providers failed for ${email}`);
  pushEmailDiagnostic({
    type: 'all-providers-failed',
    provider: 'all',
    email,
    message: 'All configured providers failed',
  });
  return false;
}

module.exports = { sendVerificationEmail, getEmailDiagnostics };
