import type { ClaimFieldErrors, ClaimInput } from "../types/claim";

export function validateClaimInput(input: ClaimInput): ClaimFieldErrors {
  const message = input.message.trim();
  if (!message) {
    return { message: "Explain why this item belongs to you." };
  }
  if (message.length < 12) {
    return { message: "Add a few more details so the owner can verify your claim." };
  }
  if (message.length > 1000) {
    return { message: "Keep the explanation under 1000 characters." };
  }
  return {};
}

export function hasClaimErrors(errors: ClaimFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
