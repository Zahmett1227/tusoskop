const KEY = "tusoskop_last_provider"; // "apple" | "google"

export const saveLastProvider = (provider) => {
  try {
    if (provider) localStorage.setItem(KEY, provider);
  } catch {
    /* localStorage erişilemezse sessizce geç */
  }
};

export const getLastProvider = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearLastProvider = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* sessizce geç */
  }
};
