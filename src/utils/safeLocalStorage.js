/**
 * localStorage JSON okuma — parse hatalarında uygulamayı patlatmaz.
 * @param {string} key
 * @param {{ fallback?: unknown, clearOnError?: boolean }} [options]
 */
export function readLocalStorageJson(key, { fallback = null, clearOnError = false } = {}) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null || raw === "") return fallback;
    return JSON.parse(raw);
  } catch {
    if (clearOnError) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* quota / private mode */
      }
    }
    return fallback;
  }
}

export function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
