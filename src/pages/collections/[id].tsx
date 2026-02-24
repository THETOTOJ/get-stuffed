"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Tables } from "@/types/database.types";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Globe, Lock, Clock, ArrowLeft, ChefHat } from "lucide-react";

type RecipeWithImage = Tables<"recipes"> & { firstImageUrl: string | null };

export default function CollectionPage() {
  const params = useParams();
  const id = params?.id as string;
  const [collection, setCollection] = useState<Tables<"collections"> | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: coll } = await supabase
      .from("collections").select("*").eq("id", id).single();
    setCollection(coll);

    const { data: collectionRecipes } = await supabase
      .from("collection_recipes")
      .select("recipes(*, recipe_images(image_url, sort_order))")
      .eq("collection_id", id)
      .returns<{ recipes: Tables<"recipes"> & { recipe_images: { image_url: string; sort_order: number }[] } }[]>();

    const mappedRecipes: RecipeWithImage[] = await Promise.all(
      (collectionRecipes || [])
        .map(r => r.recipes)
        .filter(Boolean)
        .map(async (recipe) => {
          const sorted = [...(recipe.recipe_images || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          const first = sorted[0];
          let imageUrl: string | null = null;
          if (first) {
            const { data: signedUrl } = await supabase.storage
              .from("recipe-images").createSignedUrl(first.image_url, 3600);
            if (signedUrl) imageUrl = signedUrl.signedUrl;
          }
          return { ...recipe, firstImageUrl: imageUrl };
        })
    );

    setRecipes(mappedRecipes);
    setLoading(false);
  }, [id]);

  useEffect(() => { if (id) load(); }, [load, id]);

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center", color: "var(--muted)", fontFamily: "var(--hand-font)", fontSize: "1.1rem", paddingTop: "4rem" }}>
        Opening cookbook…
      </div>
    );
  }

  if (!collection) return <p style={{ padding: "2rem", color: "var(--muted)" }}>Collection not found.</p>;

  return (
    <>
      <Head>
        <title>{collection.name ? `${collection.name} | Get Stuffed !` : "Collection | Get Stuffed !"}</title>
      </Head>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        {/* Back link */}
        <Link href="/collections" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--muted)", fontFamily: "var(--body-font)", fontSize: "0.9rem", marginBottom: "1.25rem", textDecoration: "none" }}>
          <ArrowLeft size={15} /> Back to Collections
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
            <h1 className="page-heading">{collection.name}</h1>
            <span style={{ color: "var(--muted)" }}>
              {collection.is_public ? <Globe size={18} strokeWidth={1.5} /> : <Lock size={18} strokeWidth={1.5} />}
            </span>
          </div>
          <p style={{ fontFamily: "var(--hand-font)", fontSize: "1rem", color: "var(--muted)" }}>
            {recipes.length === 0
              ? "This collection is empty"
              : `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Empty state */}
        {recipes.length === 0 ? (
          <div className="collection-empty-state">
            <div className="collection-empty-icon">🍽️</div>
            <h2 className="collection-empty-title">Nothing here yet</h2>
            <p className="collection-empty-hint">Browse recipes and save them to this collection</p>
            <Link href="/recipes" className="btn-primary" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
              <ChefHat size={16} /> Browse Recipes
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.1rem" }}>
            {recipes.map((r, i) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="recipe-card"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div>
                  {r.firstImageUrl ? (
                    <Image
                      src={r.firstImageUrl}
                      alt={r.title}
                      width={300}
                      height={168}
                      className="recipe-card-img"
                      quality={85}
                    />
                  ) : (
                    <div className="recipe-card-placeholder">🍽️</div>
                  )}
                </div>
                <div className="recipe-card-body">
                  <h2 className="recipe-card-title">{r.title}</h2>
                  {r.cook_time_mins && (
                    <p className="recipe-card-meta">
                      <Clock size={13} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
                      {r.cook_time_mins} min
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}