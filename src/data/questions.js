import manifest from "./questionChunks/_manifest.json";

const chunkLoaders = import.meta.glob("./questionChunks/*.js", { eager: false });

/** @type {typeof manifest.subjects} */
export const SUBJECTS = [...new Set(manifest.subjects)];

const allLoaders = Object.entries(chunkLoaders).filter(
  ([path]) => !path.includes("_manifest")
);
const subjectCache = new Map();
let allCache = null;

function getSlugBySubjectName(ders) {
  if (!ders) return null;
  const entry = Object.entries(manifest.subjectBySlug).find(([, name]) => name === ders);
  return entry?.[0] ?? null;
}

function getLoaderBySlug(slug) {
  if (!slug) return null;
  const expectedPath = `./questionChunks/${slug}.js`;
  return chunkLoaders[expectedPath] || null;
}

export async function loadQuestionsForSubject(ders) {
  const slug = getSlugBySubjectName(ders);
  if (!slug) return [];
  if (subjectCache.has(slug)) return subjectCache.get(slug);
  const loader = getLoaderBySlug(slug);
  if (!loader) return [];
  const mod = await loader();
  const list = Array.isArray(mod?.QUESTIONS) ? mod.QUESTIONS : [];
  subjectCache.set(slug, list);
  return list;
}

export async function loadQuestionsForSubjects(subjects) {
  const uniqueSubjects = [...new Set((subjects || []).filter(Boolean))];
  if (uniqueSubjects.length === 0) return [];
  const chunks = await Promise.all(uniqueSubjects.map((ders) => loadQuestionsForSubject(ders)));
  return chunks.flat();
}

/**
 * Tüm soru bankasını paralel parça yükleme ile belleğe alır (tek sefer önbellek).
 */
export async function loadAllQuestions() {
  if (allCache) return allCache;
  const mods = await Promise.all(allLoaders.map(([, fn]) => fn()));
  allCache = mods.flatMap((m) => m.QUESTIONS);
  for (const [slug, subjectName] of Object.entries(manifest.subjectBySlug)) {
    if (subjectCache.has(slug)) continue;
    const list = allCache.filter((q) => q?.ders === subjectName);
    subjectCache.set(slug, list);
  }
  return allCache;
}

export function invalidateQuestionsCache() {
  allCache = null;
  subjectCache.clear();
}

/** @deprecated Yalnızca geriye dönük import uyumu — QuestionsProvider / loadAllQuestions kullanın */
export const QUESTIONS = [];
