"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { BookOpen, Globe, Lock } from "lucide-react";

export default function NewCollection() {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function createCollection() {
    if (!name.trim()) { setError("Please give your collection a name"); return; }
    setSaving(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return alert("Login first"); }
    const { error } = await supabase
      .from("collections")
      .insert({ user_id: user.id, name, is_public: isPublic });
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/collections");
  }

  return (
    <>
      <Head><title>Create Collection | Get Stuffed !</title></Head>

      <div className="form-page-wrapper">
        <div className="cookbook-form-card cookbook-form-card--narrow">

          <div className="form-card-header form-card-header--center">
            <div className="form-card-icon">
              <BookOpen size={26} strokeWidth={1.5} />
            </div>
            <h1 className="form-card-title">New Collection</h1>
            <p className="form-card-subtitle">Gather your favourite recipes ✂️</p>
          </div>

          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Collection Name</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">
                  <BookOpen size={16} />
                </span>
                <input
                  className="form-input form-input--icon"
                  placeholder="e.g. Sunday Bakes, Quick Dinners…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createCollection()}
                />
              </div>
            </div>

            {/* Visibility toggle */}
            <div
              className="visibility-toggle"
              onClick={() => setIsPublic(!isPublic)}
            >
              <div className={`visibility-icon ${isPublic ? "visibility-icon--public" : ""}`}>
                {isPublic ? <Globe size={18} strokeWidth={1.5} /> : <Lock size={18} strokeWidth={1.5} />}
              </div>
              <div className="visibility-text">
                <span className="visibility-label">
                  {isPublic ? "Public collection" : "Private collection"}
                </span>
                <span className="visibility-hint">
                  {isPublic
                    ? "Anyone can discover and view this collection"
                    : "Only you can see this collection"}
                </span>
              </div>
              <div className={`visibility-pill ${isPublic ? "visibility-pill--on" : ""}`}>
                <div className="visibility-knob" />
              </div>
            </div>

            <button className="form-btn-primary" onClick={createCollection} disabled={saving}>
              {saving ? "Creating…" : "Create Collection"}
            </button>

            {error && <div className="form-alert form-alert--error">{error}</div>}
          </div>

        </div>
      </div>
    </>
  );
}