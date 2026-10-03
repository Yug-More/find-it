export const CATEGORIES = [
  "Electronics",
  "Bags",
  "Keys",
  "Clothing",
  "Accessories",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
