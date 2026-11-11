import { db } from "@/lib/db";

let settingsCache: { at: number; data: Record<string, string> } | null = null;
const SETTINGS_TTL_MS = 60_000;

export async function getSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (settingsCache && now - settingsCache.at < SETTINGS_TTL_MS) {
    return settingsCache.data;
  }
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  settingsCache = { at: now, data: map };
  return map;
}

export function invalidateSettingsCache() {
  settingsCache = null;
}

export async function getActiveAnnouncements(): Promise<string[]> {
  const rows = await db.announcement.findMany({ where: { active: true } });
  return rows.map((r) => r.text);
}
