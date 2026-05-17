export function getWrongReviewCardCopy(wrongCount) {
  const count = Math.max(0, Number(wrongCount) || 0);
  const canStart = count > 0;
  return {
    canStart,
    statusLine: canStart ? `${count} yanlış soru hazır` : null,
    buttonLabel: canStart ? "Yanlışları çöz" : "Henüz yanlış kaydın yok",
  };
}
