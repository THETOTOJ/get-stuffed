"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { Tables } from "@/types/database.types";
import { Menu, X, ChefHat, BookOpen, User, Shield, LogOut, LogIn } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<Tables<"users"> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => getUser());
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function getUser() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setUser(null); return; }
    const { data: userData, error } = await supabase
      .from("users").select("*").eq("id", authData.user.id).single();
    if (error || !userData) {
      setUser({ id: authData.user.id, email: authData.user.email ?? null,
        banned: null, bio: null, created_at: null, is_admin: null,
        profile_picture: null, username: null });
    } else {
      setUser(userData);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setMobileMenuOpen(false);
  }

  return (
    <nav
      style={{
        background: "var(--card)",
        borderBottom: "2px solid var(--border-light)",
        boxShadow: "0 2px 0 var(--border-light), 0 4px 16px var(--shadow)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Decorative top stripe */}
      <div style={{
        height: "3px",
        background: "repeating-linear-gradient(90deg, var(--accent) 0px, var(--accent) 12px, transparent 12px, transparent 24px)",
        opacity: 0.5,
      }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>

          {/* ── Logo ── */}
          <Link
            href="/recipes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span style={{
              fontSize: "1.5rem",
              lineHeight: 1,
              filter: "drop-shadow(0 1px 2px var(--shadow))",
            }}>🍲</span>
            <span style={{
              fontFamily: "var(--header-font, 'Playfair Display', Georgia, serif)",
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: "1.35rem",
              color: "var(--foreground)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              Get Stuffed
              <span style={{ color: "var(--accent)", marginLeft: "1px" }}> !</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "0.25rem" }}>
            <NavLink href="/recipes">
              <ChefHat size={15} strokeWidth={1.5} />
              Recipes
            </NavLink>
            {user && (
              <NavLink href="/collections">
                <BookOpen size={15} strokeWidth={1.5} />
                Collections
              </NavLink>
            )}
            {user && (
              <NavLink href="/profile">
                <User size={15} strokeWidth={1.5} />
                Profile
              </NavLink>
            )}
            {user?.is_admin && (
              <NavLink href="/admin">
                <Shield size={15} strokeWidth={1.5} />
                Admin
              </NavLink>
            )}

            <div style={{ width: "1px", height: "24px", background: "var(--border-light)", margin: "0 0.5rem" }} />

            <ThemeSwitcher />

            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1.5px solid var(--border-light)",
                  borderRadius: "8px",
                  padding: "0.4rem 0.85rem",
                  fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  marginLeft: "0.25rem",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-light)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            ) : (
              <Link
                href="/auth/login"
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  background: "var(--accent)",
                  color: "var(--button-text)",
                  border: "1.5px solid var(--accent-hover)",
                  borderRadius: "8px",
                  padding: "0.4rem 0.9rem",
                  fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  marginLeft: "0.25rem",
                  boxShadow: "0 2px 0 var(--accent-hover)",
                  transition: "all 0.15s ease",
                }}
              >
                <LogIn size={14} />
                Login
              </Link>
            )}
          </div>

          {/* ── Mobile controls ── */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: "0.5rem" }}>
            <ThemeSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "var(--background)",
                border: "1.5px solid var(--border-light)",
                borderRadius: "8px",
                padding: "0.4rem",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
              }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden"
            style={{
              borderTop: "1px solid var(--border-light)",
              paddingBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
            }}
          >
            <MobileNavLink href="/recipes" onClick={() => setMobileMenuOpen(false)}>
              <ChefHat size={16} /> Recipes
            </MobileNavLink>
            {user && (
              <MobileNavLink href="/collections" onClick={() => setMobileMenuOpen(false)}>
                <BookOpen size={16} /> Collections
              </MobileNavLink>
            )}
            {user && (
              <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} /> Profile
              </MobileNavLink>
            )}
            {user?.is_admin && (
              <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                <Shield size={16} /> Admin
              </MobileNavLink>
            )}
            <div style={{ margin: "0.5rem 0.5rem 0.25rem", height: "1px", background: "var(--border-light)" }} />
            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.75rem",
                  background: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: "var(--body-font)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <MobileNavLink href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <LogIn size={16} /> Login / Register
              </MobileNavLink>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.45rem 0.75rem",
        borderRadius: "8px",
        fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
        fontSize: "0.92rem",
        fontWeight: 600,
        color: "var(--foreground)",
        textDecoration: "none",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-light)";
        (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground)";
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.6rem 0.75rem",
        borderRadius: "8px",
        fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
        fontSize: "0.95rem",
        fontWeight: 600,
        color: "var(--foreground)",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}