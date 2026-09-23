// Elite Fitness - Gym Settings Controller
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const QRCode = require('qrcode');

async function getSettings(req, res) {
  const { rows } = await query('SELECT * FROM gym_settings LIMIT 1');
  if (rows.length === 0) {
    return errorResponse(res, 'Settings not found.', null, 404);
  }
  return successResponse(res, 'Gym settings retrieved', rows[0]);
}

async function updateSettings(req, res) {
  const {
    gym_name, phone, whatsapp, email, address,
    opening_time, closing_time, weekly_holiday,
    instagram, facebook, other_social_links, logo_url
  } = req.body;

  const { rows } = await query(`
    UPDATE gym_settings SET
      gym_name = COALESCE($1, gym_name),
      phone = COALESCE($2, phone),
      whatsapp = COALESCE($3, whatsapp),
      email = COALESCE($4, email),
      address = COALESCE($5, address),
      opening_time = COALESCE($6, opening_time),
      closing_time = COALESCE($7, closing_time),
      weekly_holiday = COALESCE($8, weekly_holiday),
      instagram = COALESCE($9, instagram),
      facebook = COALESCE($10, facebook),
      other_social_links = COALESCE($11, other_social_links),
      logo_url = COALESCE($12, logo_url),
      updated_at = NOW()
    WHERE id = (SELECT id FROM gym_settings LIMIT 1)
    RETURNING *
  `, [gym_name, phone, whatsapp, email, address, opening_time, closing_time,
      weekly_holiday, instagram, facebook,
      other_social_links ? JSON.stringify(other_social_links) : null, logo_url]);

  if (rows.length === 0) {
    return errorResponse(res, 'Settings not found.', null, 404);
  }

  return successResponse(res, 'Gym settings updated', rows[0]);
}

// GET /api/settings/qr - Generate/get registration QR code
async function getRegistrationQR(req, res) {
  const registrationUrl = process.env.GYM_REGISTRATION_URL || 'http://localhost:3000/register';

  try {
    // Check if qrcode package is installed
    const qrDataUrl = await QRCode.toDataURL(registrationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    return successResponse(res, 'Registration QR code generated', {
      qrDataUrl,
      registrationUrl,
      gymName: 'Elite Fitness',
    });
  } catch (err) {
    // Fallback if qrcode not installed
    return successResponse(res, 'Registration QR details', {
      registrationUrl,
      gymName: 'Elite Fitness',
      note: 'Use any QR code generator with the registrationUrl to create the QR code.',
    });
  }
}

// GET /api/settings/public - Public gym info (no auth required)
async function getPublicSettings(req, res) {
  const { rows } = await query(
    `SELECT gym_name, phone, whatsapp, email, address, opening_time, closing_time,
            weekly_holiday, instagram, facebook, other_social_links, logo_url
     FROM gym_settings LIMIT 1`
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Gym settings not found.', null, 404);
  }

  return successResponse(res, 'Gym info retrieved', rows[0]);
}

const fs = require('fs');
const path = require('path');
const PAYMENT_SETTINGS_FILE = path.join(__dirname, '../../logs/payment_settings.json');

let inMemoryPaymentSettings = {
  payment_qr_url: '',
  payment_qr_label: 'Pay to Elite Fitness — Membership & Renewals',
  upi_id: '8953933110@paytm',
  merchant_name: 'Elite Fitness Club',
  allow_cash_on_qr: false // Security default: public QR requires online UPI
};

try {
  if (fs.existsSync(PAYMENT_SETTINGS_FILE)) {
    const raw = fs.readFileSync(PAYMENT_SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    inMemoryPaymentSettings = { ...inMemoryPaymentSettings, ...parsed };
  }
} catch (_) {}

// GET /api/settings/payment-qr - Get owner payment QR (public for members and owner)
async function getPaymentQR(req, res) {
  try {
    const { rows } = await query(`SELECT payment_qr_url, payment_qr_label FROM gym_settings LIMIT 1`);
    if (rows && rows.length > 0) {
      return successResponse(res, 'Payment QR retrieved', {
        payment_qr_url: rows[0].payment_qr_url || inMemoryPaymentSettings.payment_qr_url,
        payment_qr_label: rows[0].payment_qr_label || inMemoryPaymentSettings.payment_qr_label,
        upi_id: inMemoryPaymentSettings.upi_id || '8953933110@paytm',
        merchant_name: inMemoryPaymentSettings.merchant_name || 'Elite Fitness Club',
        allow_cash_on_qr: inMemoryPaymentSettings.allow_cash_on_qr ?? false
      });
    }
  } catch (_) {
    // Database connection note or preview mode
  }
  return successResponse(res, 'Payment QR retrieved (local)', inMemoryPaymentSettings);
}

// PUT /api/settings/payment-qr - Owner updates their UPI payment QR & details
async function updatePaymentQR(req, res) {
  const { payment_qr_url, payment_qr_label, upi_id, merchant_name, allow_cash_on_qr } = req.body;

  if (payment_qr_url !== undefined) inMemoryPaymentSettings.payment_qr_url = payment_qr_url;
  if (payment_qr_label !== undefined) inMemoryPaymentSettings.payment_qr_label = payment_qr_label;
  if (upi_id !== undefined) inMemoryPaymentSettings.upi_id = upi_id;
  if (merchant_name !== undefined) inMemoryPaymentSettings.merchant_name = merchant_name;
  if (allow_cash_on_qr !== undefined) inMemoryPaymentSettings.allow_cash_on_qr = Boolean(allow_cash_on_qr);

  try {
    fs.writeFileSync(PAYMENT_SETTINGS_FILE, JSON.stringify(inMemoryPaymentSettings, null, 2), 'utf8');
  } catch (_) {}

  try {
    await query(
      `UPDATE gym_settings SET
         payment_qr_url = COALESCE($1, payment_qr_url),
         payment_qr_label = COALESCE($2, payment_qr_label),
         updated_at = NOW()
       WHERE id = (SELECT id FROM gym_settings LIMIT 1)`,
      [payment_qr_url || null, payment_qr_label || null]
    );
  } catch (_) {}

  return successResponse(res, 'Payment QR updated successfully', inMemoryPaymentSettings);
}

module.exports = { getSettings, updateSettings, getRegistrationQR, getPublicSettings, getPaymentQR, updatePaymentQR };
