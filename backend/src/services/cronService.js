// Elite Fitness - Scheduled Cron Jobs
const cron = require('node-cron');
const { query } = require('../config/database');
const { sendNotificationToUser } = require('./fcmService');
const logger = require('../utils/logger');

function initCronJobs() {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    logger.info('⏰ Running daily scheduled membership status and notification job...');

    try {
      // 1. Mark expired memberships
      const { rowCount: expiredCount } = await query(
        `UPDATE memberships SET membership_status = 'EXPIRED', updated_at = NOW()
         WHERE membership_status = 'ACTIVE' AND end_date < CURRENT_DATE`
      );
      logger.info(`Updated ${expiredCount} expired memberships.`);

      // 2. Mark inactive members without active memberships
      await query(
        `UPDATE members SET status = 'EXPIRED', updated_at = NOW()
         WHERE status = 'ACTIVE' AND id NOT IN (
           SELECT member_id FROM memberships WHERE membership_status = 'ACTIVE'
         )`
      );

      // 3. Send FCM expiry alerts (3 days remaining)
      const { rows: expiring3Days } = await query(
        `SELECT mb.end_date, u.id as user_id, u.full_name
         FROM memberships mb
         INNER JOIN members m ON m.id = mb.member_id
         INNER JOIN users u ON u.id = m.user_id
         WHERE mb.membership_status = 'ACTIVE'
           AND mb.end_date = CURRENT_DATE + INTERVAL '3 days'`
      );

      for (const member of expiring3Days) {
        await sendNotificationToUser(
          member.user_id,
          'Membership Expiring Soon! ⏳',
          `Hi ${member.full_name}, your Elite Fitness membership expires in 3 days. Renew now to stay fit!`,
          'MEMBERSHIP_EXPIRING'
        );
      }

      // 4. Send FCM expiry alerts (1 day remaining)
      const { rows: expiring1Day } = await query(
        `SELECT mb.end_date, u.id as user_id, u.full_name
         FROM memberships mb
         INNER JOIN members m ON m.id = mb.member_id
         INNER JOIN users u ON u.id = m.user_id
         WHERE mb.membership_status = 'ACTIVE'
           AND mb.end_date = CURRENT_DATE + INTERVAL '1 day'`
      );

      for (const member of expiring1Day) {
        await sendNotificationToUser(
          member.user_id,
          'Final Reminder: Membership Expiring Tomorrow! 🚨',
          `Hi ${member.full_name}, your Elite Fitness membership expires tomorrow. Tap to renew!`,
          'MEMBERSHIP_EXPIRING'
        );
      }

      logger.info('✅ Scheduled membership job completed successfully.');
    } catch (err) {
      logger.error('❌ Error running scheduled membership job:', err.message);
    }
  });

  logger.info('🚀 Scheduled jobs initialized (Node-Cron).');
}

module.exports = { initCronJobs };
