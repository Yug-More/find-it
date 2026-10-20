import { confidenceTone, formatMatchConfidence } from "../src/utils/confidence";

describe("match confidence helpers", () => {
  it("formats similarity as a percentage label", () => {
    expect(formatMatchConfidence(0.812)).toBe("81% match");
    expect(formatMatchConfidence(1.2)).toBe("100% match");
    expect(formatMatchConfidence(-0.1)).toBe("0% match");
  });

  it("maps similarity to a badge tone", () => {
    expect(confidenceTone(0.8)).toBe("success");
    expect(confidenceTone(0.6)).toBe("warning");
    expect(confidenceTone(0.2)).toBe("neutral");
  });
});
