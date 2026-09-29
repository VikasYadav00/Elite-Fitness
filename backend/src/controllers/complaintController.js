// Elite Fitness - Complaint & Support Controller
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// In-memory cache for complaints (session-level fallback, like feedbacks)
let inMemoryComplaints = [];

// Auto-create complaints table if needed
async function ensureComplaintTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64),
        name VARCHAR(120),
        phone VARCHAR(25),
        category VARCHAR(80) DEFAULT 'OTHER',
        message TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'OPEN',
        owner_notes TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      )
    `);
  } catch (err) {
    // Fall through to in-memory store if DB unavailable
  }
}
ensureComplaintTable();

// POST /api/complaints - Public endpoint (from Universal QR complaint form)
async function submitComplaint(req, res) {
  const {
    name,
    phone,
    category = 'OTHER',
    message,
    customer_id
  } = req.body;

  if (!message || !message.trim()) {
    return errorResponse(res, 'Complaint message is required.', null, 400);
  }

  const id = `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newComplaint = {
    id,
    customer_id: customer_id || null,
    name: (name && name.trim()) || 'Anonymous Member',
    phone: phone || '',
    category: category || 'OTHER',
    message: message.trim(),
    status: 'OPEN',
    owner_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null
  };

  // Try DB first
  let dbSaved = false;
  try {
    await query(
      `INSERT INTO complaints (id, customer_id, name, phone, category, message, status, owner_notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        newComplaint.id,
        newComplaint.customer_id,
        newComplaint.name,
        newComplaint.phone,
        newComplaint.category,
        newComplaint.message,
        newComplaint.status,
        newComplaint.owner_notes
      ]
    );
    dbSaved = true;
  } catch (err) {
    console.error('[Complaint] DB insert failed, using in-memory fallback:', err.message);
  }

  inMemoryComplaints = [newComplaint, ...inMemoryComplaints];

  return successResponse(res, 'Your complaint has been submitted. We will respond shortly.', { ...newComplaint, dbSaved }, 201);
}

// GET /api/complaints - Owner retrieves all complaints
async function getComplaints(req, res) {
  try {
    const { rows } = await query(`SELECT * FROM complaints ORDER BY created_at DESC`);
    if (rows && rows.length > 0) {
      const map = new Map();
      rows.forEach(c => map.set(c.id, c));
      inMemoryComplaints.forEach(c => {
        if (!map.has(c.id)) map.set(c.id, c);
      });
      const all = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      return successResponse(res, 'Complaints retrieved', all);
    }
  } catch (err) {
    console.error('[Complaint] DB read failed, falling back to in-memory:', err.message);
  }

  const sorted = [...inMemoryComplaints].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  return successResponse(res, 'Complaints retrieved (in-memory fallback)', sorted);
}

// PATCH /api/complaints/:id/status - Owner updates complaint status / adds notes
async function updateComplaintStatus(req, res) {
  const { id } = req.params;
  const { status, owner_notes } = req.body;

  const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date().toISOString() : null;

  let updatedItem = null;
  inMemoryComplaints = inMemoryComplaints.map(c => {
    if (c.id === id) {
      updatedItem = {
        ...c,
        status: status !== undefined ? status : c.status,
        owner_notes: owner_notes !== undefined ? owner_notes : c.owner_notes,
        updated_at: new Date().toISOString(),
        resolved_at: resolvedAt || c.resolved_at
      };
      return updatedItem;
    }
    return c;
  });

  try {
    await query(
      `UPDATE complaints SET
         status = COALESCE($1, status),
         owner_notes = COALESCE($2, owner_notes),
         updated_at = NOW(),
         resolved_at = CASE WHEN $3 IS NOT NULL THEN $3::TIMESTAMP WITH TIME ZONE ELSE resolved_at END
       WHERE id = $4`,
      [status, owner_notes, resolvedAt, id]
    );
  } catch (_) {}

  return successResponse(res, 'Complaint updated', updatedItem || { id, status, owner_notes });
}

// DELETE /api/complaints/:id
async function deleteComplaint(req, res) {
  const { id } = req.params;
  inMemoryComplaints = inMemoryComplaints.filter(c => c.id !== id);
  try {
    await query(`DELETE FROM complaints WHERE id = $1`, [id]);
  } catch (_) {}
  return successResponse(res, 'Complaint deleted', { id });
}

// Ingest cloud sync complaint into memory & database
async function ingestCloudComplaint(data) {
  if (!data || !data.id) return;
  if (inMemoryComplaints.some(c => c.id === data.id)) return;

  const item = {
    id: data.id,
    customer_id: data.customer_id || null,
    name: (data.name && data.name.trim()) || 'Anonymous Member',
    phone: data.phone || '',
    category: data.category || 'OTHER',
    message: data.message || '',
    status: data.status || 'OPEN',
    owner_notes: data.owner_notes || '',
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    resolved_at: null
  };

  inMemoryComplaints = [item, ...inMemoryComplaints];

  try {
    await query(
      `INSERT INTO complaints (id, customer_id, name, phone, category, message, status, owner_notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [item.id, item.customer_id, item.name, item.phone, item.category, item.message, item.status, item.owner_notes]
    );
  } catch (_) {}
}

module.exports = {
  submitComplaint,
  getComplaints,
  updateComplaintStatus,
  deleteComplaint,
  ingestCloudComplaint
};
