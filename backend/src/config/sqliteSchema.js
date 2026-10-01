// Elite Fitness - SQLite Fallback Schema & Initializer
// Ensures identical database schema and relationships when PostgreSQL is offline
const path = require('path');
const fs = require('fs');

function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gym_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_name TEXT NOT NULL DEFAULT 'Elite Fitness',
      logo_url TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      opening_time TEXT DEFAULT '06:00:00',
      closing_time TEXT DEFAULT '22:00:00',
      weekly_holiday TEXT DEFAULT 'Sunday',
      instagram TEXT,
      facebook TEXT,
      other_social_links TEXT DEFAULT '{}',
      registration_qr_url TEXT,
      payment_qr_url TEXT,
      payment_qr_label TEXT DEFAULT 'UPI Payment QR',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      email_verified INTEGER DEFAULT 0,
      phone_verified INTEGER DEFAULT 0,
      fcm_token TEXT,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      is_used INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      specialization TEXT,
      experience_years INTEGER DEFAULT 0,
      bio TEXT,
      profile_photo_url TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      trainer_id INTEGER,
      date_of_birth TEXT,
      gender TEXT,
      blood_group TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      joining_date TEXT DEFAULT (date('now')),
      registration_id TEXT UNIQUE,
      medical_conditions TEXT,
      fitness_goals TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'ACTIVE',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS membership_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_name TEXT NOT NULL,
      duration_months INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      features TEXT DEFAULT '[]',
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      price_paid REAL NOT NULL,
      payment_status TEXT DEFAULT 'PENDING',
      membership_status TEXT DEFAULT 'ACTIVE',
      is_frozen INTEGER DEFAULT 0,
      frozen_at TEXT,
      unfrozen_at TEXT,
      freeze_days INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(plan_id) REFERENCES membership_plans(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      membership_id INTEGER,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      payment_method TEXT NOT NULL,
      gateway_order_id TEXT,
      gateway_payment_id TEXT,
      gateway_signature TEXT,
      invoice_number TEXT UNIQUE,
      status TEXT DEFAULT 'PENDING',
      payment_date TEXT,
      notes TEXT,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE SET NULL,
      FOREIGN KEY(membership_id) REFERENCES memberships(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      date TEXT NOT NULL DEFAULT (date('now')),
      check_in_time TEXT,
      check_out_time TEXT,
      method TEXT DEFAULT 'MANUAL',
      status TEXT DEFAULT 'PRESENT',
      device_fingerprint TEXT,
      session_token TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(member_id, date),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT NOT NULL UNIQUE,
      created_by INTEGER,
      valid_for_date TEXT NOT NULL DEFAULT (date('now')),
      expires_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      utr_number TEXT,
      proof_note TEXT,
      status TEXT DEFAULT 'PENDING',
      submitted_at TEXT DEFAULT (datetime('now')),
      verified_at TEXT,
      verified_by INTEGER,
      rejection_reason TEXT,
      activated_membership_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(plan_id) REFERENCES membership_plans(id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      date_of_birth TEXT,
      gender TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      selected_plan_id INTEGER,
      payment_id INTEGER,
      member_id INTEGER,
      source TEXT DEFAULT 'QR',
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL DEFAULT (date('now')),
      description TEXT,
      payment_method TEXT DEFAULT 'CASH',
      receipt_url TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      member_status TEXT DEFAULT 'ACTIVE_MEMBER',
      rating INTEGER NOT NULL DEFAULT 5,
      cleanliness_rating INTEGER DEFAULT 5,
      equipment_rating INTEGER DEFAULT 5,
      trainer_rating INTEGER DEFAULT 5,
      category TEXT DEFAULT 'GENERAL',
      comments TEXT,
      source TEXT DEFAULT 'GOOGLE_LENS_QR',
      status TEXT DEFAULT 'NEW',
      owner_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      name TEXT,
      phone TEXT,
      category TEXT DEFAULT 'OTHER',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'OPEN',
      owner_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      interested_plan_id INTEGER,
      follow_up_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'NEW',
      converted_member_id INTEGER,
      assigned_to INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_name TEXT NOT NULL,
      category TEXT,
      muscle_group TEXT,
      description TEXT,
      instructions TEXT,
      image_url TEXT,
      video_url TEXT,
      difficulty TEXT DEFAULT 'BEGINNER',
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      goal TEXT,
      created_by INTEGER,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_plan_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      sets INTEGER DEFAULT 3,
      reps TEXT DEFAULT '10',
      weight_kg REAL,
      rest_seconds INTEGER DEFAULT 60,
      day_of_week TEXT,
      order_index INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
      FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS member_workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      workout_plan_id INTEGER NOT NULL,
      assigned_date TEXT DEFAULT (date('now')),
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'ACTIVE',
      assigned_by INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      goal TEXT,
      total_calories INTEGER,
      created_by INTEGER,
      status TEXT DEFAULT 'ACTIVE',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diet_meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diet_plan_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      meal_name TEXT,
      meal_time TEXT,
      food_items TEXT,
      calories INTEGER DEFAULT 0,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      notes TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS member_diets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      diet_plan_id INTEGER NOT NULL,
      start_date TEXT DEFAULT (date('now')),
      end_date TEXT,
      status TEXT DEFAULT 'ACTIVE',
      assigned_by INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY(diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT DEFAULT 'GENERAL',
      is_read INTEGER DEFAULT 0,
      sent_via_fcm INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Ensure default plans exist
  const countPlans = db.prepare('SELECT COUNT(*) as c FROM membership_plans').get().c;
  if (countPlans === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO membership_plans (plan_name, duration_months, price, description, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `);
    insertPlan.run('Monthly Transformation Pass', 1, 999.00, 'Access to all gym facilities for 1 month');
    insertPlan.run('Quarterly Beast Mode', 3, 2699.00, 'Access to all gym facilities for 3 months');
    insertPlan.run('Half-Yearly Elite Pass', 6, 4999.00, 'Access to all gym facilities for 6 months');
    insertPlan.run('Annual Champion Membership', 12, 8999.00, 'Access to all gym facilities for 12 months with benefits');
  }

  // Ensure default gym settings exist
  const countSettings = db.prepare('SELECT COUNT(*) as c FROM gym_settings').get().c;
  if (countSettings === 0) {
    db.prepare(`
      INSERT INTO gym_settings (gym_name, phone, email, address, opening_time, closing_time)
      VALUES ('Elite Fitness', '+91-8953933110', 'info@elitefitness.com', 'Sector 14, Lucknow', '06:00', '22:00')
    `).run();
  }

  // Seed default members if members table is empty or has only 1
  const countMembers = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
  if (countMembers < 3) {
    const seedMembers = [
      { name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@example.com', planId: 2, planName: 'Quarterly Beast Mode', price: 2699, duration: 3, regId: 'EF26091001', gender: 'MALE', status: 'ACTIVE' },
      { name: 'Priya Verma', phone: '9812345678', email: 'priya@example.com', planId: 1, planName: 'Monthly Transformation Pass', price: 999, duration: 1, regId: 'EF26091002', gender: 'FEMALE', status: 'ACTIVE' },
      { name: 'Amit Patel', phone: '9765432109', email: 'amit@example.com', planId: 1, planName: 'Monthly Transformation Pass', price: 999, duration: 1, regId: 'EF26091003', gender: 'MALE', status: 'ACTIVE' },
      { name: 'Sneha Gupta', phone: '9988776655', email: 'sneha@example.com', planId: 4, planName: 'Annual Champion Membership', price: 8999, duration: 12, regId: 'EF26091004', gender: 'FEMALE', status: 'ACTIVE' },
      { name: 'Vikram Singh', phone: '9123456789', email: 'vikram@example.com', planId: 3, planName: 'Half-Yearly Elite Pass', price: 4999, duration: 6, regId: 'EF26091005', gender: 'MALE', status: 'ACTIVE' },
      { name: 'Ananya Deshmukh', phone: '9845123456', email: 'ananya@example.com', planId: 4, planName: 'Annual Champion Membership', price: 8999, duration: 12, regId: 'EF26091006', gender: 'FEMALE', status: 'ACTIVE' }
    ];

    for (const sm of seedMembers) {
      try {
        const existingU = db.prepare('SELECT id FROM users WHERE phone = ?').get(sm.phone);
        let uId;
        if (existingU) {
          uId = existingU.id;
        } else {
          const uRes = db.prepare(`
            INSERT INTO users (full_name, phone, email, password_hash, role, status, email_verified, phone_verified)
            VALUES (?, ?, ?, '$2b$10$hrb6EA6KyB1XN0GzywaZ4.n.gaoE3.Hn4hqDopq9TwfnRh49DewCq', 'CUSTOMER', 'ACTIVE', 1, 1)
          `).run(sm.name, sm.phone, sm.email);
          uId = uRes.lastInsertRowid;
        }

        const existingM = db.prepare('SELECT id FROM members WHERE user_id = ?').get(uId);
        let mId;
        if (existingM) {
          mId = existingM.id;
        } else {
          const mRes = db.prepare(`
            INSERT INTO members (user_id, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, registration_id, status, joining_date)
            VALUES (?, '1996-01-01', ?, 'Sector 14, Lucknow', 'Emergency Contact', '9999999999', ?, ?, date('now'))
          `).run(uId, sm.gender, sm.regId, sm.status);
          mId = mRes.lastInsertRowid;
        }

        const existingMb = db.prepare('SELECT id FROM memberships WHERE member_id = ?').get(mId);
        let mbId;
        if (existingMb) {
          mbId = existingMb.id;
        } else {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + sm.duration);
          const endDateStr = endDate.toISOString().split('T')[0];
          const mbRes = db.prepare(`
            INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
            VALUES (?, ?, date('now'), ?, ?, 'PAID', 'ACTIVE')
          `).run(mId, sm.planId, endDateStr, sm.price);
          mbId = mbRes.lastInsertRowid;
        }

        const existingP = db.prepare('SELECT id FROM payments WHERE member_id = ?').get(mId);
        if (!existingP) {
          db.prepare(`
            INSERT INTO payments (member_id, membership_id, amount, payment_method, invoice_number, status, payment_date, notes)
            VALUES (?, ?, ?, 'UPI', ?, 'SUCCESS', datetime('now'), 'Initial Membership Payment')
          `).run(mId, mbId, sm.price, `EF-INV-${sm.regId}`);
        }
      } catch (seedErr) {
        // Skip duplicate
      }
    }
  }

  // Seed default expenses if empty
  const countExpenses = db.prepare('SELECT COUNT(*) as c FROM expenses').get().c;
  if (countExpenses === 0) {
    db.prepare(`
      INSERT INTO expenses (category, amount, expense_date, description, payment_method)
      VALUES
        ('RENT', 45000, date('now', '-5 days'), 'Monthly Gym Rent', 'BANK_TRANSFER'),
        ('TRAINER_SALARY', 60000, date('now', '-10 days'), 'Trainer Salaries for Current Month', 'BANK_TRANSFER'),
        ('MAINTENANCE', 8500, date('now', '-2 days'), 'Cardio Equipment Servicing and Lubrication', 'UPI')
    `).run();
  }

  // Seed trainers if empty
  const countTrainers = db.prepare('SELECT COUNT(*) as c FROM trainers').get().c;
  if (countTrainers === 0) {
    const seedTrainers = [
      { name: 'Vikram Rajput', phone: '9876500112', email: 'vikram.t@elitefitness.com', specialization: 'Bodybuilding & Powerlifting', exp: 6, bio: 'Ex-national powerlifter with a passion for strength training.' },
      { name: 'Ananya Roy', phone: '9876500113', email: 'ananya.t@elitefitness.com', specialization: 'CrossFit & Functional Training', exp: 4, bio: 'Certified CrossFit Level-2 coach focused on endurance and mobility.' },
      { name: 'Karan Mehra', phone: '9876500114', email: 'karan.t@elitefitness.com', specialization: 'Weight Loss & Transformation', exp: 5, bio: 'Specializes in body recomposition and metabolic conditioning.' }
    ];
    for (const st of seedTrainers) {
      try {
        const uRes = db.prepare(`
          INSERT INTO users (full_name, phone, email, password_hash, role, status, email_verified, phone_verified)
          VALUES (?, ?, ?, '$2b$10$hrb6EA6KyB1XN0GzywaZ4.n.gaoE3.Hn4hqDopq9TwfnRh49DewCq', 'TRAINER', 'ACTIVE', 1, 1)
        `).run(st.name, st.phone, st.email);
        db.prepare(`
          INSERT INTO trainers (user_id, specialization, experience_years, bio, status)
          VALUES (?, ?, ?, ?, 'ACTIVE')
        `).run(uRes.lastInsertRowid, st.specialization, st.exp, st.bio);
      } catch (_) {}
    }
  }
}

module.exports = { initSqliteSchema };
