import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { X, Plus, Clock } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

type Option = { id: string; name: string };

type RecipePreview = {
  id: string;
  title: string;
  cook_time_mins: number | null;
  firstImageUrl: string | null;
  imageLoaded: boolean;
  recipe_tags?: { tag_id: string }[];
  recipe_efforts?: { effort_id: string }[];
};

const QUICK_FILTERS = [
  { name: "Vegan", emoji: "🌱" },
  { name: "Vegetarian", emoji: "🥕" },
  { name: "Gluten Free", emoji: "🌾" },
  { name: "Egg Free", emoji: "🥚" },
  { name: "Dairy Free", emoji: "🥛" },
];

export default function RecipesIndexPage() {
  const [recipes, setRecipes] = useState<RecipePreview[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEfforts, setSelectedEfforts] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Option[]>([]);
  const [allEfforts, setAllEfforts] = useState<Option[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [effortsOpen, setEffortsOpen] = useState(false);

  useEffect(() => {
    checkUser();
    loadFilters();
    fetchRecipes();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...recipes];
    if (selectedTags.length > 0)
      filtered = filtered.filter(r => r.recipe_tags?.some(rt => selectedTags.includes(rt.tag_id)));
    if (selectedEfforts.length > 0)
      filtered = filtered.filter(r => r.recipe_efforts?.some(re => selectedEfforts.includes(re.effort_id)));
    setFilteredRecipes(filtered);
  }, [recipes, selectedTags, selectedEfforts]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id || null);
  }

  async function loadFilters() {
    const { data: tagsData } = await supabase.from("tags").select("*").order("name");
    const { data: effortsData } = await supabase.from("efforts").select("*").order("name");
    setAllTags(tagsData || []);
    setAllEfforts(effortsData || []);
  }

  async function fetchRecipes() {
    setLoading(true);
    const { data: recipesData, error } = await supabase
      .from("recipes")
      .select(`id, title, cook_time_mins, recipe_tags(tag_id), recipe_efforts(effort_id)`)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error || !recipesData) { setLoading(false); return; }

    const recipeIds = recipesData.map(r => r.id);
    const { data: imagesData } = await supabase
      .from("recipe_images").select("recipe_id, image_url, sort_order")
      .in("recipe_id", recipeIds).order("sort_order", { ascending: true });

    const recipesWithImages: RecipePreview[] = await Promise.all(
      recipesData.map(async (recipe) => {
        const firstImage = imagesData?.filter(img => img.recipe_id === recipe.id)[0];
        let imageUrl: string | null = null;
        if (firstImage) {
          const { data: signedUrl } = await supabase.storage
            .from("recipe-images").createSignedUrl(firstImage.image_url, 3600);
          if (signedUrl) imageUrl = signedUrl.signedUrl;
        }
        return {
          id: recipe.id, title: recipe.title,
          cook_time_mins: recipe.cook_time_mins,
          firstImageUrl: imageUrl, imageLoaded: false,
          recipe_tags: recipe.recipe_tags || [],
          recipe_efforts: recipe.recipe_efforts || [],
        };
      })
    );

    setRecipes(recipesWithImages);
    setFilteredRecipes(recipesWithImages);
    setLoading(false);
  }

  function setPresetFilter(tagName: string) {
    const tag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (tag) {
      setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]);
      setSelectedEfforts([]);
    }
  }

  function clearFilters() { setSelectedTags([]); setSelectedEfforts([]); }
  function toggleTag(id: string) { setSelectedTags(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function toggleEffort(id: string) { setSelectedEfforts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  const hasActiveFilters = selectedTags.length > 0 || selectedEfforts.length > 0;

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Get Stuffed ! | Recipe Collection</title></Head>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem 4rem" }}
        onClick={() => { setTagsOpen(false); setEffortsOpen(false); }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-heading">Recipes</h1>
            <p style={{ fontFamily: "var(--hand-font)", fontSize: "1.05rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              {filteredRecipes.length} of {recipes.length} recipes
            </p>
          </div>
          {userId && (
            <Link href="/recipes/new" className="btn-primary">
              <Plus size={16} /> New Recipe
            </Link>
          )}
        </div>

        {/* ── Quick Filters ── */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--body-font)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", whiteSpace: "nowrap" }}>
            Quick Filters
          </span>
          {QUICK_FILTERS.map(qf => {
            const tag = allTags.find(t => t.name.toLowerCase() === qf.name.toLowerCase());
            const isActive = tag ? selectedTags.includes(tag.id) : false;
            return (
              <button key={qf.name} className={`filter-btn ${isActive ? "active" : ""}`} onClick={() => setPresetFilter(qf.name)}>
                {qf.emoji} {qf.name}
              </button>
            );
          })}
        </div>

        {/* ── Dropdown Filters ── */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--body-font)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--muted)", whiteSpace: "nowrap" }}>
            Filter By
          </span>

          {/* Tags dropdown */}
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <button className="filter-dropdown-btn" onClick={() => { setTagsOpen(!tagsOpen); setEffortsOpen(false); }}>
              🏷️ Tags {selectedTags.length > 0 && <span style={{ background: "var(--accent)", color: "var(--button-text)", borderRadius: "20px", fontSize: "0.72rem", padding: "0.05rem 0.5rem", fontWeight: 700 }}>{selectedTags.length}</span>}
              <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{tagsOpen ? "▲" : "▼"}</span>
            </button>
            {tagsOpen && (
              <div className="filter-dropdown-panel" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "200px", zIndex: 20 }}>
                {allTags.map(t => (
                  <label key={t.id} className="filter-option">
                    <span style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `1.5px solid ${selectedTags.includes(t.id) ? "var(--accent)" : "var(--border)"}`,
                      background: selectedTags.includes(t.id) ? "var(--accent)" : "var(--background)",
                      color: "var(--button-text)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", flexShrink: 0, transition: "all 0.15s",
                    }}>{selectedTags.includes(t.id) ? "✓" : ""}</span>
                    <input type="checkbox" checked={selectedTags.includes(t.id)} onChange={() => toggleTag(t.id)} style={{ display: "none" }} />
                    {t.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Efforts dropdown */}
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <button className="filter-dropdown-btn" onClick={() => { setEffortsOpen(!effortsOpen); setTagsOpen(false); }}>
              ⏳ Effort {selectedEfforts.length > 0 && <span style={{ background: "var(--accent)", color: "var(--button-text)", borderRadius: "20px", fontSize: "0.72rem", padding: "0.05rem 0.5rem", fontWeight: 700 }}>{selectedEfforts.length}</span>}
              <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>{effortsOpen ? "▲" : "▼"}</span>
            </button>
            {effortsOpen && (
              <div className="filter-dropdown-panel" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "180px", zIndex: 20 }}>
                {allEfforts.map(e => (
                  <label key={e.id} className="filter-option">
                    <span style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: `1.5px solid ${selectedEfforts.includes(e.id) ? "var(--accent)" : "var(--border)"}`,
                      background: selectedEfforts.includes(e.id) ? "var(--accent)" : "var(--background)",
                      color: "var(--button-text)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", flexShrink: 0, transition: "all 0.15s",
                    }}>{selectedEfforts.includes(e.id) ? "✓" : ""}</span>
                    <input type="checkbox" checked={selectedEfforts.includes(e.id)} onChange={() => toggleEffort(e.id)} style={{ display: "none" }} />
                    {e.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button className="btn-secondary" onClick={clearFilters} style={{ padding: "0.4rem 0.8rem", fontSize: "0.88rem" }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
            {selectedTags.map(tagId => {
              const tag = allTags.find(t => t.id === tagId);
              return (
                <span key={tagId} className="tag-pill">
                  {tag?.name}
                  <button onClick={() => toggleTag(tagId)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex", lineHeight: 1 }}>
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {selectedEfforts.map(effortId => {
              const effort = allEfforts.find(e => e.id === effortId);
              return (
                <span key={effortId} className="tag-pill">
                  {effort?.name}
                  <button onClick={() => toggleEffort(effortId)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex", lineHeight: 1 }}>
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* ── Recipe Grid ── */}
        {filteredRecipes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>🍳</div>
            <p style={{ fontFamily: "var(--header-font)", fontStyle: "italic", fontSize: "1.4rem", color: "var(--foreground)", marginBottom: "0.5rem" }}>
              {hasActiveFilters ? "No matching recipes" : "Nothing here yet"}
            </p>
            <p style={{ fontFamily: "var(--hand-font)", fontSize: "1rem" }}>
              {hasActiveFilters ? "Try changing your filters" : "Be the first to add a recipe!"}
            </p>
            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              {hasActiveFilters && (
                <button className="btn-secondary" onClick={clearFilters}>Clear Filters</button>
              )}
              {!hasActiveFilters && userId && (
                <Link href="/recipes/new" className="btn-primary">+ New Recipe</Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {filteredRecipes.map((r, i) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="recipe-card"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Image */}
                <div style={{ position: "relative" }}>
                  {r.firstImageUrl ? (
                    <Image
                      src={r.firstImageUrl}
                      alt={r.title}
                      width={300}
                      height={168}
                      className="recipe-card-img"
                      onLoad={() => setFilteredRecipes(prev => prev.map(x => x.id === r.id ? { ...x, imageLoaded: true } : x))}
                      onError={e => { e.currentTarget.style.display = "none"; }}
                      priority={false}
                      quality={85}
                    />
                  ) : (
                    <div className="recipe-card-placeholder">🍽️</div>
                  )}
                </div>
                {/* Body */}
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