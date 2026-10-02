export const POS_DRAFT_STORAGE_KEY = "gicho-pos-draft-sale";

export function clearPosDraft() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(POS_DRAFT_STORAGE_KEY);
  }
}
