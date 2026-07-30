const FALLBACK_BRIDGE = 'https://nameless-feather-4353.rezahakimi1921.workers.dev';

/**
 * Invite API always lives on the Cloudflare Worker.
 * The static app may be on the Ubuntu IP (/meeting) — that host has no /invite
 * routes, so same-origin must NOT be used there.
 */
function resolveBridge() {
  if (typeof window === 'undefined') return FALLBACK_BRIDGE;
  if (window.__MEETING_BRIDGE__) return window.__MEETING_BRIDGE__;
  try {
    const { origin, hostname } = window.location;
    if (hostname && hostname.endsWith('workers.dev')) {
      return String(origin).replace(/\/$/, '');
    }
  } catch {
    // fall through
  }
  return FALLBACK_BRIDGE;
}

const BRIDGE = resolveBridge();

function getInviteIdFromLocation() {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search || '');
    const i = params.get('i') || params.get('invite');
    return i ? String(i).trim() : null;
  } catch {
    return null;
  }
}

export async function fetchInvite(inviteId) {
  const res = await fetch(`${BRIDGE}/invite/${encodeURIComponent(inviteId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || (res.status === 410 ? 'invite_burned' : 'invite_not_found') };
  }
  return data;
}

export async function notifyInviteAccepted(payload) {
  try {
    const res = await fetch(`${BRIDGE}/notify`, {
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

export { getInviteIdFromLocation, BRIDGE };
