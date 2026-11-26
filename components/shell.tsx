"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutGrid,
  SlidersHorizontal,
  ArrowUpRight,
  Flame,
  UserRound,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "./app-provider";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    router = useRouter();
  const { data, switchRole, auth, developerAvailable } = useApp();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const studio = path.startsWith("/studio");
  const visitor = data?.role === "visitor";
  const demo = data?.mode === "demo";
  const staff = data?.role === "volunteer" || data?.role === "admin";
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
          <span className="brand-mark" aria-hidden="true">
            <BookOpen size={24} />
          </span>
          <span>Cantonese Learning</span>
        </Link>
        <button
          aria-label="Close navigation"
          className="mobile-close icon-btn"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <p className="nav-label">LEARNING</p>
        <nav>
          <Link
            onClick={() => setOpen(false)}
            className={path === "/" ? "active" : ""}
            href="/"
          >
            <LayoutGrid size={20} />
            My lessons
          </Link>
          <Link
            onClick={() => setOpen(false)}
            className={path === "/review" ? "active" : ""}
            href="/review"
          >
            <BookOpen size={20} />
            My wordbook
          </Link>
          {(demo || staff) && (
            <Link
              onClick={() => setOpen(false)}
              className={studio ? "active" : ""}
              href="/studio"
            >
              <SlidersHorizontal size={20} />
              Volunteer Studio
            </Link>
          )}
          {(developerAvailable || data?.role === "admin") && (
            <Link
              onClick={() => setOpen(false)}
              className={path === "/developer" ? "active" : ""}
              href="/developer"
            >
              <SlidersHorizontal size={20} />
              Developer setup
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom">
          {data && (
            <div className="mode-chip">
              <span />
              {visitor
                ? "Visitor"
                : demo
                  ? "FYP demo space"
                  : "Connected account"}
            </div>
          )}
          {demo && (
            <button className="mode-button" onClick={change}>
              {studio ? "Back to student" : "Switch to volunteer"}
              <ArrowUpRight size={16} />
            </button>
          )}
          {auth && data && !visitor && (
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
            {path === "/developer"
              ? "Developer setup"
              : path === "/sign-in"
                ? "Account"
                : studio
                  ? "Volunteer Content Studio"
                  : path === "/review"
                    ? "My wordbook"
                    : path.startsWith("/journey")
                      ? "Lesson practice"
                      : "My lessons"}
          </div>
          <div className="header-right">
            {visitor ? (
              <Link className="text-link" href="/sign-in">
                Sign in
              </Link>
            ) : (
              <>
                <span className="header-streak">
                  <Flame size={16} />
                  {data?.stats.streak || 0}
                  <span>day streak</span>
                </span>
                <span className="avatar" aria-label="Account">
                  <UserRound size={18} />
                </span>
              </>
            )}
          </div>
        </header>
        <main>{children}</main>
        <footer>Cantonese Learning · Workshop practice</footer>
      </div>
    </div>
  );
}
