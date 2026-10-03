export function getApiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

export function shouldUseMockData(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK !== "false";
}
