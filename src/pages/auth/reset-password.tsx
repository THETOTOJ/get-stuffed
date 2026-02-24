"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleReset() {
    setSaving(true); setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { setMessage(error.message); setIsError(true); }
    else { setMessage("Password updated! You can now log in."); setIsError(false); }
  }

  return (
    <>
      <Head><title>Reset Password | Get Stuffed !</title></Head>

      <div className="form-page-wrapper">
        <div className="cookbook-form-card cookbook-form-card--narrow">

          <div className="form-card-header form-card-header--center">
            <div className="form-card-icon">
              <KeyRound size={26} strokeWidth={1.5} />
            </div>
            <h1 className="form-card-title">New Password</h1>
            <p className="form-card-subtitle">Choose a fresh password below</p>
          </div>

          <div className="form-section">
            <div className="form-field">
              <label className="form-label">New Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters…"
                  className="form-input form-input--icon form-input--toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
                <button
                  type="button"
                  className="form-eye-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="eye-icon eye-icon--closed" />
                    : <Eye className="eye-icon eye-icon--open" />
                  }
                </button>
              </div>
            </div>

            <button className="form-btn-primary" onClick={handleReset} disabled={saving}>
              {saving ? "Updating…" : "Update Password"}
            </button>

            {message && (
              <div className={`form-alert ${isError ? "form-alert--error" : "form-alert--success"}`}>
                {message}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}