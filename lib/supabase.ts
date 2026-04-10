import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if we have valid credentials
const hasValidCredentials =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 10;

// Create a mock client that returns empty data for all operations when credentials are missing
const createMockClient = (): SupabaseClient => {
  const mockResponse = { data: null, error: null };
  const mockBuilder = {
    select: () => mockBuilder,
    insert: () => mockBuilder,
    update: () => mockBuilder,
    delete: () => mockBuilder,
    eq: () => mockBuilder,
    neq: () => mockBuilder,
    gt: () => mockBuilder,
    lt: () => mockBuilder,
    gte: () => mockBuilder,
    lte: () => mockBuilder,
    like: () => mockBuilder,
    ilike: () => mockBuilder,
    is: () => mockBuilder,
    in: () => mockBuilder,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    single: () => Promise.resolve(mockResponse),
    maybeSingle: () => Promise.resolve(mockResponse),
    then: (resolve: (value: typeof mockResponse) => void) =>
      Promise.resolve(mockResponse).then(resolve),
  };

  return {
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: () =>
        Promise.resolve({
          data: null,
          error: { message: "Auth not configured" },
        }),
      signUp: () =>
        Promise.resolve({
          data: null,
          error: { message: "Auth not configured" },
        }),
      signInWithOAuth: () =>
        Promise.resolve({
          data: null,
          error: { message: "Auth not configured" },
        }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    },
    from: () => mockBuilder,
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
  } as unknown as SupabaseClient;
};

export const supabase: SupabaseClient = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createMockClient();

export const isSupabaseConfigured = hasValidCredentials;
