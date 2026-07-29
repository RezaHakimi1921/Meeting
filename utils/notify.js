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
  const res = await fetch(`/notify/invite/${encodeURIComponent(inviteId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || 'invite_not_found' };
  }
  return data;
}

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

export { getInviteIdFromLocation };
