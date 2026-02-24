"use client";
import { supabase } from "@/lib/supabaseClient";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, ChefHat } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/");
    });
  }, [router]);

  function validatePassword(pw: string) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);
  }

  async function handleLogin() {
    setError(null); setSuccess(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message.includes("Invalid login credentials")
        ? "Wrong email or password"
        : error.message);
    } else {
      setSuccess("Welcome back! Redirecting…");
      router.replace("/");
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) setError(error.message);
    else setSuccess("Password reset email sent! Check your inbox.");
  }

  async function handleSignup() {
    setError(null); setSuccess(null);
    if (!validatePassword(password)) {
      setError("Password needs 8+ chars, one uppercase, one number & one special character.");
      return;
    }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: "https://yourproject.vercel.app/login" },
    });
    setLoading(false);
    if (signUpError) { setError(signUpError.message); return; }
    if (data.user) {
      setSuccess("Account created! Check your email to confirm.");
      setEmail(""); setPassword(""); setConfirmPassword("");
      setIsRegister(false);
      router.replace("/profile?new=true");
    }
  }

  return (
    <>
      <Head>
        <title>{isRegister ? "Register" : "Login"} | Get Stuffed !</title>
      </Head>

      <div className="form-page-wrapper">
        <div className="cookbook-form-card">

          <div className="form-card-header form-card-header--center">
            <div className="form-card-icon">
              <ChefHat size={28} strokeWidth={1.5} />
            </div>
            <h1 className="form-card-title">
              {isRegister ? "Join the Kitchen" : "Welcome Back"}
            </h1>
            <p className="form-card-subtitle">
              {isRegister ? "Create your recipe account" : "Sign in to your cookbook"}
            </p>
          </div>

          <div className="form-section">
            {/* Email */}
            <div className="form-field">
              <label className="form-label">Email</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="form-input form-input--icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isRegister && handleLogin()}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-field">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <span className="form-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isRegister ? "Min. 8 chars, uppercase, number…" : "Your password"}
                  className="form-input form-input--icon form-input--toggle"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isRegister && handleLogin()}
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

            {/* Confirm Password (register only) */}
            {isRegister && (
              <div className="form-field">
                <label className="form-label">Confirm Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    className="form-input form-input--icon form-input--toggle"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="form-eye-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword
                      ? <EyeOff className="eye-icon eye-icon--closed" />
                      : <Eye className="eye-icon eye-icon--open" />
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-section form-section--no-top">
            {isRegister ? (
              <button className="form-btn-primary" onClick={handleSignup} disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
            ) : (
              <button className="form-btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            )}

            <div className="form-links">
              <button
                className="form-link"
                onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); }}
              >
                {isRegister ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
              {!isRegister && (
                <button className="form-link form-link--muted" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              )}
            </div>
          </div>

          {error && <div className="form-section form-section--no-top"><div className="form-alert form-alert--error">{error}</div></div>}
          {success && <div className="form-section form-section--no-top"><div className="form-alert form-alert--success">{success}</div></div>}

        </div>
      </div>
    </>
  );
}