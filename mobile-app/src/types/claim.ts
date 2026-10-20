export type ClaimStatus = "pending" | "approved" | "rejected";

export type Claim = {
  id: string;
  itemId: string;
  claimantId: string;
  message: string;
  status: ClaimStatus;
  createdAt: string;
  itemTitle?: string;
};

export type ClaimInput = {
  message: string;
};

export type ClaimFieldErrors = {
  message?: string;
};
