// Cloud Sync Service for Elite Fitness
// Enables instant real-time synchronization between GitHub Pages (worldwide) and Owner App
export const CLOUD_SYNC_TOPIC = 'https://ntfy.sh/ef-cloud-sync-yadav4479365';

/**
 * Publish an event to the cloud sync stream (HTTPS - works from anywhere in the world on 4G/5G/Wi-Fi)
 * @param {'FEEDBACK_SUBMITTED' | 'ATTENDANCE_CHECKIN' | 'NEW_REGISTRATION'} event 
 * @param {object} data 
 */
export async function publishCloudEvent(event, data) {
  try {
    const payload = {
      event,
      data,
      sender: 'QR_WEB_PORTAL',
      timestamp: Date.now()
    };

    await fetch(CLOUD_SYNC_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Title': `Elite Fitness - ${event}`,
        'Priority': 'default'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Cloud sync publish note:', err);
    return false;
  }
}
