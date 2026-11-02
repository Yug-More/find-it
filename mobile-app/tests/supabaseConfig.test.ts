import { getSupabaseClient, getSupabaseConfigError, MISSING_SUPABASE_MESSAGE } from "../src/services/supabase";

describe("supabase configuration", () => {
  it("explains how to fix a missing Supabase URL or anon key", () => {
    Reflect.deleteProperty(process.env, "EXPO_PUBLIC_SUPABASE_URL");
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    expect(getSupabaseConfigError()).toBe(MISSING_SUPABASE_MESSAGE);

    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "   ";
    expect(getSupabaseConfigError()).toBe(MISSING_SUPABASE_MESSAGE);
  });

  it("does not create a client when configuration is missing", () => {
    Reflect.deleteProperty(process.env, "EXPO_PUBLIC_SUPABASE_URL");
    Reflect.deleteProperty(process.env, "EXPO_PUBLIC_SUPABASE_ANON_KEY");

    const actual = jest.requireActual<typeof import("../src/services/supabase")>(
      "../src/services/supabase",
    );
    expect(actual.getSupabaseConfigError()).toBe(MISSING_SUPABASE_MESSAGE);
    expect(actual.getSupabaseClient()).toBeNull();
    expect(getSupabaseClient()).toBeNull();
  });
});
