const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const useResend = !!process.env.RESEND_API_KEY;
const resend = useResend ? new Resend(process.env.RESEND_API_KEY) : null;

// SMTP transporter (fallback for local/dev)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'onboarding@resend.dev';
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

    if (useResend) {
      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject,
        html,
      });
    } else {
      const mailOptions = {
        from: fromAddress,
        to: email,
        subject,
        html,
      };
      await transporter.sendMail(mailOptions);
    }
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

module.exports = { sendVerificationEmail };
