/** scripts/split-questions.mjs ile aynı mantık — dosya adı üretimi tutarlı kalmalı */
export function subjectToChunkBasename(ders) {
  return (
    String(ders || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase() || "unknown"
  );
}
