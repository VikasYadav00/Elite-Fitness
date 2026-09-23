// Elite Fitness - Email Service (Nodemailer + Gmail SMTP)
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

const gymName = 'Elite Fitness';

const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Elite Fitness</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #1e40af; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #bfdbfe; margin: 5px 0 0; font-size: 14px; }
    .content { padding: 32px; }
    .content h2 { color: #0f172a; font-size: 20px; margin: 0 0 16px; }
    .content p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: monospace; }
    .otp-note { color: #64748b; font-size: 13px; margin-top: 8px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-size: 14px; }
    .info-value { color: #0f172a; font-size: 14px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .btn { display: inline-block; background: #1e40af; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Elite Fitness</h1>
      <p>Premium Fitness Management</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2024 Elite Fitness. All rights reserved.</p>
      <p>This is an automated email from Elite Fitness Management System.</p>
    </div>
  </div>
</body>
</html>
`;

async function sendEmail(to, subject, htmlContent) {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: process.env.EMAIL_FROM || `Elite Fitness <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    logger.error(`Email sending failed to ${to}:`, error.message);
    return false;
  }
}

async function sendOTPEmail(email, otp, purpose) {
  const purposeLabels = {
    REGISTRATION: 'Account Registration',
    FORGOT_PASSWORD: 'Password Reset',
    PHONE_VERIFY: 'Phone Verification',
    LOGIN: 'Login Verification',
  };

  const purposeLabel = purposeLabels[purpose] || 'Verification';

  const content = `
    <h2>${purposeLabel} OTP</h2>
    <p>Hello,</p>
    <p>You have requested a One-Time Password (OTP) for <strong>${purposeLabel}</strong> on Elite Fitness.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-note">This OTP is valid for ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes only</div>
    </div>
    <p>If you did not request this OTP, please ignore this email. Do not share this OTP with anyone.</p>
    <p>For security, Elite Fitness staff will never ask for your OTP.</p>
  `;

  return sendEmail(email, `${otp} is your Elite Fitness OTP`, emailTemplate(purposeLabel, content));
}

async function sendWelcomeEmail(email, memberName, registrationId, planName, expiryDate) {
  const content = `
    <h2>Welcome to Elite Fitness! 🎉</h2>
    <p>Dear <strong>${memberName}</strong>,</p>
    <p>Your registration at <strong>Elite Fitness</strong> is confirmed! We are excited to have you as part of our fitness family.</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Registration ID</span><span class="info-value">${registrationId}</span></div>
      <div class="info-row"><span class="info-label">Membership Plan</span><span class="info-value">${planName}</span></div>
      <div class="info-row"><span class="info-label">Valid Until</span><span class="info-value">${expiryDate}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge-success">Active</span></span></div>
    </div>
    <p>Download the <strong>Elite Fitness App</strong> to track your workouts, diet, attendance, and progress.</p>
    <p>See you at the gym! 💪</p>
  `;
  return sendEmail(email, 'Welcome to Elite Fitness - Registration Confirmed!', emailTemplate('Welcome', content));
}

async function sendMembershipExpiryEmail(email, memberName, planName, expiryDate, daysLeft) {
  const content = `
    <h2>Membership Expiry Reminder</h2>
    <p>Dear <strong>${memberName}</strong>,</p>
    <p>Your <strong>Elite Fitness</strong> membership is expiring soon. Renew now to continue your fitness journey without interruption.</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Membership Plan</span><span class="info-value">${planName}</span></div>
      <div class="info-row"><span class="info-label">Expiry Date</span><span class="info-value">${expiryDate}</span></div>
      <div class="info-row"><span class="info-label">Days Remaining</span><span class="info-value" style="color:#dc2626">${daysLeft} day(s)</span></div>
    </div>
    <p>To renew, visit Elite Fitness reception or use the Elite Fitness App.</p>
  `;
  return sendEmail(email, `Elite Fitness - Membership Expiring in ${daysLeft} Day(s)`, emailTemplate('Membership Expiry', content));
}

async function sendPaymentConfirmationEmail(email, memberName, amount, planName, invoiceNumber, paymentDate) {
  const content = `
    <h2>Payment Confirmed ✅</h2>
    <p>Dear <strong>${memberName}</strong>,</p>
    <p>Your payment for Elite Fitness membership has been received successfully.</p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Invoice Number</span><span class="info-value">${invoiceNumber}</span></div>
      <div class="info-row"><span class="info-label">Membership Plan</span><span class="info-value">${planName}</span></div>
      <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value">₹${amount}</span></div>
      <div class="info-row"><span class="info-label">Payment Date</span><span class="info-value">${paymentDate}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge-success">Success</span></span></div>
    </div>
    <p>Thank you for choosing Elite Fitness. Keep up the great work! 💪</p>
  `;
  return sendEmail(email, `Elite Fitness - Payment Confirmed ₹${amount}`, emailTemplate('Payment Confirmed', content));
}

module.exports = { sendEmail, sendOTPEmail, sendWelcomeEmail, sendMembershipExpiryEmail, sendPaymentConfirmationEmail };
