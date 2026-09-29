// Cloud Sync Service for Elite Fitness
// Enables instant real-time synchronization between GitHub Pages (worldwide) and Owner App
export const CLOUD_SYNC_TOPIC = 'https://ntfy.sh/ef-cloud-sync-yadav4479365';

/**
 * Publish an event to the cloud sync stream (HTTPS - works from anywhere in the world on 4G/5G/Wi-Fi)
 * @param {'FEEDBACK_SUBMITTED' | 'ATTENDANCE_CHECKIN' | 'NEW_REGISTRATION' | 'COMPLAINT_SUBMITTED' | 'PAYMENT_VERIFIED'} event 
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

    const res = await fetch(CLOUD_SYNC_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Title': `Elite Fitness - ${event}`,
        'Priority': 'default'
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud sync publish error:', err);
    return false;
  }
}

/**
 * Fetch recent cloud events from topic
 * @param {string} since - e.g. '24h', '1h', '10m'
 */
export async function fetchCloudEvents(since = '24h') {
  try {
    const res = await fetch(`${CLOUD_SYNC_TOPIC}/json?poll=1&since=${since}`);
    if (!res.ok) return [];

    const text = await res.text();
    if (!text || !text.trim()) return [];

    const lines = text.trim().split('\n').filter(Boolean);
    const events = [];

    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.event === 'message' && item.message) {
          const parsed = typeof item.message === 'string' ? JSON.parse(item.message) : item.message;
          if (parsed && parsed.event && parsed.data) {
            events.push({
              event: parsed.event,
              data: parsed.data,
              id: item.id || parsed.data.id,
              time: item.time || Date.now(),
              sender: parsed.sender
            });
          }
        }
      } catch (_) {}
    }
    return events;
  } catch (err) {
    console.warn('fetchCloudEvents error:', err);
    return [];
  }
}

/**
 * Subscribe to the cloud SSE stream for instant real-time live events (0ms latency)
 * @param {(event: { event: string, data: any, sender?: string }) => void} onEvent
 * @returns {() => void} Unsubscribe function
 */
export function subscribeCloudStream(onEvent) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource = null;
  try {
    eventSource = new EventSource(`${CLOUD_SYNC_TOPIC}/sse`);

    eventSource.onmessage = (e) => {
      try {
        const item = JSON.parse(e.data);
        if (item.event === 'message' && item.message) {
          const parsed = typeof item.message === 'string' ? JSON.parse(item.message) : item.message;
          if (parsed && parsed.event && parsed.data) {
            onEvent(parsed);
          }
        }
      } catch (_) {}
    };

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };
  } catch (_) {}

  return () => {
    if (eventSource) {
      try {
        eventSource.close();
      } catch (_) {}
    }
  };
}
