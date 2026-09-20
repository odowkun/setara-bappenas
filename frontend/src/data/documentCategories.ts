export const PRIMARY_DOCUMENT_CATEGORY_CODES = [
  "RPJPD",
  "RPJMD",
  "RKPD",
] as const;

export const DOCUMENT_QUICK_CATEGORIES = [
  { code: "RPJPD", label: "RPJPD" },
  { code: "RPJMD", label: "RPJMD" },
  { code: "RKPD", label: "RKPD" },
  { code: "LAINNYA", label: "Lainnya" },
] as const;

export type DocumentCategoryCode =
  (typeof DOCUMENT_QUICK_CATEGORIES)[number]["code"];

export function isPrimaryDocumentCategory(value: string): boolean {
  return PRIMARY_DOCUMENT_CATEGORY_CODES.some(
    (code) => value === code || value.includes(code)
  );
}
