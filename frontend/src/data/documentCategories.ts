export const PRIMARY_DOCUMENT_CATEGORY_CODES = [
  "RKPD",
  "RTRW",
  "RPJPD",
  "RPJMD",
  "LKPJ",
] as const;

export const DOCUMENT_QUICK_CATEGORIES = [
  { code: "RKPD", label: "RKPD" },
  { code: "RTRW", label: "RTRW" },
  { code: "RPJPD", label: "RPJPD" },
  { code: "RPJMD", label: "RPJMD" },
  { code: "LKPJ", label: "LKPJ" },
  { code: "LAINNYA", label: "Dokumen Publik Lainnya" },
] as const;

export type DocumentCategoryCode =
  (typeof DOCUMENT_QUICK_CATEGORIES)[number]["code"];

export function isPrimaryDocumentCategory(value: string): boolean {
  return PRIMARY_DOCUMENT_CATEGORY_CODES.some(
    (code) => value === code || value.includes(code)
  );
}
