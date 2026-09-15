import { useEffect, useState } from "react";
import { getFreeCampaignCountdown } from "../../utils/freeCampaign";

/** Kampanya bitişine canlı geri sayım; kampanya aktif değilse sayaç çalışmaz. */
export function useFreeCampaignCountdown() {
  const [countdown, setCountdown] = useState(() => getFreeCampaignCountdown());

  useEffect(() => {
    if (!countdown.active) return undefined;
    const id = window.setInterval(() => setCountdown(getFreeCampaignCountdown()), 1000);
    return () => window.clearInterval(id);
  }, [countdown.active]);

  return countdown;
}
