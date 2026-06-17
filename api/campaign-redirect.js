import {
  buildCampaignRedirectTargets,
  normalizeCampaignParam,
  normalizeMediumParam,
  detectPlatformFromUserAgentServer,
} from "../src/constants/campaignLinks.js";
import { logCampaignClick } from "../lib/campaign/logCampaignClick.js";
import { renderRedirectPage } from "../lib/campaign/renderRedirectPage.js";

function getQueryParam(query, key) {
  const value = query?.[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildRawQuery(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (key === "format") continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value != null) {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function buildStatusMessage(platform, destination) {
  if (destination === "appstore") {
    return "iPhone veya iPad algılandı. App Store açılıyor…";
  }
  if (platform === "android") {
    return "Android cihaz algılandı. Web sürümüne yönlendiriliyorsun…";
  }
  return "Web sürümüne yönlendiriliyorsun…";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const query = req.query || {};
  const campaignPresent = Object.prototype.hasOwnProperty.call(query, "c");
  const mediumPresent = Object.prototype.hasOwnProperty.call(query, "m");
  const campaign = normalizeCampaignParam(getQueryParam(query, "c"), {
    paramPresent: campaignPresent,
  });
  const medium = normalizeMediumParam(getQueryParam(query, "m"), {
    paramPresent: mediumPresent,
  });
  const userAgent = req.headers["user-agent"] || "";
  const platform = detectPlatformFromUserAgentServer(userAgent);
  const appleCampaignPt = process.env.APPLE_CAMPAIGN_PT || null;
  const targets = buildCampaignRedirectTargets({
    campaign,
    medium,
    platform,
    appleCampaignPt,
  });
  const rawQuery = buildRawQuery(query);

  await logCampaignClick({
    req,
    campaign,
    medium,
    platform,
    destination: targets.destination,
    rawQuery,
  });

  const format = String(getQueryParam(query, "format") || "").toLowerCase();
  if (format === "json") {
    res.status(200).json({
      campaign,
      medium,
      platform,
      destination: targets.destination,
      redirectUrl: targets.redirectUrl,
      appStoreUrl: targets.appStoreUrl,
      appStoreDeepLink: targets.appStoreDeepLink,
      webUrl: targets.webUrl,
    });
    return;
  }

  const html = renderRedirectPage({
    statusMessage: buildStatusMessage(platform, targets.destination),
    appStoreUrl: targets.appStoreUrl,
    webUrl: targets.webUrl,
    redirectUrl: targets.redirectUrl,
    appStoreDeepLink: targets.appStoreDeepLink,
    platform,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(html);
}
