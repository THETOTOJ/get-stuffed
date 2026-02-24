"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import SortableImageUploader from "@/components/SortableImageUploader";
import Head from "next/head";
import { useRouter } from "next/router";
import { Clock, ChevronDown, ChevronUp, Check } from "lucide-react";

type Option = { id: string; name: string };

function Checklist({
  label,
  options,
  selected,
  setSelected,
  emoji,
}: {
  label: string;
  options: Option[];
  selected: string[];
  setSelected: (v: string[]) => void;
  emoji?: string;
}) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    setSelected(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  }

  const selectedNames = options
    .filter((o) => selected.includes(o.id))
    .map((o) => o.name);

  return (
    <div className="checklist-wrapper">
      <button
        type="button"
        className="checklist-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="checklist-trigger-left">
          {emoji && <span>{emoji}</span>}
          <span>{label}</span>
          {selected.length > 0 && (
            <span className="checklist-badge">{selected.length}</span>
          )}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {selectedNames.length > 0 && !open && (
        <div className="checklist-chips">
          {selectedNames.map((name) => (
            <span key={name} className="checklist-chip">{name}</span>
          ))}
        </div>
      )}

      {open && (
        <div className="checklist-dropdown">
          {options.length === 0 ? (
            <p className="checklist-empty">No options available</p>
          ) : (
            options.map((opt) => (
              <div
                key={opt.id}
                className="checklist-option"
                onClick={() => toggle(opt.id)}
              >
                <span
                  className={`checklist-checkbox ${selected.includes(opt.id) ? "checklist-checkbox--checked" : ""}`}
                >
                  {selected.includes(opt.id) && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="checklist-option-name">{opt.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NewRecipe() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [cook_time_mins, setCookTime] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<Option[]>([]);
  const [efforts, setEfforts] = useState<Option[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEfforts, setSelectedEfforts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth/login");
      else setLoading(false);
    });
    supabase.from("tags").select("*").then(({ data }) => setTags(data || []));
    supabase.from("efforts").select("*").then(({ data }) => setEfforts(data || []));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be logged in."); setSubmitting(false); return; }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({ title, ingredients, instructions, cook_time_mins, user_id: user.id })
      .select()
      .single();

    if (recipeError) { setError(recipeError.message); setSubmitting(false); return; }

    const recipeId = recipe.id;

    if (selectedTags.length > 0) {
      await supabase.from("recipe_tags").insert(
        selectedTags.map((tag_id) => ({ recipe_id: recipeId, tag_id }))
      );
    }
    if (selectedEfforts.length > 0) {
      await supabase.from("recipe_efforts").insert(
        selectedEfforts.map((effort_id) => ({ recipe_id: recipeId, effort_id }))
      );
    }
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${recipeId}/${Date.now()}-${i}.${ext}`;
      const { data: uploaded, error: imgErr } = await supabase.storage
        .from("recipe-images")
        .upload(path, file, { upsert: true });
      if (!imgErr && uploaded) {
        await supabase.from("recipe_images").insert({
          recipe_id: recipeId,
          image_url: uploaded.path,
          sort_order: i,
        });
      }
    }

    setSuccess("Recipe saved! Redirecting…");
    setTimeout(() => router.push(`/recipes/${recipeId}`), 800);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="form-page-wrapper">
        <p style={{ fontFamily: "var(--hand-font, 'Caveat', cursive)", color: "var(--muted)", fontSize: "1.2rem" }}>
          Checking your apron…
        </p>
      </div>
    );
  }

  return (
    <>
      <Head><title>Add New Recipe | Get Stuffed !</title></Head>

      <div className="form-page-wrapper">
        <form onSubmit={handleSubmit} className="cookbook-form-card cookbook-form-card--wide">

          <div className="form-card-header">
            <h1 className="form-card-title">New Recipe</h1>
            <p className="form-card-subtitle">Share something delicious 🍳</p>
          </div>

          {/* Photos */}
          <div className="form-section">
            <label className="form-label">Photos</label>
            <SortableImageUploader
              images={images}
              setImages={setImages}
              previews={previews}
              setPreviews={setPreviews}
            />
          </div>

          <div className="form-divider" />

          {/* Title + Cook Time */}
          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Recipe Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grandma's Apple Crumble"
                className="form-input"
                required
              />
            </div>

<div className="form-field">
  <label className="form-label">Cook Time</label>
  <div className="form-input-wrapper">
    <span className="form-input-icon">
      <Clock size={16} />
    </span>
    <input
      value={cook_time_mins}
      type="number"
      onChange={(e) => setCookTime(e.target.value)}
      onKeyDown={(e) => {
        // Allow: backspace, delete, tab, escape, enter, arrow keys, home, end
        if (
          e.key === 'Backspace' ||
          e.key === 'Delete' ||
          e.key === 'Tab' ||
          e.key === 'Escape' ||
          e.key === 'Enter' ||
          e.key === 'Home' ||
          e.key === 'End' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight'
        ) {
          return; // Allow these keys
        }
        
        // Allow Ctrl+A (select all), Ctrl+C (copy), Ctrl+V (paste), Ctrl+X (cut)
        if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
          return;
        }
        
        // Block any key that's not a number
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      }}
      onPaste={(e) => {
        // Get pasted data
        const pastedText = e.clipboardData.getData('text');
        
        // Check if pasted text contains only numbers
        if (!/^\d+$/.test(pastedText)) {
          e.preventDefault();
        }
      }}
      placeholder="Minutes"
      className="form-input form-input--icon"
      style={{ appearance: "textfield" }}
      min="0" // Optional: prevents negative numbers via arrows
      step="1" // Optional: ensures whole numbers
    />
  </div>
</div>
          </div>

          <div className="form-divider" />

          {/* Ingredients + Instructions */}
          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Ingredients</label>
              <p className="form-hint">One per line works great</p>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder={"2 cups flour\n1 tsp vanilla\n3 eggs…"}
                className="form-input form-textarea"
                rows={6}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Instructions</label>
              <p className="form-hint">Step by step, or freestyle</p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={"1. Preheat oven to 180°C\n2. Mix the dry ingredients…"}
                className="form-input form-textarea"
                rows={8}
              />
            </div>
          </div>

          <div className="form-divider" />

          {/* Tags & Efforts */}
          <div className="form-section">
            <label className="form-label">Categories</label>
            <Checklist
              label="Effort Level"
              options={efforts}
              selected={selectedEfforts}
              setSelected={setSelectedEfforts}
              emoji="⏳"
            />
            <Checklist
              label="Dietary Tags"
              options={tags}
              selected={selectedTags}
              setSelected={setSelectedTags}
              emoji="🏷️"
            />
          </div>

          {/* Submit */}
          <div className="form-section form-section--no-top">
            <button type="submit" className="form-btn-primary" disabled={submitting}>
              {submitting ? "Saving recipe…" : "Save Recipe"}
            </button>
            {error && <div className="form-alert form-alert--error">{error}</div>}
            {success && <div className="form-alert form-alert--success">{success}</div>}
          </div>

        </form>
      </div>
    </>
  );
}