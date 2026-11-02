import type { Report } from "./report";

export type ClaimStatus = "pending" | "approved" | "rejected";

export type Claim = {
  id: string;
  itemId: string;
  claimantId: string;
  message: string;
  status: ClaimStatus;
  createdAt: string;
  itemTitle?: string;
  updatedAt?: string;
  item?: Report | null;
};

export type ClaimInput = {
  message: string;
};

export type ClaimFieldErrors = {
  message?: string;
};
