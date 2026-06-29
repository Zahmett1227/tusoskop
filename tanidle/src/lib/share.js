// Wordle tarzı paylaşım ızgarası.
// guesses: tahmin geçmişi [{correct:boolean}], solved: boolean.

const SITE = "tanidle"; // domain bağlanınca güncellenir

export function buildShareText({ number, guesses, solved, maxGuesses }) {
  const wrong = guesses.filter((g) => !g.correct).length;
  const scoreLine = solved ? `${wrong + 1}/${maxGuesses}` : `X/${maxGuesses}`;
  const grid = guesses
    .map((g) => (g.correct ? "🟩" : "🟥"))
    .join("");
  return `Tanıdle #${number} ${scoreLine}\n${grid}\n🏥 ${SITE}`;
}

// Cihazda paylaşım: native share → pano → false.
export async function share(text) {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    /* kullanıcı iptal etti veya desteklenmiyor */
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
