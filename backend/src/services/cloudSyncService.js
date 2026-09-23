// Cloud Sync Background Poller for Backend
// Ensures backend memory & PostgreSQL database remain synchronized with worldwide GitHub Pages events
const https = require('https');
const logger = require('../utils/logger');
const { ingestCloudFeedback } = require('../controllers/feedbackController');
const { ingestCloudAttendance } = require('../controllers/attendanceController');

const SYNC_URL = 'https://ntfy.sh/ef-cloud-sync-yadav4479365/json?poll=1&since=1h';

let isPolling = false;

async function pollCloudSync() {
  if (isPolling) return;
  isPolling = true;

  try {
    const raw = await new Promise((resolve, reject) => {
      const req = https.get(SYNC_URL, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        resolve('');
      });
    });

    if (!raw || !raw.trim()) {
      isPolling = false;
      return;
    }

    const lines = raw.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.event === 'message' && item.message) {
          const parsed = typeof item.message === 'string' ? JSON.parse(item.message) : item.message;
          if (parsed && parsed.event && parsed.data) {
            if (parsed.event === 'FEEDBACK_SUBMITTED') {
              await ingestCloudFeedback(parsed.data);
            } else if (parsed.event === 'ATTENDANCE_CHECKIN') {
              await ingestCloudAttendance(parsed.data);
            }
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    // Non-blocking network error (e.g. PC offline)
  } finally {
    isPolling = false;
  }
}

function initCloudSyncService() {
  logger.info('☁️ Cloud Sync Service initialized (syncing worldwide QR events with backend)');
  // Poll immediately on start
  pollCloudSync();
  // Poll every 10 seconds
  setInterval(pollCloudSync, 10000);
}

module.exports = {
  initCloudSyncService,
  pollCloudSync
};
