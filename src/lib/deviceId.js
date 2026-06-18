const KEY = 'nutriscan-device-id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID?.() || `d-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function deviceHeaders() {
  return { 'X-Device-Id': getDeviceId() };
}
