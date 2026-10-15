process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.EXPO_PUBLIC_API_URL = "http://localhost:8000";
process.env.EXPO_PUBLIC_USE_MOCK = "true";

jest.mock("react-native-url-polyfill/auto", () => ({}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true, status: "granted" })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("./src/services/supabase", () => {
  const actual = jest.requireActual("./src/services/supabase");
  const mock = require("./tests/supabaseMock");
  return {
    ...actual,
    getSupabaseClient: () => {
      if (actual.getSupabaseConfigError()) {
        return null;
      }
      return mock.getSupabaseClient();
    },
  };
});
