// Cloud Sync Consumer for Elite Fitness Owner App
// Fetches real-time events published from the GitHub Pages QR portal (works worldwide)

export const CLOUD_SYNC_TOPIC = 'https://ntfy.sh/ef-cloud-sync-yadav4479365';

/**
 * Fetch all recent events from the cloud sync channel (e.g. past 24 hours)
 * @param {string} since - e.g. '24h', '1h', '10m', 'all'
 * @returns {Promise<Array<{ event: string, data: any, id: string, time: number }>>}
 */
export async function fetchCloudEvents(since = '24h') {
  try {
    const res = await fetch(`${CLOUD_SYNC_TOPIC}/json?poll=1&since=${since}`, {
      headers: {
        'Accept': 'application/x-ndjson'
      }
    });

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
 * Subscribe to the cloud SSE stream for instant real-time live events (0 latency)
 * @param {(event: { event: string, data: any }) => void} onEvent
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

/**
 * Publish an event to cloud sync (if Owner App needs to broadcast)
 */
export async function publishCloudEvent(event, data) {
  try {
    await fetch(CLOUD_SYNC_TOPIC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Title': `Elite Fitness - ${event}`
      },
      body: JSON.stringify({
        event,
        data,
        sender: 'OWNER_APP',
        timestamp: Date.now()
      })
    });
    return true;
  } catch (_) {
    return false;
  }
}
