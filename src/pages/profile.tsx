"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Tables } from "@/types/database.types";
import Image from "next/image";
import Head from "next/head";
import imageCompression from "browser-image-compression";
import { User, FileText, Camera, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const [userData, setUserData] = useState<Tables<"users"> | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setError(null); setSuccess(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (error) { setError(error.message); return; }
    setUserData(data);
    setUsername(data?.username || "");
    setBio(data?.bio || "");
    if (data?.profile_picture) {
      const { data: urlData } = supabase.storage.from("profile_pics").getPublicUrl(data.profile_picture);
      setPreview(urlData?.publicUrl || null);
    } else {
      setPreview(null);
    }
  }

  async function saveProfile() {
    setError(null); setSuccess(null); setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let profile_picture = userData?.profile_picture;
    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("profile_pics")
        .upload(filePath, file, { upsert: true });
      if (error) { setError(error.message); setSaving(false); return; }
      profile_picture = data?.path;
    }
    const { error: updateError } = await supabase
      .from("users")
      .update({ username, bio, profile_picture })
      .eq("id", user.id);
    setSaving(false);
    if (updateError) setError(updateError.message);
    else { setSuccess("Profile updated!"); load(); }
  }

  async function deleteProfilePicture() {
    setError(null); setSuccess(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (userData?.profile_picture) {
      const { error: deleteError } = await supabase.storage
        .from("profile_pics")
        .remove([userData.profile_picture]);
      if (deleteError) { setError(deleteError.message); return; }
    }
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_picture: null })
      .eq("id", user.id);
    if (updateError) setError(updateError.message);
    else { setPreview(null); setFile(null); setSuccess("Profile picture removed!"); load(); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;
    try {
      const compressed = await imageCompression(selectedFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }

  const initials = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <>
      <Head><title>My Profile | Get Stuffed !</title></Head>

      <div className="form-page-wrapper">
        <div className="cookbook-form-card">

          <div className="form-card-header">
            <h1 className="form-card-title">My Profile</h1>
            <p className="form-card-subtitle">Update your chef&apos;s profile ✨</p>
          </div>

          <div className="avatar-section">
            <div className="avatar-ring" onClick={() => fileInputRef.current?.click()}>
              {preview ? (
                <Image
                  src={preview}
                  alt="Profile"
                  width={100}
                  height={100}
                  className="avatar-img"
                  quality={95}
                />
              ) : (
                <span>{initials}</span>
              )}
              <div className="avatar-overlay">
                <Camera size={22} strokeWidth={1.5} />
              </div>
            </div>

            <div className="avatar-actions">
              <button
                type="button"
                className="form-btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? "Change photo" : "Upload photo"}
              </button>
              {preview && (
                <button
                  type="button"
                  className="avatar-remove-btn"
                  onClick={deleteProfilePicture}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <div className="form-divider" />

          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Username</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">
                  <User size={16} />
                </span>
                <input
                  className="form-input form-input--icon"
                  placeholder="Your display name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Bio
                <span className="form-label-count">{bio.length}/200</span>
              </label>
              <div className="form-input-wrapper form-input-wrapper--top">
                <span className="form-input-icon form-input-icon--top">
                  <FileText size={16} />
                </span>
                <textarea
                  className="form-input form-textarea form-input--icon"
                  placeholder="Tell us about your cooking style…"
                  value={bio}
                  maxLength={200}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <button className="form-btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </button>

            {error && <div className="form-alert form-alert--error">{error}</div>}
            {success && <div className="form-alert form-alert--success">{success}</div>}
          </div>

        </div>
      </div>
    </>
  );
}