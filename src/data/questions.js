import manifest from "./questionChunks/_manifest.json";

const chunkLoaders = import.meta.glob("./questionChunks/*.js", { eager: false });

/** @type {typeof manifest.subjects} */
export const SUBJECTS = [...new Set(manifest.subjects)];

let cache = null;

/**
 * Tüm soru bankasını paralel parça yükleme ile belleğe alır (tek sefer önbellek).
 */
export async function loadAllQuestions() {
  if (cache) return cache;
  const loaders = Object.entries(chunkLoaders).filter(([path]) => !path.includes("_manifest"));
  const mods = await Promise.all(loaders.map(([, fn]) => fn()));
  cache = mods.flatMap((m) => m.QUESTIONS);
  return cache;
}

export function invalidateQuestionsCache() {
  cache = null;
}

/** @deprecated Yalnızca geriye dönük import uyumu — QuestionsProvider / loadAllQuestions kullanın */
export const QUESTIONS = [];
