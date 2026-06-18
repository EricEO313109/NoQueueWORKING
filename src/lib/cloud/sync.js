import { apiFetch, isCloudEnabled } from '@/lib/api/client';
import { deviceHeaders } from '@/lib/deviceId';

let syncTimer = null;

export async function pullCloudState() {
  if (!isCloudEnabled()) return null;
  const res = await apiFetch('/api/sync', { method: 'GET', headers: deviceHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function pushCloudState(state) {
  if (!isCloudEnabled()) return;
  await apiFetch('/api/sync', {
    method: 'POST',
    headers: deviceHeaders(),
    body: JSON.stringify({
      deviceId: deviceHeaders()['X-Device-Id'],
      profile: state.profile,
      targets: state.targets,
      onboardingComplete: state.onboardingComplete,
      entries: state.entries,
      deletedEntryIds: state.deletedEntryIds || [],
      favorites: state.favorites,
      recipes: state.recipes,
      weightLog: state.weightLog,
    }),
  });
}

export function scheduleCloudSync(getState) {
  if (!isCloudEnabled()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    pushCloudState(getState()).catch(() => {});
  }, 2500);
}

export function applyCloudState(data) {
  if (!data) return;
  const patch = {};
  const profile = data.profile || {};
  const hasCloudProfile = Number(profile.age) > 0
    && Number(profile.weightKg) > 0
    && Number(profile.heightCm) > 0;
  const hasCloudTargets = data.targets && Object.keys(data.targets).length > 0;

  if (hasCloudProfile) patch.profile = profile;
  if (hasCloudTargets) patch.targets = data.targets;
  if (data.onboardingComplete === true) patch.onboardingComplete = true;
  if (data.entries) patch.entries = data.entries;
  if (data.favorites?.length) patch.favorites = data.favorites;
  if (data.recipes?.length) patch.recipes = data.recipes;
  if (data.weightLog?.length) patch.weightLog = data.weightLog;
  return patch;
}

export function mergeCloudEntries(localEntries = [], cloudEntries = [], deletedEntryIds = []) {
  const deleted = new Set(deletedEntryIds || []);
  const merged = new Map();

  for (const entry of localEntries) {
    if (entry?.id && !deleted.has(entry.id)) merged.set(entry.id, entry);
  }
  for (const entry of cloudEntries) {
    if (entry?.id && !deleted.has(entry.id)) {
      merged.set(entry.id, { ...(merged.get(entry.id) || {}), ...entry });
    }
  }

  return Array.from(merged.values());
}
