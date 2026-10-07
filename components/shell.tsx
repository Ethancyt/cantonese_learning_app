"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutGrid,
  Heart,
  SlidersHorizontal,
  ArrowUpRight,
  Flame,
  Sparkles,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "./app-provider";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const { data, switchRole, auth } = useApp();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const studio = path.startsWith("/studio");
  async function change() {
    try {
      if (data?.mode === "demo")
        await switchRole(studio ? "student" : "volunteer");
      router.push(studio ? "/" : "/studio");
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-mark">粵</span>
          <span>
            Little Hong Kong<small>一齊講廣東話</small>
          </span>
        </Link>
        <button
          aria-label="Close navigation"
          className="mobile-close icon-btn"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <p className="nav-label">YOUR LITTLE ADVENTURE</p>
        <nav>
          <Link
            onClick={() => setOpen(false)}
            className={path === "/" ? "active" : ""}
            href="/"
          >
            <LayoutGrid size={20} />
            My journeys <span>探索</span>
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className={path === "/review" ? "active" : ""}
            href="/review"
          >
            <BookOpen size={20} />
            My wordbook <span>溫習</span>
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className={studio ? "active" : ""}
            href="/studio"
          >
            <SlidersHorizontal size={20} />
            Volunteer Studio
          </Link>
        </nav>
        <div className="sidebar-note">
          <span className="note-illustration">✦</span>
          <h3>
            Small steps.
            <br />
            More connection.
          </h3>
          <p>
            Your workshop is the beginning. A little practice keeps it going.
          </p>
          <span className="tiny">學少少，講多啲。</span>
        </div>
        <div className="sidebar-bottom">
          <div className="mode-chip">
            <span />
            {data?.mode === "supabase" ? "Connected account" : "FYP demo space"}
          </div>
          <button className="mode-button" onClick={change}>
            {studio ? "Back to student" : "Switch to volunteer"}
            <ArrowUpRight size={16} />
          </button>
          {auth && (
            <button className="mode-button" onClick={() => auth.auth.signOut()}>
              <LogOut size={14} />
              Sign out
            </button>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button
            className="mobile-menu icon-btn"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            {studio
              ? "Volunteer Content Studio"
              : path === "/review"
                ? "My wordbook"
                : path.startsWith("/journey")
                  ? "Your workshop journey"
                  : "Your learning corner"}
            <span> / {studio ? "創作室" : "學習小天地"}</span>
          </div>
          <div className="header-right">
            <span className="header-streak">
              <Flame size={16} />
              {data?.stats.streak || 0}
              <span>day streak</span>
            </span>
            <span className="avatar">{studio ? "V" : "你"}</span>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          Made for little conversations and big connections. <Heart size={12} />{" "}
          Hong Kong, 香港
        </footer>
      </div>
    </div>
  );
}
