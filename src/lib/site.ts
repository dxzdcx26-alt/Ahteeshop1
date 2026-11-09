import { db } from "@/lib/db";

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function getActiveAnnouncements(): Promise<string[]> {
  const rows = await db.announcement.findMany({ where: { active: true } });
  return rows.map((r) => r.text);
}
