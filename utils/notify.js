/**
 * Fire-and-forget notify to server-side Telegram bridge.
 * Never sends bot token from the client.
 */
export async function notifyInviteAccepted(payload) {
  try {
    const res = await fetch('/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('notify failed', res.status, data);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('notify error', e);
    return false;
  }
}
