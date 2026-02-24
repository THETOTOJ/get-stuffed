"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SortableImageUploader from "@/components/SortableImageUploader";
import { useParams, useRouter } from "next/navigation";
import RecipeImageGallery from "@/components/RecipeImageGallery";
import RecipeActions from "@/components/RecipeActions";
import Image from "next/image";
import type { Tables } from "@/types/database.types";
import Head from "next/head";
import { Clock, Tag, Zap, ArrowLeft, Edit2, Check, X, Trash2 } from "lucide-react";

type RecipeImage = { id: string; image_url: string; sort_order: number };
type RecipeTag = { tags: { id: string; name: string } };
type RecipeEffort = { efforts: { id: string; name: string } };
type Recipe = Tables<"recipes"> & {
  recipe_images?: RecipeImage[];
  recipe_tags?: RecipeTag[];
  recipe_efforts?: RecipeEffort[];
  user_id?: string;
};
type UserProfile = { username: string; profile_picture: string | null };
type Comment = {
  id: string; user_id: string; recipe_id: string; body: string;
  created_at: string; rating?: number | null;
  users?: UserProfile & { profile_picture_url?: string | null };
};
type Option = { id: string; name: string };

function Checklist({ label, options, selected, setSelected }: {
  label: string; options: Option[]; selected: string[];
  setSelected: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(id: string) {
    setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  }
  return (
    <div className="checklist-wrapper">
      <button type="button" className="checklist-trigger" onClick={() => setOpen(!open)}>
        <span className="checklist-trigger-left">
          <span>{label}</span>
          {selected.length > 0 && <span className="checklist-badge">{selected.length}</span>}
        </span>
        <span style={{ opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="checklist-dropdown">
          {options.map(opt => (
            <label key={opt.id} className="checklist-option">
              <span className={`checklist-checkbox ${selected.includes(opt.id) ? "checklist-checkbox--checked" : ""}`}>
                {selected.includes(opt.id) && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="checklist-option-name">{opt.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** Parse ingredients text into an array of lines */
function parseIngredients(text: string): string[] {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

/** Parse instructions into numbered steps */
function parseInstructions(text: string): string[] {
  return text
    .split("\n")
    .map(l => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
}

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [efforts, setEfforts] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cookTimeMins, setCookTimeMins] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dbImages, setDbImages] = useState<RecipeImage[]>([]);
  const [allTags, setAllTags] = useState<Option[]>([]);
  const [allEfforts, setAllEfforts] = useState<Option[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEfforts, setSelectedEfforts] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  const loadOptions = useCallback(async () => {
    const { data: t } = await supabase.from("tags").select("*");
    const { data: e } = await supabase.from("efforts").select("*");
    setAllTags(t || []);
    setAllEfforts(e || []);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("recipes")
      .select("*, recipe_images(*), recipe_tags(tags(id,name)), recipe_efforts(efforts(id,name))")
      .eq("id", id).single();
    if (error) return;

    setRecipe(data as Recipe);
    setTitle(data.title);
    setIngredients(data.ingredients || "");
    setInstructions(data.instructions || "");
    setCookTimeMins(data.cook_time_mins?.toString() || "");

    if (data.recipe_tags) {
      setTags(data.recipe_tags.map((rt: RecipeTag) => rt.tags.name));
      setSelectedTags(data.recipe_tags.map((rt: RecipeTag) => rt.tags.id));
    }
    if (data.recipe_efforts) {
      setEfforts(data.recipe_efforts.map((re: RecipeEffort) => re.efforts.name));
      setSelectedEfforts(data.recipe_efforts.map((re: RecipeEffort) => re.efforts.id));
    }
    if (data.user_id) {
      const { data: profile } = await supabase.from("users").select("username").eq("id", data.user_id).single();
      if (profile) setAuthor(profile.username);
    }
    if (data.recipe_images?.length > 0) {
      const sorted = [...data.recipe_images].sort((a: RecipeImage, b: RecipeImage) => a.sort_order - b.sort_order);
      setDbImages(sorted);
      const urls = await Promise.all(sorted.map(async (img: RecipeImage) => {
        const { data: su } = await supabase.storage.from("recipe-images").createSignedUrl(img.image_url, 3600);
        return su?.signedUrl ?? null;
      }));
      setPreviews(urls.filter((u): u is string => u !== null));
      setImages([]);
    } else {
      setDbImages([]); setPreviews([]); setImages([]);
    }
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("comments")
      .select("*, users(username,profile_picture)")
      .eq("recipe_id", id).order("created_at", { ascending: false });
    const withUrls = await Promise.all((data || []).map(async (c: Comment) => {
      if (c.users?.profile_picture) {
        const { data: su } = await supabase.storage.from("profile_pics").createSignedUrl(c.users.profile_picture, 3600);
        return { ...c, users: { ...c.users, profile_picture_url: su?.signedUrl || null } };
      }
      return c;
    }));
    setComments(withUrls);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load(); loadComments(); loadOptions();
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); });
  }, [id, load, loadComments, loadOptions]);

  async function submitComment() {
    if (!userId) return alert("Please log in to comment");
    if (!newComment.trim()) return;
    await supabase.from("comments").insert({ user_id: userId, recipe_id: id, body: newComment.trim(), rating: null });
    setNewComment(""); loadComments();
  }

  async function deleteComment(commentId: string) {
    await supabase.from("comments").delete().eq("id", commentId).eq("user_id", userId);
    loadComments();
  }

  async function saveChanges() {
    if (!userId || !recipe || recipe.user_id !== userId) return;
    await supabase.from("recipes").update({
      title, ingredients, instructions,
      cook_time_mins: cookTimeMins ? parseInt(cookTimeMins) : null
    }).eq("id", id);
    await supabase.from("recipe_tags").delete().eq("recipe_id", id);
    if (selectedTags.length > 0) await supabase.from("recipe_tags").insert(selectedTags.map(tag_id => ({ recipe_id: id, tag_id })));
    await supabase.from("recipe_efforts").delete().eq("recipe_id", id);
    if (selectedEfforts.length > 0) await supabase.from("recipe_efforts").insert(selectedEfforts.map(effort_id => ({ recipe_id: id, effort_id })));
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      if (!(file instanceof File)) continue;
      const ext = file.name.split(".").pop();
      const path = `${userId}/${id}/${Date.now()}-${i}.${ext}`;
      const { data: uploaded, error: imgErr } = await supabase.storage.from("recipe-images").upload(path, file, { upsert: true });
      if (!imgErr && uploaded) await supabase.from("recipe_images").insert({ recipe_id: id, image_url: uploaded.path, sort_order: dbImages.length + i });
    }
    setIsEditing(false); load();
  }

  async function deleteImage(index: number) {
    if (index < dbImages.length) {
      const img = dbImages[index];
      await supabase.storage.from("recipe-images").remove([img.image_url]);
      await supabase.from("recipe_images").delete().eq("id", img.id);
      setDbImages(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      const localIndex = index - dbImages.length;
      setImages(prev => prev.filter((_, i) => i !== localIndex));
      setPreviews(prev => [...prev.slice(0, dbImages.length), ...prev.slice(dbImages.length).filter((_, i) => i !== localIndex)]);
    }
  }

  async function deleteRecipe() {
    if (!userId || !recipe || recipe.user_id !== userId) return;
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    if ((recipe.recipe_images?.length ?? 0) > 0) {
      await supabase.storage.from("recipe-images").remove((recipe.recipe_images ?? []).map(img => img.image_url));
    }
    await supabase.from("recipes").delete().eq("id", id);
    router.push("/recipes");
  }

  if (!recipe) return (
    <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--muted)", fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "1.2rem" }}>
      Opening the cookbook…
    </div>
  );

  const canEdit = userId === recipe.user_id;
  const ingredientLines = parseIngredients(recipe.ingredients || "");
  const instructionSteps = parseInstructions(recipe.instructions || "");

  return (
    <>
      <Head>
        <title>{recipe.title ? `${recipe.title} | Get Stuffed !` : "Recipe | Get Stuffed !"}</title>
      </Head>

      <div className="notebook-page">
        {/* Back link */}
        <a
          href="/recipes"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            color: "var(--muted)", fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
            fontSize: "0.9rem", marginBottom: "1.25rem", textDecoration: "none",
          }}
        >
          <ArrowLeft size={15} /> All Recipes
        </a>

        {/* ── EDIT MODE ── Plain, functional */}
        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <h1 style={{ fontFamily: "var(--header-font)", fontStyle: "italic", fontSize: "1.6rem", margin: 0, color: "var(--foreground)" }}>
                Editing Recipe
              </h1>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="btn-primary" onClick={saveChanges}><Check size={15} /> Save</button>
                <button className="btn-muted" onClick={() => { setIsEditing(false); load(); }}><X size={15} /> Cancel</button>
                <button className="btn-danger" onClick={deleteRecipe}><Trash2 size={15} /> Delete</button>
              </div>
            </div>
            <SortableImageUploader images={images} setImages={setImages} previews={previews} setPreviews={setPreviews} onRemove={deleteImage} />
            <div className="form-field">
              <label className="form-label">Title</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Cook Time (minutes)</label>
              <input className="form-input" type="number" value={cookTimeMins} onChange={e => setCookTimeMins(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Ingredients</label>
              <p className="form-hint">One per line</p>
              <textarea className="form-input form-textarea" rows={6} value={ingredients} onChange={e => setIngredients(e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Instructions</label>
              <p className="form-hint">Steps will be automatically numbered</p>
              <textarea className="form-input form-textarea" rows={8} value={instructions} onChange={e => setInstructions(e.target.value)} />
            </div>
            <Checklist label="Effort" options={allEfforts} selected={selectedEfforts} setSelected={setSelectedEfforts} />
            <Checklist label="Tags" options={allTags} selected={selectedTags} setSelected={setSelectedTags} />
          </div>

        ) : (
          /* ── VIEW MODE — Notebook ── */
          <div className="notebook-paper">
            <div className="notebook-content">

              {/* Title & author */}
              <h1 className="notebook-title">{recipe.title}</h1>
              {author && (
                <p className="notebook-author">— by {author}</p>
              )}

              {/* Meta chips + edit button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <div className="notebook-meta">
                  {recipe.cook_time_mins && (
                    <span className="tag-pill tag-pill--accent">
                      <Clock size={12} /> {recipe.cook_time_mins} min
                    </span>
                  )}
                  {efforts.map(e => (
                    <span key={e} className="tag-pill"><Zap size={11} /> {e}</span>
                  ))}
                  {tags.map(t => (
                    <span key={t} className="tag-pill"><Tag size={11} /> {t}</span>
                  ))}
                </div>
                {canEdit && (
                  <button className="btn-secondary" onClick={() => setIsEditing(true)} style={{ fontSize: "0.85rem", padding: "0.35rem 0.8rem" }}>
                    <Edit2 size={13} /> Edit
                  </button>
                )}
              </div>

              {/* Actions (heart / save to collection) */}
              <div className="notebook-actions">
                <RecipeActions recipeId={id} />
              </div>

              <hr className="notebook-divider" />

              {/* Photos — polaroid style */}
              {previews.length > 0 && (
                <>
                  <p className="notebook-heading">📷 Photos</p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    {previews.length === 1 ? (
                      <div className="notebook-photo" style={{ maxWidth: "340px" }}>
                        <Image src={previews[0]} alt={recipe.title} width={320} height={220} style={{ width: "100%", height: "auto", objectFit: "cover" }} quality={90} />
                        <p className="notebook-photo-caption">{recipe.title}</p>
                      </div>
                    ) : (
                      <RecipeImageGallery images={previews} />
                    )}
                  </div>
                  <hr className="notebook-divider" />
                </>
              )}

              {/* Ingredients */}
              {ingredientLines.length > 0 && (
                <>
                  <p className="notebook-heading">🧺 Ingredients</p>
                  <ul className="notebook-ingredient-list" style={{ marginBottom: "1.5rem" }}>
                    {ingredientLines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                  <hr className="notebook-divider" />
                </>
              )}

              {/* Instructions */}
              {instructionSteps.length > 0 && (
                <>
                  <p className="notebook-heading">📝 Method</p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    {instructionSteps.map((step, i) => (
                      <div key={i} className="notebook-step">
                        <span className="notebook-step-num">{i + 1}.</span>
                        <span className="notebook-step-text">{step}</span>
                      </div>
                    ))}
                  </div>
                  <hr className="notebook-divider" />
                </>
              )}

              {/* Comments */}
              <p className="notebook-heading">
                💬 Notes {comments.length > 0 && (
                  <span style={{ fontFamily: "var(--body-font)", fontStyle: "normal", fontSize: "0.85rem", fontWeight: 400, color: "var(--muted)", marginLeft: "0.25rem" }}>
                    ({comments.length})
                  </span>
                )}
              </p>

              {userId && (
                <div className="sticky-note" style={{ marginBottom: "1.25rem" }}>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a note about this recipe…"
                    rows={3}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontFamily: "var(--hand-font, 'Caveat', cursive)",
                      fontSize: "1.05rem",
                      color: "var(--foreground)",
                      lineHeight: 1.7,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
                    <button
                      onClick={submitComment}
                      className="btn-primary"
                      style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
                    >
                      Post Note
                    </button>
                  </div>
                </div>
              )}

              {comments.length === 0 ? (
                <p style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", fontSize: "1rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  No notes yet — be the first to leave one!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "0.5rem" }}>
                  {comments.map(comment => (
                    <div key={comment.id} className="notebook-comment">
                      <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                        {/* Avatar */}
                        <div className="comment-avatar" style={{ flexShrink: 0, marginTop: "0.1rem" }}>
                          {comment.users?.profile_picture_url ? (
                            <Image
                              src={comment.users.profile_picture_url}
                              alt={comment.users.username || ""}
                              width={38} height={38}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              quality={90}
                            />
                          ) : (
                            <span>{(comment.users?.username || "?").charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                            <span style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", fontWeight: 700, fontSize: "1.05rem", color: "var(--accent)" }}>
                              {comment.users?.username || "Anonymous"}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ fontFamily: "var(--body-font)", fontSize: "0.78rem", color: "var(--muted)" }}>
                                {new Date(comment.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              {comment.user_id === userId && (
                                <button
                                  onClick={() => deleteComment(comment.id)}
                                  style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.78rem", fontFamily: "var(--body-font)", padding: 0, transition: "color 0.15s" }}
                                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#b03020"}
                                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)"}
                                >
                                  delete
                                </button>
                              )}
                            </div>
                          </div>
                          <p style={{
                            fontFamily: "var(--body-font, 'Crimson Pro', Georgia, serif)",
                            fontSize: "0.98rem", lineHeight: 1.7,
                            color: "var(--foreground)", whiteSpace: "pre-wrap", margin: 0,
                          }}>
                            {comment.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>{/* /notebook-content */}
          </div> /* /notebook-paper */
        )}
      </div>
    </>
  );
}