// Elite Fitness - Feedback & Review Controller
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// In-memory cache — acts as a short-lived buffer within the current server process.
// NOTE: This resets on every server restart (Render free-tier sleep/wake cycles).
// Real persistence is the PostgreSQL DB. In-memory is only a within-session safety net.
let inMemoryFeedbacks = [];

// Helper to auto-create table if needed
async function ensureFeedbackTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120),
        phone VARCHAR(25),
        member_status VARCHAR(50) DEFAULT 'ACTIVE_MEMBER',
        rating INTEGER NOT NULL DEFAULT 5,
        cleanliness_rating INTEGER DEFAULT 5,
        equipment_rating INTEGER DEFAULT 5,
        trainer_rating INTEGER DEFAULT 5,
        category VARCHAR(60) DEFAULT 'GENERAL',
        comments TEXT,
        source VARCHAR(50) DEFAULT 'GOOGLE_LENS_QR',
        status VARCHAR(30) DEFAULT 'NEW',
        owner_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
  } catch (err) {
    // If table creation fails, in-memory store acts as bulletproof fallback
  }
}
ensureFeedbackTable();

// POST /api/feedback - Public endpoint (scanned from Google Lens / QR)
async function submitFeedback(req, res) {
  const {
    name,
    phone,
    member_status = 'ACTIVE_MEMBER',
    rating = 5,
    cleanliness_rating = 5,
    equipment_rating = 5,
    trainer_rating = 5,
    category = 'GENERAL',
    comments = '',
    source = 'GOOGLE_LENS_QR'
  } = req.body;

  const id = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newFeedback = {
    id,
    name: (name && name.trim()) || 'Gym Member (Anonymous)',
    phone: phone || '',
    member_status,
    rating: Number(rating) || 5,
    cleanliness_rating: Number(cleanliness_rating) || 5,
    equipment_rating: Number(equipment_rating) || 5,
    trainer_rating: Number(trainer_rating) || 5,
    category: category || 'GENERAL',
    comments: comments || '',
    source: source || 'GOOGLE_LENS_QR',
    status: 'NEW',
    owner_notes: '',
    created_at: new Date().toISOString()
  };

  // Try DB first — this is the primary persistent store
  let dbSaved = false;
  try {
    await query(
      `INSERT INTO feedbacks (id, name, phone, member_status, rating, cleanliness_rating, equipment_rating, trainer_rating, category, comments, source, status, owner_notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        newFeedback.id,
        newFeedback.name,
        newFeedback.phone,
        newFeedback.member_status,
        newFeedback.rating,
        newFeedback.cleanliness_rating,
        newFeedback.equipment_rating,
        newFeedback.trainer_rating,
        newFeedback.category,
        newFeedback.comments,
        newFeedback.source,
        newFeedback.status,
        newFeedback.owner_notes
      ]
    );
    dbSaved = true;
  } catch (err) {
    // DB unavailable — fall through to in-memory cache as session-level backup
    console.error('[Feedback] DB insert failed, using in-memory fallback:', err.message);
  }

  // Always prepend to in-memory store so GET works within this server session
  inMemoryFeedbacks = [newFeedback, ...inMemoryFeedbacks];

  return successResponse(res, 'Thank you! Your feedback has been submitted successfully.', { ...newFeedback, dbSaved }, 201);
}

// GET /api/feedback - Retrieve all feedbacks (Owner & Public review count)
async function getFeedbacks(req, res) {
  // Always try DB first — it is the authoritative, persistent store
  try {
    const { rows } = await query(`SELECT * FROM feedbacks ORDER BY created_at DESC`);
    if (rows && rows.length > 0) {
      // DB has data: return it directly, also merge any in-memory items not yet in DB
      const map = new Map();
      rows.forEach(f => map.set(f.id, f));
      // Add in-memory items that may not have reached DB yet (same session inserts)
      inMemoryFeedbacks.forEach(f => {
        if (!map.has(f.id)) map.set(f.id, f);
      });
      const all = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      return successResponse(res, 'Feedbacks retrieved', all);
    }
  } catch (err) {
    console.error('[Feedback] DB read failed, falling back to in-memory:', err.message);
  }

  // DB offline or empty — return whatever we have in-memory for this server session
  const sorted = [...inMemoryFeedbacks].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  return successResponse(res, 'Feedbacks retrieved (in-memory fallback)', sorted);
}

// PATCH /api/feedback/:id/status - Update feedback status / owner note
async function updateFeedbackStatus(req, res) {
  const { id } = req.params;
  const { status, owner_notes } = req.body;

  let updatedItem = null;
  inMemoryFeedbacks = inMemoryFeedbacks.map(f => {
    if (f.id === id) {
      updatedItem = {
        ...f,
        status: status !== undefined ? status : f.status,
        owner_notes: owner_notes !== undefined ? owner_notes : f.owner_notes
      };
      return updatedItem;
    }
    return f;
  });

  try {
    await query(
      `UPDATE feedbacks SET
         status = COALESCE($1, status),
         owner_notes = COALESCE($2, owner_notes)
       WHERE id = $3`,
      [status, owner_notes, id]
    );
  } catch (_) {}

  return successResponse(res, 'Feedback updated', updatedItem || { id, status, owner_notes });
}

// DELETE /api/feedback/:id - Delete feedback
async function deleteFeedback(req, res) {
  const { id } = req.params;
  inMemoryFeedbacks = inMemoryFeedbacks.filter(f => f.id !== id);
  try {
    await query(`DELETE FROM feedbacks WHERE id = $1`, [id]);
  } catch (_) {}
  return successResponse(res, 'Feedback deleted', { id });
}

// Ingest cloud sync feedback into memory & database
async function ingestCloudFeedback(data) {
  if (!data || !data.id) return;
  if (inMemoryFeedbacks.some(f => f.id === data.id)) return;

  const item = {
    id: data.id,
    name: (data.name && data.name.trim()) || 'Gym Member',
    phone: data.phone || '',
    member_status: data.member_status || 'ACTIVE_MEMBER',
    rating: Number(data.rating) || 5,
    cleanliness_rating: Number(data.cleanliness_rating) || 5,
    equipment_rating: Number(data.equipment_rating) || 5,
    trainer_rating: Number(data.trainer_rating) || 5,
    category: data.category || 'GENERAL',
    comments: data.comments || '',
    source: data.source || 'GOOGLE_LENS_QR',
    status: data.status || 'NEW',
    owner_notes: data.owner_notes || '',
    created_at: data.created_at || new Date().toISOString()
  };

  inMemoryFeedbacks = [item, ...inMemoryFeedbacks];

  try {
    await query(
      `INSERT INTO feedbacks (id, name, phone, member_status, rating, cleanliness_rating, equipment_rating, trainer_rating, category, comments, source, status, owner_notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [item.id, item.name, item.phone, item.member_status, item.rating, item.cleanliness_rating, item.equipment_rating, item.trainer_rating, item.category, item.comments, item.source, item.status, item.owner_notes]
    );
  } catch (_) {}
}

module.exports = {
  submitFeedback,
  getFeedbacks,
  updateFeedbackStatus,
  deleteFeedback,
  ingestCloudFeedback
};
