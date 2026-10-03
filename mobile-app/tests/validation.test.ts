import { hasFieldErrors, normalizeReportInput, validateReportInput } from "../src/utils/validation";
import { sampleInput } from "./fixtures";

describe("validateReportInput", () => {
  const now = new Date("2026-10-02T12:00:00");

  it("accepts a complete report", () => {
    const errors = validateReportInput(sampleInput(), now);
    expect(hasFieldErrors(errors)).toBe(false);
  });

  it("requires the item name, category, description, location, and date", () => {
    const errors = validateReportInput(
      sampleInput({
        title: "  ",
        category: "",
        description: "",
        location: " ",
        eventDate: "",
      }),
      now,
    );

    expect(errors.title).toBe("Enter the item name.");
    expect(errors.category).toBe("Select a category.");
    expect(errors.description).toBe("Enter a description.");
    expect(errors.location).toBe("Enter where the item was lost or found.");
    expect(errors.eventDate).toBe("Enter the date as YYYY-MM-DD.");
  });

  it("allows color to be blank and rejects an unrealistic length", () => {
    expect(validateReportInput(sampleInput({ color: "  " }), now).color).toBeUndefined();
    expect(validateReportInput(sampleInput({ color: "x".repeat(41) }), now).color).toBe(
      "Color must be 40 characters or fewer.",
    );
  });

  it("rejects an item name longer than 120 characters", () => {
    const errors = validateReportInput(sampleInput({ title: "a".repeat(121) }), now);
    expect(errors.title).toBe("Item name must be 120 characters or fewer.");
  });

  it("rejects dates that are not real or are in the future", () => {
    expect(validateReportInput(sampleInput({ eventDate: "01/15/2026" }), now).eventDate).toBe(
      "Enter a real date as YYYY-MM-DD.",
    );
    expect(validateReportInput(sampleInput({ eventDate: "2026-02-31" }), now).eventDate).toBe(
      "Enter a real date as YYYY-MM-DD.",
    );
    expect(validateReportInput(sampleInput({ eventDate: "2023-02-29" }), now).eventDate).toBe(
      "Enter a real date as YYYY-MM-DD.",
    );
    expect(validateReportInput(sampleInput({ eventDate: "2024-02-29" }), now).eventDate).toBeUndefined();
    expect(validateReportInput(sampleInput({ eventDate: "2099-01-01" }), now).eventDate).toBe(
      "Enter a date that is today or earlier.",
    );
  });

  it("trims text fields before submission", () => {
    expect(normalizeReportInput(sampleInput({ title: "  Blue notebook  ", color: "  " }))).toMatchObject({
      title: "Blue notebook",
      color: "",
    });
  });
});
