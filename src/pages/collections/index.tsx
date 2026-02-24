"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Tables } from "@/types/database.types";
import Head from "next/head";
import { Plus, Globe, Lock } from "lucide-react";

type CollectionWithCount = Tables<"collections"> & { recipeCount: number };

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("collections").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Get recipe counts
    const withCounts: CollectionWithCount[] = await Promise.all(
      (data || []).map(async (c) => {
        const { count } = await supabase
          .from("collection_recipes").select("*", { count: "exact", head: true })
          .eq("collection_id", c.id);
        return { ...c, recipeCount: count || 0 };
      })
    );
    setCollections(withCounts);
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>My Collections | Get Stuffed !</title>
        <meta property="og:title" content="My Collections | Get Stuffed !" />
        <meta property="og:description" content="Organise your favourite recipes into collections." />
        <meta property="og:type" content="website" />
      </Head>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <h1 className="page-heading">My Collections</h1>
          <Link href="/collections/new" className="btn-primary">
            <Plus size={16} /> New Collection
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)", fontFamily: "var(--hand-font)", fontSize: "1.1rem" }}>
            Gathering your collections…
          </div>
        ) : collections.length === 0 ? (
          <div className="collection-empty-state">
            <div className="collection-empty-icon">📚</div>
            <h2 className="collection-empty-title">No collections yet</h2>
            <p className="collection-empty-hint">Create a collection to organise your favourite recipes</p>
            <Link href="/collections/new" className="btn-primary" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
              <Plus size={16} /> Create Collection
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.1rem" }}>
            {collections.map(c => (
              <Link key={c.id} href={`/collections/${c.id}`} className="collection-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                  <h2 className="collection-title">{c.name || "Untitled"}</h2>
                  <span style={{ color: "var(--muted)", flexShrink: 0, marginTop: "0.2rem" }}>
                    {c.is_public ? <Globe size={15} strokeWidth={1.5} /> : <Lock size={15} strokeWidth={1.5} />}
                  </span>
                </div>
                <p className="collection-meta">
                  {c.recipeCount === 0
                    ? "Empty collection"
                    : `${c.recipeCount} recipe${c.recipeCount !== 1 ? "s" : ""}`}
                </p>
                {c.description && (
                  <p style={{ fontFamily: "var(--body-font)", fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.4rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {c.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
