"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  Fragment,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Lesson, Attempt, Completion, Source } from "@/lib/schema";
import { mastery, progress } from "@/lib/progress";
import type { VisitorPractice } from "@/lib/visitor-practice";
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
type RuntimeConfig = {
  mode: string;
  developerAvailable: boolean;
  supabase: { url: string; key: string } | null;
};
const Context = createContext<{
  data: Data | null;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
  request: (path: string, body?: unknown) => Promise<any>;
  switchRole: (role: string) => Promise<void>;
  auth: SupabaseClient | null;
  developerAvailable: boolean;
  reloadConfiguration: () => Promise<void>;
}>({
  data: null,
  error: "",
  loading: true,
  refresh: async () => {},
  request: async () => {},
  switchRole: async () => {},
  auth: null,
  developerAvailable: false,
  reloadConfiguration: async () => {},
});

async function serverRequest(path: string, body?: unknown, token?: string) {
  const isForm = body instanceof FormData;
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    cache: "no-store",
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}

function visitorData(session: VisitorPractice): Data {
  const { attempts, completions, lessons } = session;
  return {
    lessons,
    attempts,
    completions,
    stats: progress(attempts, completions),
    mastery: mastery(attempts),
    drafts: [],
    history: [],
    sources: [],
    role: "visitor",
    mode: "supabase",
    analytics: null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null),
    [revision, setRevision] = useState(0),
    [visitorEpoch, setVisitorEpoch] = useState(0);
  const visitor = useRef<VisitorPractice | null>(null);
  const refreshId = useRef(0);
  const authClient = useMemo(
    () =>
      config?.supabase
        ? createClient(config.supabase.url, config.supabase.key)
        : null,
    [config?.supabase?.url, config?.supabase?.key],
  );
  const reloadConfiguration = useCallback(async () => {
    refreshId.current++;
    visitor.current = null;
    setLoading(true);
    setData(null);
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load service settings.");
      setConfig(await response.json());
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }, []);

  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const request = useCallback(
    async (path: string, body?: unknown) => {
      if (data?.role === "visitor") {
        if (path !== "/api/data" || !visitor.current)
          throw new Error("Sign in to use this feature.");
        if (!body) return visitorData(visitor.current);
        const result = visitor.current.submit(body);
        setData(visitorData(visitor.current));
        return result;
      }
      const session = authClient
        ? (await authClient.auth.getSession()).data.session
        : null;
      return serverRequest(path, body, session?.access_token);
    },
    [authClient, data?.role],
  );
  const refresh = useCallback(async () => {
    const id = ++refreshId.current;
    try {
      const session = authClient
        ? (await authClient.auth.getSession()).data.session
        : null;
      if (id !== refreshId.current) return;
      if (authClient && !session) {
        if (!visitor.current) {
          const [{ VisitorPractice }, { workshopOne }, { publicLesson }] =
            await Promise.all([
              import("@/lib/visitor-practice"),
              import("@/lib/content/workshop-one"),
              import("@/lib/presentation"),
            ]);
          if (id !== refreshId.current) return;
          visitor.current = new VisitorPractice([publicLesson(workshopOne)]);
        }
        setData(visitorData(visitor.current));
      } else {
        visitor.current = null;
        const result = await serverRequest(
          "/api/data",
          undefined,
          session?.access_token,
        );
        if (id !== refreshId.current) return;
        setData(result);
      }
      setError("");
    } catch (e) {
      if (id !== refreshId.current) return;
      setData(null);
      setError((e as Error).message);
    } finally {
      if (id === refreshId.current) setLoading(false);
    }
  }, [authClient]);
  useEffect(() => {
    reloadConfiguration();
  }, [reloadConfiguration]);
  useEffect(() => {
    if (!config) return;
    refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = authClient?.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      clearTimeout(timer);
      timer = setTimeout(refresh, 0);
    });
    return () => {
      clearTimeout(timer);
      sub?.data.subscription.unsubscribe();
    };
  }, [refresh, revision, !!config]);
  useEffect(() => {
    if (!authClient) return;
    const discard = () => {
      if (visitor.current) {
        visitor.current = null;
        refreshId.current++;
      }
    };
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setData((current) => (current?.role === "visitor" ? null : current));
      setVisitorEpoch((epoch) => epoch + 1);
      void refresh();
    };
    window.addEventListener("pagehide", discard);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("pagehide", discard);
      window.removeEventListener("pageshow", restore);
    };
  }, [authClient, refresh]);
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
        developerAvailable: config?.developerAvailable || false,
        reloadConfiguration,
      }}
    >
      <Fragment
        key={data?.role === "visitor" ? `visitor-${visitorEpoch}` : "account"}
      >
        {children}
      </Fragment>
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
export function SignIn() {
  const { loading, auth, refresh } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="panel empty">
      <h1>Sign in</h1>
      <p>Sign in to keep your practice progress across visits.</p>
      {auth ? (
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            setBusy(true);
            setNote("");
            try {
              const { error } = await auth.auth.signInWithPassword({
                email: String(fields.get("email")),
                password: String(fields.get("password")),
              });
              if (error) throw error;
              await refresh();
              router.replace("/");
            } catch (error) {
              setNote((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input required type="email" name="email" autoComplete="username" />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
            />
          </label>
          <button className="btn" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {note && <p role="alert">{note}</p>}
        </form>
      ) : (
        <p>{loading ? "Loading sign-in…" : "Sign-in is unavailable."}</p>
      )}
      <Link className="btn secondary" href="/">
        Back to lessons
      </Link>
    </div>
  );
}

export function DataBoundary({ children }: { children: ReactNode }) {
  const {
    data,
    error,
    loading,
    reloadConfiguration,
    auth,
    developerAvailable,
  } = useApp();
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
          <Link className="btn" href="/sign-in">
            Sign in
          </Link>
        )}
        {developerAvailable && (
          <Link className="btn secondary" href="/developer">
            Developer setup
          </Link>
        )}
        <button className="btn secondary" onClick={reloadConfiguration}>
          Try again
        </button>
      </div>
    );
  return data ? <>{children}</> : null;
}
