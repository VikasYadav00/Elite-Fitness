// Elite Fitness - Database Seeder
const bcrypt = require('bcryptjs');
const { query } = require('./database');
const logger = require('../utils/logger');

async function seedDatabase() {
  logger.info('🌱 Seeding sample data for Elite Fitness...');

  try {
    // 1. Create Default Owner Account if missing
    const ownerPassword = await bcrypt.hash('admin123', 12);
    const { rows: ownerUser } = await query(
      `INSERT INTO users (full_name, phone, email, password_hash, role, status)
       VALUES ('Elite Fitness Owner', '9999999999', 'owner@elitefitness.com', $1, 'OWNER', 'ACTIVE')
       ON CONFLICT (phone) DO UPDATE SET role = 'OWNER'
       RETURNING id`,
      [ownerPassword]
    );

    // 2. Create Sample Trainer
    const trainerPassword = await bcrypt.hash('trainer123', 12);
    const { rows: trainerUser } = await query(
      `INSERT INTO users (full_name, phone, email, password_hash, role, status)
       VALUES ('Vikram Rajput', '9876500112', 'trainer@elitefitness.com', $1, 'TRAINER', 'ACTIVE')
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [trainerPassword]
    );

    if (trainerUser.length > 0) {
      await query(
        `INSERT INTO trainers (user_id, specialization, experience_years, bio, status)
         VALUES ($1, 'Bodybuilding & Powerlifting', 6, 'Certified Fitness Coach with 6 years experience.', 'ACTIVE')
         ON CONFLICT (user_id) DO NOTHING`,
        [trainerUser[0].id]
      );
    }

    // 3. Create Sample Member
    const memberPassword = await bcrypt.hash('member123', 12);
    const { rows: memberUser } = await query(
      `INSERT INTO users (full_name, phone, email, password_hash, role, status)
       VALUES ('Rahul Sharma', '9876543210', 'rahul@example.com', $1, 'CUSTOMER', 'ACTIVE')
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      [memberPassword]
    );

    if (memberUser.length > 0) {
      const { rows: memberRow } = await query(
        `INSERT INTO members (user_id, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, registration_id, status)
         VALUES ($1, '1998-05-15', 'MALE', 'Sector 18, Commercial Hub', 'Sunil Sharma', '9876500999', 'EF26091001', 'ACTIVE')
         ON CONFLICT (user_id) DO NOTHING
         RETURNING id`,
        [memberUser[0].id]
      );

      if (memberRow.length > 0) {
        // Get plan ID
        const { rows: planRows } = await query('SELECT id FROM membership_plans LIMIT 1');
        if (planRows.length > 0) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 3);

          await query(
            `INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
             VALUES ($1, $2, $3, $4, 2699.00, 'PAID', 'ACTIVE')`,
            [memberRow[0].id, planRows[0].id, startDate, endDate]
          );
        }
      }
    }

    // 4. Create Sample Exercises
    const sampleExercises = [
      ['Barbell Bench Press', 'Chest', 'Pectorals', 'Intermediate'],
      ['Incline Dumbbell Press', 'Chest', 'Upper Pectorals', 'Intermediate'],
      ['Barbell Squats', 'Legs', 'Quadriceps', 'Advanced'],
      ['Romanian Deadlift', 'Legs', 'Hamstrings', 'Intermediate'],
      ['Lat Pulldown', 'Back', 'Latissimus Dorsi', 'Beginner'],
      ['Overhead Shoulder Press', 'Shoulders', 'Deltoids', 'Intermediate'],
      ['Dumbbell Bicep Curls', 'Arms', 'Biceps', 'Beginner'],
      ['Tricep Rope Pushdown', 'Arms', 'Triceps', 'Beginner']
    ];

    for (const [name, cat, muscle, diff] of sampleExercises) {
      await query(
        `INSERT INTO exercises (exercise_name, category, muscle_group, difficulty, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         ON CONFLICT DO NOTHING`,
        [name, cat, muscle, diff]
      );
    }

    logger.info('✅ Sample data seeding completed successfully!');
  } catch (err) {
    logger.error('❌ Seeding error:', err.message);
  }
}

module.exports = { seedDatabase };
