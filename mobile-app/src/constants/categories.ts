export const CATEGORIES = [
  "Electronics",
  "Wallets and Bags",
  "Keys",
  "Clothing",
  "Accessories",
  "Documents",
  "Bottles",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
