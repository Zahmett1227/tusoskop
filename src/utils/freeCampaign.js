import { WEB_FREE_ACCESS_CAMPAIGN } from "../config/freeAccessCampaign";
import { isWebFreeAccessActive } from "./premiumUtils";

const TR_TIME_ZONE = "Europe/Istanbul";

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "31 Ekim 2026" / "31 Ekim" — Türkiye saatine göre kampanya bitiş etiketi. */
export function getFreeCampaignEndLabels(campaign = WEB_FREE_ACCESS_CAMPAIGN) {
  const end = toDate(campaign?.endsAt);
  if (!end) return { long: "", short: "" };
  const long = end.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TR_TIME_ZONE,
  });
  const short = end.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: TR_TIME_ZONE,
  });
  return { long, short };
}

/** Kampanya bitişine kalan süre (gün/saat/dakika/saniye). Aktif değilse active=false. */
export function getFreeCampaignCountdown(now = new Date(), campaign = WEB_FREE_ACCESS_CAMPAIGN) {
  const end = toDate(campaign?.endsAt);
  const active = Boolean(end) && isWebFreeAccessActive(now, campaign);
  const totalSeconds = active ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) : 0;
  return {
    active,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export const padTime = (value) => String(value).padStart(2, "0");
