"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Search, Plus, Edit2, Trash2, Check, X,
  ShieldCheck, ShieldOff, Ban, UserCheck,
  ChevronLeft, ChevronRight, Tag, Zap, Users, Shield
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  banned: boolean;
  created_at: string;
}

interface TagItem {
  id: string;
  name: string;
}

interface EffortItem {
  id: string;
  name: string;
}

type AdminSection = "users" | "tags" | "efforts";

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");

  // Tags
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");

  // Efforts
  const [efforts, setEfforts] = useState<EffortItem[]>([]);
  const [newEffort, setNewEffort] = useState("");
  const [editingEffortId, setEditingEffortId] = useState<string | null>(null);
  const [editingEffortValue, setEditingEffortValue] = useState("");

  // UI
  const [activeSection, setActiveSection] = useState<AdminSection>("users");

  // ── Auth guard — runs first, redirects if not admin ──
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { data } = await supabase
        .from("users").select("is_admin").eq("id", user.id).single();

      if (!data?.is_admin) { router.replace("/recipes"); return; }

      setIsAdmin(true);
      setAuthChecked(true);
    }
    checkAdmin();
  }, [router]);

  const loadUsers = useCallback(async () => {
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);
    if (search) query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, count } = await query;
    setUsers(data || []);
    setTotalUsers(count || 0);
  }, [page, search]);

  const loadTags = useCallback(async () => {
    const { data } = await supabase.from("tags").select("*").order("name");
    setTags(data || []);
  }, []);

  const loadEfforts = useCallback(async () => {
    const { data } = await supabase.from("efforts").select("*").order("name");
    setEfforts(data || []);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    loadUsers(); loadTags(); loadEfforts();
  }, [authChecked, loadUsers, loadTags, loadEfforts]);

  async function toggleBan(u: AdminUser) {
    await supabase.from("users").update({ banned: !u.banned }).eq("id", u.id);
    loadUsers();
  }

  async function toggleAdmin(u: AdminUser) {
    await supabase.from("users").update({ is_admin: !u.is_admin }).eq("id", u.id);
    loadUsers();
  }

  async function addTag() {
    if (!newTag.trim()) return;
    await supabase.from("tags").insert({ name: newTag.trim() });
    setNewTag(""); loadTags();
  }

  async function saveTag(id: string) {
    if (!editingTagValue.trim()) return;
    await supabase.from("tags").update({ name: editingTagValue.trim() }).eq("id", id);
    setEditingTagId(null); loadTags();
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag? It will be removed from all recipes.")) return;
    await supabase.from("tags").delete().eq("id", id);
    loadTags();
  }

  async function addEffort() {
    if (!newEffort.trim()) return;
    await supabase.from("efforts").insert({ name: newEffort.trim() });
    setNewEffort(""); loadEfforts();
  }

  async function saveEffort(id: string) {
    if (!editingEffortValue.trim()) return;
    await supabase.from("efforts").update({ name: editingEffortValue.trim() }).eq("id", id);
    setEditingEffortId(null); loadEfforts();
  }

  async function deleteEffort(id: string) {
    if (!confirm("Delete this effort level? It will be removed from all recipes.")) return;
    await supabase.from("efforts").delete().eq("id", id);
    loadEfforts();
  }

  // ── Loading / redirect states ──
  if (!authChecked) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", color: "var(--muted)",
        fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "1.2rem",
      }}>
        Checking credentials…
      </div>
    );
  }

  if (!isAdmin) return null; // router.replace already called

  const totalPages = Math.ceil(totalUsers / 10);

  const inputStyle: React.CSSProperties = {
    background: "var(--background)",
    color: "var(--foreground)",
    border: "1.5px solid var(--border)",
    borderRadius: "8px",
    padding: "0.65rem 0.9rem",
    fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
    fontSize: "0.95rem",
    outline: "none",
    boxShadow: "inset 0 2px 4px var(--shadow)",
    transition: "border-color 0.2s ease",
    width: "100%",
  };

  function iconBtnStyle(color: string): React.CSSProperties {
    return {
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 32, borderRadius: "6px", flexShrink: 0,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      color,
      border: `1.5px solid color-mix(in srgb, ${color} 30%, transparent)`,
      cursor: "pointer",
      transition: "all 0.15s ease",
    };
  }

  return (
    <>
      <Head><title>Admin Dashboard | Get Stuffed !</title></Head>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem 5rem" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--accent)", color: "var(--button-text)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 0 var(--accent-hover)",
            flexShrink: 0,
          }}>
            <Shield size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "var(--header-font, 'Playfair Display', Georgia, serif)",
              fontStyle: "italic", fontWeight: 800, fontSize: "1.9rem",
              color: "var(--foreground)", margin: 0, lineHeight: 1.2,
            }}>
              Admin Dashboard
            </h1>
            <p style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "0.95rem", color: "var(--muted)", margin: 0 }}>
              Manage users, tags & effort levels
            </p>
          </div>
        </div>

        {/* ── Section tabs ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
          {([
            { id: "users" as AdminSection, label: "Users", icon: <Users size={15} />, count: totalUsers },
            { id: "tags" as AdminSection, label: "Tags", icon: <Tag size={15} />, count: tags.length },
            { id: "efforts" as AdminSection, label: "Efforts", icon: <Zap size={15} />, count: efforts.length },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.55rem 1.1rem",
                background: activeSection === tab.id ? "var(--accent)" : "var(--card)",
                color: activeSection === tab.id ? "var(--button-text)" : "var(--foreground)",
                border: `1.5px solid ${activeSection === tab.id ? "var(--accent-hover)" : "var(--border-light)"}`,
                borderRadius: "8px",
                fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
                fontSize: "0.95rem", fontWeight: 600,
                cursor: "pointer",
                boxShadow: activeSection === tab.id
                  ? "0 2px 0 var(--accent-hover)"
                  : "0 2px 0 var(--border-light)",
                transition: "all 0.15s ease",
              }}
            >
              {tab.icon}
              {tab.label}
              <span style={{
                background: activeSection === tab.id
                  ? "rgba(255,255,255,0.25)"
                  : "var(--accent-light)",
                color: activeSection === tab.id ? "var(--button-text)" : "var(--accent)",
                borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700,
                padding: "0.05rem 0.5rem", lineHeight: 1.6,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ══ USERS ══ */}
        {activeSection === "users" && (
          <AdminCard title="Users" icon={<Users size={18} />}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: "1.25rem" }}>
              <Search size={16} style={{
                position: "absolute", left: "0.9rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none",
              }} />
              <input
                type="text"
                placeholder="Search by username or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ ...inputStyle, paddingLeft: "2.6rem" }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"}
              />
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", borderRadius: "10px", border: "1.5px solid var(--border-light)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "580px" }}>
                <thead>
                  <tr style={{ background: "var(--accent-light)", borderBottom: "1.5px solid var(--border-light)" }}>
                    {["User", "Email", "Joined", "Role", "Status"].map(h => (
                      <th key={h} style={{
                        padding: "0.75rem 1rem", textAlign: "left",
                        fontFamily: "var(--body-font)", fontSize: "0.72rem",
                        fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: "var(--muted)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{
                        padding: "2.5rem", textAlign: "center",
                        color: "var(--muted)", fontFamily: "var(--hand-font)", fontSize: "1.05rem",
                      }}>
                        No users found
                      </td>
                    </tr>
                  )}
                  {users.map((u, i) => (
                    <tr key={u.id} style={{
                      background: i % 2 === 0 ? "var(--card)" : "color-mix(in srgb, var(--background) 60%, var(--card))",
                      borderBottom: "1px solid var(--border-light)",
                    }}>
                      {/* User cell */}
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                            background: "var(--accent-light)", border: "1.5px solid var(--border-light)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--header-font)", fontWeight: 700,
                            fontSize: "0.82rem", color: "var(--accent)",
                          }}>
                            {(u.username || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                              <span style={{ fontFamily: "var(--body-font)", fontWeight: 600, fontSize: "0.9rem", color: "var(--foreground)" }}>
                                {u.username || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>no username</span>}
                              </span>
                              {u.is_admin && (
                                <span style={{
                                  background: "var(--accent)", color: "var(--button-text)",
                                  fontSize: "0.6rem", fontWeight: 700,
                                  padding: "0.05rem 0.4rem", borderRadius: "20px", letterSpacing: "0.05em",
                                }}>ADMIN</span>
                              )}
                              {u.banned && (
                                <span style={{
                                  background: "rgba(180,50,30,0.12)", color: "#b03020",
                                  border: "1px solid rgba(180,50,30,0.3)",
                                  fontSize: "0.6rem", fontWeight: 700,
                                  padding: "0.05rem 0.4rem", borderRadius: "20px", letterSpacing: "0.05em",
                                }}>BANNED</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.8rem 1rem", fontFamily: "var(--body-font)", fontSize: "0.85rem", color: "var(--muted)" }}>
                        {u.email}
                      </td>
                      <td style={{ padding: "0.8rem 1rem", fontFamily: "var(--body-font)", fontSize: "0.82rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <button
                          onClick={() => toggleAdmin(u)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.3rem 0.65rem",
                            background: u.is_admin
                              ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                              : "var(--background)",
                            color: u.is_admin ? "var(--accent)" : "var(--muted)",
                            border: `1.5px solid ${u.is_admin ? "var(--accent)" : "var(--border-light)"}`,
                            borderRadius: "6px",
                            fontFamily: "var(--body-font)", fontSize: "0.78rem", fontWeight: 600,
                            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
                          }}
                        >
                          {u.is_admin
                            ? <><ShieldOff size={12} /> Demote</>
                            : <><ShieldCheck size={12} /> Promote</>
                          }
                        </button>
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <button
                          onClick={() => toggleBan(u)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.3rem 0.65rem",
                            background: u.banned ? "rgba(180,50,30,0.1)" : "var(--background)",
                            color: u.banned ? "#b03020" : "var(--muted)",
                            border: `1.5px solid ${u.banned ? "rgba(180,50,30,0.4)" : "var(--border-light)"}`,
                            borderRadius: "6px",
                            fontFamily: "var(--body-font)", fontSize: "0.78rem", fontWeight: 600,
                            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s ease",
                          }}
                        >
                          {u.banned
                            ? <><UserCheck size={12} /> Unban</>
                            : <><Ban size={12} /> Ban</>
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.4rem 0.85rem",
                  background: "var(--card)", color: "var(--foreground)",
                  border: "1.5px solid var(--border-light)", borderRadius: "8px",
                  fontFamily: "var(--body-font)", fontSize: "0.88rem", fontWeight: 600,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.4 : 1,
                  boxShadow: "0 2px 0 var(--border-light)",
                  transition: "all 0.15s ease",
                }}
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <span style={{ fontFamily: "var(--body-font)", fontSize: "0.88rem", color: "var(--muted)" }}>
                Page {page} of {totalPages || 1} · {totalUsers} users
              </span>
              <button
                disabled={page * 10 >= totalUsers}
                onClick={() => setPage(p => p + 1)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  padding: "0.4rem 0.85rem",
                  background: "var(--card)", color: "var(--foreground)",
                  border: "1.5px solid var(--border-light)", borderRadius: "8px",
                  fontFamily: "var(--body-font)", fontSize: "0.88rem", fontWeight: 600,
                  cursor: page * 10 >= totalUsers ? "not-allowed" : "pointer",
                  opacity: page * 10 >= totalUsers ? 0.4 : 1,
                  boxShadow: "0 2px 0 var(--border-light)",
                  transition: "all 0.15s ease",
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </AdminCard>
        )}

        {/* ══ TAGS ══ */}
        {activeSection === "tags" && (
          <AdminCard title="Dietary Tags" icon={<Tag size={18} />}>
            <p style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "1rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
              Tags appear as quick filters on the recipes page and can be assigned when creating a recipe.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem" }}>
              <input
                type="text" placeholder="New tag name…"
                value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag()}
                style={inputStyle}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"}
              />
              <button onClick={addTag} disabled={!newTag.trim()} className="btn-primary"
                style={{ flexShrink: 0, padding: "0.55rem 0.9rem", opacity: !newTag.trim() ? 0.5 : 1 }}>
                <Plus size={17} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tags.length === 0 && (
                <p style={{ fontFamily: "var(--hand-font)", color: "var(--muted)", textAlign: "center", padding: "1.5rem" }}>No tags yet</p>
              )}
              {tags.map(t => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  background: "var(--background)", border: "1.5px solid var(--border-light)",
                  borderRadius: "8px", padding: "0.65rem 0.9rem",
                }}>
                  <Tag size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  {editingTagId === t.id ? (
                    <>
                      <input autoFocus value={editingTagValue}
                        onChange={e => setEditingTagValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveTag(t.id); if (e.key === "Escape") setEditingTagId(null); }}
                        style={{ ...inputStyle, flex: 1, padding: "0.35rem 0.6rem", fontSize: "0.92rem", boxShadow: "none" }}
                      />
                      <button onClick={() => saveTag(t.id)} style={iconBtnStyle("var(--accent)")}><Check size={14} /></button>
                      <button onClick={() => setEditingTagId(null)} style={iconBtnStyle("var(--muted)")}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontFamily: "var(--body-font)", fontSize: "0.95rem", color: "var(--foreground)", fontWeight: 500 }}>
                        {t.name}
                      </span>
                      <button onClick={() => { setEditingTagId(t.id); setEditingTagValue(t.name); }} style={iconBtnStyle("var(--accent)")}><Edit2 size={14} /></button>
                      <button onClick={() => deleteTag(t.id)} style={iconBtnStyle("#b03020")}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>
        )}

        {/* ══ EFFORTS ══ */}
        {activeSection === "efforts" && (
          <AdminCard title="Effort Levels" icon={<Zap size={18} />}>
            <p style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "1rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
              Effort levels indicate how much time and skill a recipe requires — e.g. Easy, Weekend Project.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem" }}>
              <input
                type="text" placeholder="New effort level…"
                value={newEffort} onChange={e => setNewEffort(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addEffort()}
                style={inputStyle}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"}
              />
              <button onClick={addEffort} disabled={!newEffort.trim()} className="btn-primary"
                style={{ flexShrink: 0, padding: "0.55rem 0.9rem", opacity: !newEffort.trim() ? 0.5 : 1 }}>
                <Plus size={17} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {efforts.length === 0 && (
                <p style={{ fontFamily: "var(--hand-font)", color: "var(--muted)", textAlign: "center", padding: "1.5rem" }}>No effort levels yet</p>
              )}
              {efforts.map(e => (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  background: "var(--background)", border: "1.5px solid var(--border-light)",
                  borderRadius: "8px", padding: "0.65rem 0.9rem",
                }}>
                  <Zap size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  {editingEffortId === e.id ? (
                    <>
                      <input autoFocus value={editingEffortValue}
                        onChange={ev => setEditingEffortValue(ev.target.value)}
                        onKeyDown={ev => { if (ev.key === "Enter") saveEffort(e.id); if (ev.key === "Escape") setEditingEffortId(null); }}
                        style={{ ...inputStyle, flex: 1, padding: "0.35rem 0.6rem", fontSize: "0.92rem", boxShadow: "none" }}
                      />
                      <button onClick={() => saveEffort(e.id)} style={iconBtnStyle("var(--accent)")}><Check size={14} /></button>
                      <button onClick={() => setEditingEffortId(null)} style={iconBtnStyle("var(--muted)")}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontFamily: "var(--body-font)", fontSize: "0.95rem", color: "var(--foreground)", fontWeight: 500 }}>
                        {e.name}
                      </span>
                      <button onClick={() => { setEditingEffortId(e.id); setEditingEffortValue(e.name); }} style={iconBtnStyle("var(--accent)")}><Edit2 size={14} /></button>
                      <button onClick={() => deleteEffort(e.id)} style={iconBtnStyle("#b03020")}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>
        )}

      </div>
    </>
  );
}

/* ── Shared card wrapper component ── */
function AdminCard({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1.5px solid var(--border-light)",
      borderRadius: "14px",
      boxShadow: "0 4px 0 var(--border-light), 0 8px 32px var(--shadow)",
      overflow: "hidden",
    }}>
      <div style={{ height: "3px", background: "linear-gradient(90deg, var(--accent), var(--border-light), var(--accent))" }} />
      <div style={{
        padding: "1.25rem 1.75rem",
        borderBottom: "1px solid var(--border-light)",
        display: "flex", alignItems: "center", gap: "0.6rem",
        background: "color-mix(in srgb, var(--accent-light) 40%, var(--card))",
      }}>
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <h2 style={{
          fontFamily: "var(--header-font, 'Playfair Display', Georgia, serif)",
          fontStyle: "italic", fontWeight: 700, fontSize: "1.3rem",
          color: "var(--foreground)", margin: 0,
        }}>{title}</h2>
      </div>
      <div style={{ padding: "1.5rem 1.75rem" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Icon button helper ── */
function iconBtnStyle(color: string): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: "6px", flexShrink: 0,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    color,
    border: `1.5px solid color-mix(in srgb, ${color} 30%, transparent)`,
    cursor: "pointer",
    transition: "all 0.15s ease",
  };
}