"use client";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useCallback } from "react";
import { Heart, BookmarkPlus, X, Plus } from "lucide-react";
import type { Tables } from "@/types/database.types";

export default function RecipeActions({ recipeId }: { recipeId: string }) {
  const [isFav, setIsFav] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState<Tables<"collections">[]>([]);
  const [collectionStates, setCollectionStates] = useState<Record<string, boolean>>({});
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creating, setCreating] = useState(false);

  const checkFavorite = useCallback(async () => {
    const user = await getUser();
    if (!user) return;
    try {
      const favCollection = await getFavoritesCollection(user.id);
      const { data } = await supabase
        .from("collection_recipes")
        .select("*")
        .eq("collection_id", favCollection.id)
        .eq("recipe_id", recipeId)
        .maybeSingle();
      setIsFav(!!data);
    } catch { setIsFav(false); }
  }, [recipeId]);

  useEffect(() => { checkFavorite(); }, [checkFavorite]);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async function getFavoritesCollection(userId: string) {
    const { data: existing } = await supabase
      .from("collections").select("*").eq("user_id", userId)
      .eq("name", "Favorites").limit(1);
    if (existing && existing.length > 0) return existing[0];
    const { data: newCol, error } = await supabase
      .from("collections")
      .insert({ user_id: userId, name: "Favorites", is_public: false })
      .select().single();
    if (error || !newCol) throw new Error("Failed to create Favorites collection");
    return newCol;
  }

  async function toggleFavorite() {
    const user = await getUser();
    if (!user) return alert("Login first");

    // Animate immediately for responsiveness
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    try {
      const favCollection = await getFavoritesCollection(user.id);
      if (isFav) {
        await supabase.from("collection_recipes").delete()
          .eq("collection_id", favCollection.id).eq("recipe_id", recipeId);
      } else {
        await supabase.from("collection_recipes")
          .insert({ collection_id: favCollection.id, recipe_id: recipeId });
      }
      setIsFav(!isFav);
    } catch { /* ignore */ }
  }

  async function openCollectionsModal() {
    const user = await getUser();
    if (!user) return alert("Login first");
    const { data } = await supabase
      .from("collections").select("*").eq("user_id", user.id).neq("name", "Favorites");
    const colls = data || [];
    setCollections(colls);

    // Check which collections already have this recipe
    const states: Record<string, boolean> = {};
    await Promise.all(colls.map(async (c) => {
      const { data: existing } = await supabase
        .from("collection_recipes").select("*")
        .eq("collection_id", c.id).eq("recipe_id", recipeId).maybeSingle();
      states[c.id] = !!existing;
    }));
    setCollectionStates(states);
    setShowModal(true);
  }

  async function toggleInCollection(collectionId: string) {
    const inCollection = collectionStates[collectionId];
    if (inCollection) {
      await supabase.from("collection_recipes").delete()
        .eq("collection_id", collectionId).eq("recipe_id", recipeId);
    } else {
      await supabase.from("collection_recipes")
        .insert({ collection_id: collectionId, recipe_id: recipeId });
    }
    setCollectionStates(prev => ({ ...prev, [collectionId]: !inCollection }));
  }

  async function createCollection() {
    const user = await getUser();
    if (!user || !newCollectionName.trim()) return;
    setCreating(true);
    const { data: newCol, error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name: newCollectionName, is_public: false })
      .select().single();
    setCreating(false);
    if (error || !newCol) return;
    // Auto-add recipe to the new collection
    await supabase.from("collection_recipes")
      .insert({ collection_id: newCol.id, recipe_id: recipeId });
    setCollections(prev => [...prev, newCol]);
    setCollectionStates(prev => ({ ...prev, [newCol.id]: true }));
    setNewCollectionName("");
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {/* ── Heart / Favourite button ── */}
        <button
          onClick={toggleFavorite}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            background: isFav ? "var(--accent-light)" : "var(--card)",
            color: isFav ? "var(--accent)" : "var(--muted)",
            border: `1.5px solid ${isFav ? "var(--accent)" : "var(--border-light)"}`,
            borderRadius: "8px",
            padding: "0.5rem 0.9rem",
            fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: isFav ? "0 2px 0 var(--accent-light)" : "0 2px 0 var(--border-light)",
            transition: "all 0.2s ease",
          }}
        >
          <Heart
            size={17}
            strokeWidth={isFav ? 0 : 1.8}
            fill={isFav ? "var(--accent)" : "none"}
            style={{
              transition: "transform 0.35s cubic-bezier(0.17, 0.89, 0.32, 1.49), fill 0.2s ease",
              transform: animating ? "scale(1.4)" : "scale(1)",
            }}
          />
          {isFav ? "Saved" : "Save"}
        </button>

        {/* ── Add to Collection button ── */}
        <button
          onClick={openCollectionsModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1.5px solid var(--border-light)",
            borderRadius: "8px",
            padding: "0.5rem 0.9rem",
            fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 0 var(--border-light)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-light)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--card)";
          }}
        >
          <BookmarkPlus size={17} strokeWidth={1.8} />
          Add to Collection
        </button>
      </div>

      {/* ── Collections Modal ── */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
        >
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Your Collections</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {collections.length === 0 && (
                <p style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "1rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  No collections yet. Add one?
                </p>
              )}
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleInCollection(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: collectionStates[c.id] ? "var(--accent-light)" : "var(--background)",
                    border: `1.5px solid ${collectionStates[c.id] ? "var(--accent)" : "var(--border-light)"}`,
                    borderRadius: "8px",
                    fontFamily: "var(--body-font)",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                  }}
                >
                  <span>{c.name}</span>
                  {collectionStates[c.id] && (
                    <span style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 700 }}>✓ Added</span>
                  )}
                </button>
              ))}

              {/* New collection mini-form */}
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="New collection name…"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createCollection()}
                  style={{
                    flex: 1,
                    background: "var(--background)",
                    color: "var(--foreground)",
                    border: "1.5px solid var(--border)",
                    borderRadius: "8px",
                    padding: "0.5rem 0.75rem",
                    fontFamily: "var(--body-font)",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxShadow: "inset 0 1px 3px var(--shadow)",
                  }}
                />
                <button
                  onClick={createCollection}
                  disabled={creating || !newCollectionName.trim()}
                  style={{
                    background: "var(--accent)",
                    color: "var(--button-text)",
                    border: "1.5px solid var(--accent-hover)",
                    borderRadius: "8px",
                    padding: "0.5rem 0.75rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: "0 2px 0 var(--accent-hover)",
                    transition: "all 0.15s ease",
                    opacity: creating || !newCollectionName.trim() ? 0.6 : 1,
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}