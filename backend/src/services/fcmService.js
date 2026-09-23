// Elite Fitness - Firebase Cloud Messaging Service
const logger = require('../utils/logger');
const { query } = require('../config/database');

let firebaseAdmin = null;

function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    try {
      const admin = require('firebase-admin');

      if (!admin.apps.length) {
        const firebaseConfig = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        // Only initialize if real credentials exist
        if (firebaseConfig.projectId && firebaseConfig.projectId !== 'placeholder') {
          admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
          });
          firebaseAdmin = admin;
          logger.info('Firebase Admin initialized successfully');
        } else {
          logger.warn('Firebase credentials not configured - FCM notifications disabled');
        }
      } else {
        firebaseAdmin = admin;
      }
    } catch (err) {
      logger.error('Firebase initialization error:', err.message);
    }
  }
  return firebaseAdmin;
}

async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!fcmToken) return false;

  const admin = getFirebaseAdmin();
  if (!admin) {
    logger.warn('Firebase not initialized - skipping push notification');
    return false;
  }

  try {
    const message = {
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      token: fcmToken,
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'elite_fitness_channel',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info(`FCM notification sent: ${response}`);
    return true;
  } catch (error) {
    logger.error('FCM notification error:', error.message);
    return false;
  }
}

async function sendNotificationToUser(userId, title, body, type = 'GENERAL', data = {}) {
  // Store notification in database
  await query(
    `INSERT INTO notifications (user_id, title, body, type, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, body, type, JSON.stringify(data)]
  );

  // Get FCM token
  const { rows } = await query('SELECT fcm_token FROM users WHERE id = $1', [userId]);

  if (rows.length > 0 && rows[0].fcm_token) {
    await sendPushNotification(rows[0].fcm_token, title, body, {
      type,
      ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  }
}

async function sendNotificationToAllMembers(title, body, type = 'ANNOUNCEMENT', data = {}) {
  const { rows } = await query(
    `SELECT u.id, u.fcm_token FROM users u
     INNER JOIN members m ON m.user_id = u.id
     WHERE u.status = 'ACTIVE' AND m.status = 'ACTIVE'`
  );

  const promises = rows.map(async (user) => {
    await query(
      `INSERT INTO notifications (user_id, title, body, type, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, title, body, type, JSON.stringify(data)]
    );

    if (user.fcm_token) {
      await sendPushNotification(user.fcm_token, title, body, {
        type,
        ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
    }
  });

  await Promise.allSettled(promises);
  logger.info(`Broadcast notification sent to ${rows.length} members`);
}

module.exports = {
  sendPushNotification,
  sendNotificationToUser,
  sendNotificationToAllMembers,
};
