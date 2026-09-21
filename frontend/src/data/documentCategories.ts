export const PRIMARY_DOCUMENT_CATEGORY_CODES = [
  "RPJPD",
  "RPJMN",
  "RPJMD_PROV",
  "RPJMD_KAB",
  "RKPD",
] as const;

export const DOCUMENT_QUICK_CATEGORIES = [
  { code: "RPJPD", label: "RPJPD" },
  { code: "RPJMN", label: "RPJMN" },
  { code: "RPJMD_PROV", label: "RPJMD Prov" },
  { code: "RPJMD_KAB", label: "RPJMD Kab" },
  { code: "RKPD", label: "RKPD" },
  { code: "LAINNYA", label: "Lainnya" },
] as const;

export type DocumentCategoryCode =
  (typeof DOCUMENT_QUICK_CATEGORIES)[number]["code"];

export function isPrimaryDocumentCategory(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false;
  const upper = value.toUpperCase().replace(/-/g, "_");
  if (upper === "RPJMD") return true;
  return PRIMARY_DOCUMENT_CATEGORY_CODES.some(
    (code) => upper === code || upper.includes(code)
  );
}
