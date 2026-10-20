export function formatMatchConfidence(similarity: number): string {
  const percent = Math.round(Math.min(1, Math.max(0, similarity)) * 100);
  return `${percent}% match`;
}

export function confidenceTone(similarity: number): "success" | "warning" | "neutral" {
  if (similarity >= 0.75) {
    return "success";
  }
  if (similarity >= 0.5) {
    return "warning";
  }
  return "neutral";
}
