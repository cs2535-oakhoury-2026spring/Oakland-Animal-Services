import { useState } from "react";
import { useResponsive } from "../hooks.js";
import { api } from "../api.js";
import Icons from "../Icons.jsx";
import "./LoginScreen.css";

// ─── Login Screen ─────────────────────────────────────────────────────────────
export default function LoginScreen({ darkMode, setDarkMode, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const r = useResponsive();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.login(username.trim(), password);
      onLogin(data.accessToken);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      {/* Top bar */}
      <div className="login-screen__topbar">
        <div className="login-screen__topbar-spacer" />
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="login-screen__logo" />
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="login-screen__theme-btn"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
        </button>
      </div>

      {/* Login card */}
      <div className="login-screen__body" style={{ padding: r.padding }}>
        <div className="login-screen__card">
          {/* Icon */}
          <div className="login-screen__icon-circle">
            <Icons.shield size={26} color="var(--clr-header-green)" />
          </div>
          <h1 className="login-screen__title">Staff Login</h1>
          <p className="login-screen__subtitle">Oakland Animal Services Portal</p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <label className="login-screen__label">Username</label>
            <div className="login-screen__input-wrap">
              <div className="login-screen__input-icon">
                <Icons.user size={16} color="var(--clr-warm-gray)" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                className={`login-screen__input${error ? " login-screen__input--error" : ""}`}
                               aria-label="Username"
              />
            </div>

            {/* Password */}
            <label className="login-screen__label">Password</label>
            <div className="login-screen__input-wrap login-screen__input-wrap--password">
              <div className="login-screen__input-icon">
                <Icons.lock size={16} color="var(--clr-warm-gray)" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`login-screen__input login-screen__input--password${error ? " login-screen__input--error" : ""}`}
                               aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-screen__toggle-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Icons.eyeOff size={16} color="var(--clr-warm-gray)" /> : <Icons.eye size={16} color="var(--clr-warm-gray)" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="login-screen__error" role="alert">
                <Icons.alertCircle size={16} color="#BE3A2B" />
                <span className="login-screen__error-text">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="login-screen__submit-btn"
                         >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="login-screen__footer-note">
            Locked out? Contact your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
