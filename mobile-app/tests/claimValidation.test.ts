import { hasClaimErrors, validateClaimInput } from "../src/utils/claimValidation";

describe("claim validation", () => {
  it("requires a useful ownership explanation", () => {
    expect(validateClaimInput({ message: "" }).message).toBe(
      "Explain why this item belongs to you.",
    );
    expect(validateClaimInput({ message: "Too short" }).message).toMatch(/more details/);
    expect(hasClaimErrors(validateClaimInput({ message: "This bottle has my sticker and dent." }))).toBe(
      false,
    );
  });
});
