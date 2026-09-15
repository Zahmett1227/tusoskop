/** Mirrors src/config/limits.js FREE_LIMITS — keep in sync when limits change. */
exports.FREE_LIMITS = {
  dailyQuestions: 30,
  dailyTopicTests: 2,
  monthlyFullExams: 1,
  dailyReviewQuestions: 10,
};

/**
 * Mirrors src/config/freeAccessCampaign.js — web'e özel ücretsiz erişim kampanyası.
 * Sunucuda yalnızca web origin'inden (tusoskop.com) gelen çağrılar için geçerlidir;
 * iOS uygulaması (capacitor://localhost) etkilenmez.
 */
exports.WEB_FREE_ACCESS_CAMPAIGN = {
  enabled: true,
  startsAt: "2026-09-15T00:00:00+03:00",
  endsAt: "2026-10-31T23:59:59+03:00",
};
