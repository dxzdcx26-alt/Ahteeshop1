import { db } from "@/lib/db";

const SETTING_ALIASES: Record<string, string[]> = {
  site_name: ["siteName"],
  site_title: ["siteTitle", "siteTagline"],
  site_desc: ["siteDesc"],
  hero_lead: ["heroLead"],
  hero_badge: ["heroBadge"],
  foot_brand: ["footBrand"],
  foot_copy: ["footerText"],
  foot_report_url: ["footReportUrl"],
  foot_report_text: ["footReportText"],
  contact_facebook_url: ["facebookUrl", "contactFacebookUrl"],
  contact_discord_url: ["discordUrl", "contactDiscordUrl"],
  payment_info: ["paymentInfo"],
  wheel_cost_points: ["wheelCostPoints"],
  contact_note: ["contactNote"],
  logo_url: ["logoUrl"],
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};

  for (const r of rows) {
    map[r.key] = r.value;
    for (const alias of SETTING_ALIASES[r.key] || []) {
      map[alias] ??= r.value;
    }
  }

  for (const [key, aliases] of Object.entries(SETTING_ALIASES)) {
    if (map[key] && aliases.length > 0) {
      for (const alias of aliases) {
        map[alias] ??= map[key];
      }
    }
  }

  return map;
}

export async function getActiveAnnouncements(): Promise<string[]> {
  const rows = await db.announcement.findMany({ where: { active: true } });
  return rows.map((r) => r.text);
}
