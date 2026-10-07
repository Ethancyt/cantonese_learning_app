"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { Lesson, Attempt, Completion, Source } from "@/lib/schema";
import { mastery } from "@/lib/progress";
type Data = {
  lessons: Lesson[];
  drafts: Lesson[];
  history: Lesson[];
  sources: Source[];
  attempts: Attempt[];
  completions: Completion[];
  stats: { xp: number; completed: number; streak: number };
  mastery: ReturnType<typeof mastery>;
  role: string;
  mode: string;
  analytics: null | {
    students: number;
    attempts: number;
    completion: number;
    averageAttempts: number;
    difficult: ReturnType<typeof mastery>;
  };
};
const authClient =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )
    : null;
const Context = createContext<{
  data: Data | null;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  request: (path: string, body?: unknown) => Promise<any>;
  switchRole: (role: string) => Promise<void>;
  auth: typeof authClient;
}>({
  data: null,
  error: "",
  loading: true,
  refresh: async () => {},
  request: async () => {},
  switchRole: async () => {},
  auth: authClient,
});
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const request = useCallback(async (path: string, body?: unknown) => {
    const session = authClient
      ? (await authClient.auth.getSession()).data.session
      : null;
    const isForm = body instanceof FormData;
    const r = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    const json = await r.json();
    if (!r.ok) throw new Error(json.error || "Request failed.");
    return json;
  }, []);
  const refresh = useCallback(async () => {
    try {
      setData(await request("/api/data"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [request]);
  useEffect(() => {
    refresh();
    const sub = authClient?.auth.onAuthStateChange(() => {
      setTimeout(refresh, 0);
    });
    return () => sub?.data.subscription.unsubscribe();
  }, [refresh]);
  const switchRole = async (role: string) => {
    await request("/api/data", { action: "role", role });
    await refresh();
  };
  return (
    <Context.Provider
      value={{
        data,
        error,
        loading,
        request,
        refresh,
        switchRole,
        auth: authClient,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
export function DataBoundary({ children }: { children: ReactNode }) {
  const { data, error, loading, refresh, auth } = useApp();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [note, setNote] = useState("");
  if (loading)
    return (
      <div className="empty">
        <div className="spinner" />
        Getting your workshop ready…
      </div>
    );
  if (error)
    return (
      <div className="panel empty">
        <h2>Let’s get connected</h2>
        <p role="alert">{error}</p>
        {auth && (
          <form
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await auth.auth.signInWithPassword({
                email,
                password,
              });
              setNote(result.error?.message || "Signed in.");
              if (!result.error) refresh();
            }}
          >
            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="btn">Sign in</button>
            <p>{note}</p>
          </form>
        )}
        <button className="btn secondary" onClick={refresh}>
          Try again
        </button>
      </div>
    );
  return data ? <>{children}</> : null;
}
