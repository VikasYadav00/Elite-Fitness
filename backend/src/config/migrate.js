// Elite Fitness - Complete PostgreSQL Schema Migration
const { query } = require('./database');
const logger = require('../utils/logger');

const migrations = [
  // =============================================
  // MIGRATION 001 - Core User Tables
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS gym_settings (
    id SERIAL PRIMARY KEY,
    gym_name VARCHAR(100) NOT NULL DEFAULT 'Elite Fitness',
    logo_url TEXT,
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    opening_time TIME DEFAULT '06:00:00',
    closing_time TIME DEFAULT '22:00:00',
    weekly_holiday VARCHAR(20) DEFAULT 'Sunday',
    instagram VARCHAR(200),
    facebook VARCHAR(200),
    other_social_links JSONB DEFAULT '{}',
    registration_qr_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('OWNER', 'TRAINER', 'CUSTOMER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    fcm_token TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  `,

  `
  CREATE TABLE IF NOT EXISTS otp_records (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('REGISTRATION', 'LOGIN', 'FORGOT_PASSWORD', 'PHONE_VERIFY')),
    attempts INTEGER DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_otp_identifier ON otp_records(identifier);
  CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_records(expires_at);
  `,

  // =============================================
  // MIGRATION 002 - Member & Trainer Tables
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS trainers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100),
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    profile_photo_url TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_trainer_user UNIQUE (user_id)
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_trainers_user ON trainers(user_id);
  CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers(status);
  `,

  `
  CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trainer_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    joining_date DATE DEFAULT CURRENT_DATE,
    registration_id VARCHAR(30) UNIQUE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
    profile_photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_member_user UNIQUE (user_id)
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
  CREATE INDEX IF NOT EXISTS idx_members_trainer ON members(trainer_id);
  CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
  CREATE INDEX IF NOT EXISTS idx_members_reg_id ON members(registration_id);
  `,

  // =============================================
  // MIGRATION 003 - Membership Tables
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS memberships (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    membership_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (membership_status IN ('ACTIVE', 'EXPIRED', 'FROZEN', 'CANCELLED')),
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_at TIMESTAMP WITH TIME ZONE,
    unfrozen_at TIMESTAMP WITH TIME ZONE,
    freeze_days INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_memberships_member ON memberships(member_id);
  CREATE INDEX IF NOT EXISTS idx_memberships_plan ON memberships(plan_id);
  CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(membership_status);
  CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
  `,

  // =============================================
  // MIGRATION 004 - Payments
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    membership_id INTEGER REFERENCES memberships(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'ONLINE', 'CARD', 'BANK_TRANSFER')),
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    gateway_signature TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_order ON payments(gateway_order_id) WHERE gateway_order_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_gateway_payment ON payments(gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
  `,

  // =============================================
  // MIGRATION 005 - Attendance
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    method VARCHAR(20) DEFAULT 'MANUAL' CHECK (method IN ('MANUAL', 'QR')),
    status VARCHAR(20) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_attendance_member_date UNIQUE (member_id, date)
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
  `,

  // =============================================
  // MIGRATION 006 - Exercises & Workouts
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    exercise_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    muscle_group VARCHAR(50),
    description TEXT,
    instructions TEXT,
    image_url TEXT,
    video_url TEXT,
    difficulty VARCHAR(20) DEFAULT 'BEGINNER' CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS workout_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    goal VARCHAR(50),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_plan_id INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER DEFAULT 3,
    reps VARCHAR(20) DEFAULT '10',
    weight_kg DECIMAL(5,2),
    rest_seconds INTEGER DEFAULT 60,
    day_of_week VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS member_workouts (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    workout_plan_id INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'INACTIVE')),
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_workout_exercises_plan ON workout_exercises(workout_plan_id);
  CREATE INDEX IF NOT EXISTS idx_member_workouts_member ON member_workouts(member_id);
  `,

  // =============================================
  // MIGRATION 007 - Diet Plans
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS diet_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    goal VARCHAR(50),
    total_calories INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS diet_meals (
    id SERIAL PRIMARY KEY,
    diet_plan_id INTEGER NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT')),
    meal_name VARCHAR(100),
    meal_time TIME,
    food_items TEXT,
    calories INTEGER DEFAULT 0,
    protein_g DECIMAL(5,2) DEFAULT 0,
    carbs_g DECIMAL(5,2) DEFAULT 0,
    fat_g DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS member_diets (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    diet_plan_id INTEGER NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'INACTIVE')),
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_diet_meals_plan ON diet_meals(diet_plan_id);
  CREATE INDEX IF NOT EXISTS idx_member_diets_member ON member_diets(member_id);
  `,

  // =============================================
  // MIGRATION 008 - Progress Tracking
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    recorded_date DATE DEFAULT CURRENT_DATE,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(4,2),
    body_fat_percent DECIMAL(4,2),
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    hips_cm DECIMAL(5,2),
    arms_cm DECIMAL(5,2),
    thighs_cm DECIMAL(5,2),
    calves_cm DECIMAL(5,2),
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS progress_photos (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    progress_id INTEGER REFERENCES progress(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(20) DEFAULT 'FRONT' CHECK (photo_type IN ('FRONT', 'BACK', 'SIDE', 'OTHER')),
    photo_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_progress_member ON progress(member_id);
  CREATE INDEX IF NOT EXISTS idx_progress_photos_member ON progress_photos(member_id);
  `,

  // =============================================
  // MIGRATION 009 - Leads & Expenses
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    interested_plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    follow_up_date DATE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'INTERESTED', 'JOINED', 'LOST')),
    converted_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('RENT', 'ELECTRICITY', 'WATER', 'TRAINER_SALARY', 'STAFF_SALARY', 'MAINTENANCE', 'EQUIPMENT', 'CLEANING', 'MARKETING', 'OTHER')),
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    payment_method VARCHAR(30) DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER')),
    receipt_url TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  `,

  // =============================================
  // MIGRATION 010 - Notifications, Offers, Announcements
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL' CHECK (type IN ('MEMBERSHIP_EXPIRY', 'PAYMENT', 'WORKOUT', 'DIET', 'ANNOUNCEMENT', 'OFFER', 'REGISTRATION', 'GENERAL')),
    is_read BOOLEAN DEFAULT FALSE,
    sent_via_fcm BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    notification_type VARCHAR(50),
    days_before_expiry INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_notif_log UNIQUE (member_id, notification_type, days_before_expiry)
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    applicable_plans JSONB DEFAULT '[]',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
    image_url TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    target_audience VARCHAR(20) DEFAULT 'ALL' CHECK (target_audience IN ('ALL', 'MEMBERS', 'TRAINERS')),
    is_pinned BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
  CREATE INDEX IF NOT EXISTS idx_offers_dates ON offers(start_date, end_date);
  `,

  // =============================================
  // MIGRATION 011 - Registrations (QR flow)
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    registration_id VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    selected_plan_id INTEGER REFERENCES membership_plans(id) ON DELETE SET NULL,
    payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    source VARCHAR(20) DEFAULT 'QR' CHECK (source IN ('QR', 'MANUAL', 'APP')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAYMENT_PENDING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  `,

  `
  CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
  CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
  `,

  // =============================================
  // MIGRATION 012 - Add FROZEN status to members
  // =============================================
  `
  DO $$
  BEGIN
    BEGIN
      ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE members ADD CONSTRAINT members_status_check
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED', 'FROZEN'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END;
  $$;
  `,

  // =============================================
  // MIGRATION 013 - Attendance Sessions (QR device-lock)
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    valid_for_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_att_sessions_token ON attendance_sessions(session_token);
  CREATE INDEX IF NOT EXISTS idx_att_sessions_date ON attendance_sessions(valid_for_date);
  `,

  `
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_token VARCHAR(100);
  `,

  // =============================================
  // MIGRATION 014 - Payment QR in gym_settings
  // =============================================
  `
  ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS payment_qr_url TEXT;
  ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS payment_qr_label VARCHAR(100) DEFAULT 'UPI Payment QR';
  `,

  // =============================================
  // MIGRATION 015 - Payment Requests (UTR flow)
  // =============================================
  `
  CREATE TABLE IF NOT EXISTS payment_requests (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES membership_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    utr_number VARCHAR(100),
    proof_note TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    activated_membership_id INTEGER REFERENCES memberships(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_payment_requests_member ON payment_requests(member_id);
  CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
  `,
];

async function runMigrations() {
  try {
    // Create migrations tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_index INTEGER NOT NULL UNIQUE,
        ran_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Get already ran migrations
    const { rows: ran } = await query('SELECT migration_index FROM schema_migrations ORDER BY migration_index');
    const ranIndexes = new Set(ran.map((r) => r.migration_index));

    let applied = 0;
    for (let i = 0; i < migrations.length; i++) {
      if (!ranIndexes.has(i)) {
        await query(migrations[i]);
        await query('INSERT INTO schema_migrations (migration_index) VALUES ($1)', [i]);
        applied++;
      }
    }

    if (applied > 0) {
      logger.info(`Applied ${applied} new database migration(s)`);
    } else {
      logger.info('Database schema is up to date');
    }

    // Insert default gym settings if not exists
    await query(`
      INSERT INTO gym_settings (gym_name, phone, email, address, opening_time, closing_time)
      SELECT 'Elite Fitness', '+91-9999999999', 'info@elitefitness.com', 'Elite Fitness, Your City', '06:00', '22:00'
      WHERE NOT EXISTS (SELECT 1 FROM gym_settings LIMIT 1);
    `);

    // Insert default membership plans if not exists
    await query(`
      INSERT INTO membership_plans (plan_name, duration_months, price, description, status)
      SELECT * FROM (VALUES
        ('Monthly', 1, 999.00, 'Access to all gym facilities for 1 month', 'ACTIVE'),
        ('Quarterly', 3, 2699.00, 'Access to all gym facilities for 3 months', 'ACTIVE'),
        ('Half-Yearly', 6, 4999.00, 'Access to all gym facilities for 6 months', 'ACTIVE'),
        ('Yearly', 12, 8999.00, 'Access to all gym facilities for 12 months with benefits', 'ACTIVE')
      ) AS plans(plan_name, duration_months, price, description, status)
      WHERE NOT EXISTS (SELECT 1 FROM membership_plans LIMIT 1);
    `);

  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}

module.exports = { runMigrations };
