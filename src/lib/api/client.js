/**
 * Production API client — always uses same-origin /api on Vercel.
 * No localhost, tunnel, or hardcoded URLs.
 */

export function getApiBase() {
  const base = import.meta.env.VITE_API_BASE;
  if (base && String(base).trim()) {
    return String(base).replace(/\/$/, '');
  }
  return '';
}

/** Cloud API + sync enabled in production builds */
export function isCloudEnabled() {
  return import.meta.env.PROD === true || !!import.meta.env.VITE_SUPABASE_URL;
}

export async function apiFetch(path, options = {}) {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function checkHealth() {
  try {
    const res = await apiFetch('/api/health');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
