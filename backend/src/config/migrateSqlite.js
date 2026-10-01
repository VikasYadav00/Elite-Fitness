// SQLite column and index migration script
const { query } = require('./database');

async function migrate() {
  const tables = [
    'users', 'members', 'memberships', 'payments',
    'payment_requests', 'expenses', 'registrations',
    'attendance', 'membership_plans'
  ];

  for (const t of tables) {
    try {
      const cols = await query("PRAGMA table_info(" + t + ")");
      const colNames = cols.rows.map(c => c.name);
      if (!colNames.includes('updated_at')) {
        await query("ALTER TABLE " + t + " ADD COLUMN updated_at TEXT DEFAULT NULL");
        console.log("Added updated_at to " + t);
      }
    } catch (e) {
      console.warn("Migration warning for " + t + ":", e.message);
    }
  }

  // Ensure unique indexes
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, date)');
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id)');
  await query('CREATE UNIQUE INDEX IF NOT EXISTS idx_members_registration_id ON members(registration_id)');
  console.log('All migrations and constraints verified!');
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
