import { useState } from "react";
import { useResponsive } from "../hooks.js";
import { api, clearToken } from "../api.js";
import Icons from "../Icons.jsx";
import "./ForcePasswordChangeScreen.css";

// ─── Forced Password Change Screen ───────────────────────────────────────────
export default function ForcePasswordChangeScreen({ user, token, onPasswordChanged, onLogout, darkMode, setDarkMode }) {
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showTemp, setShowTemp] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const r = useResponsive();

  const mismatch = confirm && newPassword !== confirm;
  const tooShort = newPassword && newPassword.length < 8;
  const canSubmit = tempPassword && newPassword.length >= 8 && newPassword === confirm && !loading;

  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.changePassword(token, tempPassword, newPassword);
      // Old token is now invalid — clear session and force fresh login
      clearToken();
      sessionStorage.removeItem("oas_token");
      setDone(true);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="force-pw-screen">
      <div className="force-pw-screen__topbar">
        <div className="force-pw-screen__topbar-spacer" />
        <img src={darkMode ? "/oas-logo-invert.png" : "/oas-logo.jpg"} alt="Oakland Animal Services" className="force-pw-screen__logo" />
        <button onClick={() => setDarkMode(!darkMode)} className="force-pw-screen__theme-btn" aria-label="Toggle dark mode">
          {darkMode ? <Icons.sun size={18} color="#ffd700" /> : <Icons.moon size={18} color="var(--clr-text-secondary)" />}
        </button>
      </div>

      <div className="force-pw-screen__body" style={{ padding: r.padding }}>
        <div className="force-pw-screen__card">

          {done ? (
            <div className="force-pw-screen__success-wrap">
              <div className="force-pw-screen__success-icon">
                <Icons.check size={28} color="#4CAF50" />
              </div>
              <h1 className="force-pw-screen__title">Password Set!</h1>
              <p className="force-pw-screen__subtitle" style={{ marginBottom: 24 }}>Your password has been updated. Please sign in with your new password.</p>
              <button onClick={() => { onLogout(); }} className="force-pw-screen__submit-btn" style={{ marginTop: 0 }}>
                Go to Sign In
              </button>
            </div>
          ) : (<>

          <div className="force-pw-screen__warn-icon">
            <Icons.key size={26} color="#FFC107" />
          </div>
          <h1 className="force-pw-screen__title">Set Your Password</h1>
          <p className="force-pw-screen__subtitle">
            Hi <strong>{user?.username}</strong>! Enter the temporary password you were given, then choose a new one.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="force-pw-screen__label">Temporary Password</label>
            <div className="force-pw-screen__input-wrap">
              <div className="force-pw-screen__input-icon">
                <Icons.lock size={16} color="var(--clr-warm-gray)" />
              </div>
              <input type={showTemp ? "text" : "password"} value={tempPassword} onChange={(e) => { setTempPassword(e.target.value); setError(""); }} placeholder="Your temporary password" autoFocus className="force-pw-screen__input" aria-label="Temporary password" autoComplete="current-password" />
              <button type="button" onClick={() => setShowTemp(!showTemp)} className="force-pw-screen__toggle-btn" aria-label={showTemp ? "Hide" : "Show"}>
                {showTemp ? <Icons.eyeOff size={16} color="var(--clr-warm-gray)" /> : <Icons.eye size={16} color="var(--clr-warm-gray)" />}
              </button>
            </div>

            <label className="force-pw-screen__label">New Password <span style={{ fontWeight: 400 }}>(min 8 characters)</span></label>
            <div className="force-pw-screen__input-wrap force-pw-screen__input-wrap--tight">
              <div className="force-pw-screen__input-icon">
                <Icons.lock size={16} color="var(--clr-warm-gray)" />
              </div>
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="New password" className={`force-pw-screen__input${tooShort ? " force-pw-screen__input--error" : ""}`} aria-label="New password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="force-pw-screen__toggle-btn" aria-label={showNew ? "Hide" : "Show"}>
                {showNew ? <Icons.eyeOff size={16} color="var(--clr-warm-gray)" /> : <Icons.eye size={16} color="var(--clr-warm-gray)" />}
              </button>
            </div>
            {tooShort && <div className="force-pw-screen__field-error">Must be at least 8 characters</div>}

            <label className="force-pw-screen__label force-pw-screen__label--spaced">Confirm New Password</label>
            <div className="force-pw-screen__input-wrap force-pw-screen__input-wrap--tight">
              <div className="force-pw-screen__input-icon">
                <Icons.lock size={16} color="var(--clr-warm-gray)" />
              </div>
              <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="Confirm new password" className={`force-pw-screen__input${mismatch ? " force-pw-screen__input--error" : ""}`} aria-label="Confirm password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="force-pw-screen__toggle-btn" aria-label={showConfirm ? "Hide" : "Show"}>
                {showConfirm ? <Icons.eyeOff size={16} color="var(--clr-warm-gray)" /> : <Icons.eye size={16} color="var(--clr-warm-gray)" />}
              </button>
            </div>
            {mismatch && <div className="force-pw-screen__field-error">Passwords do not match</div>}

            {error && (
              <div className="force-pw-screen__alert" role="alert">
                <Icons.alertCircle size={16} color="#BE3A2B" />
                <span className="force-pw-screen__alert-text">{error}</span>
              </div>
            )}

            <button type="submit" disabled={!canSubmit} className="force-pw-screen__submit-btn">
              {loading ? "Saving…" : "Set Password & Continue"}
            </button>
          </form>

          <div className="force-pw-screen__signout-wrap">
            <button onClick={onLogout} className="force-pw-screen__signout-btn">Sign out</button>
          </div>
          </>)}
        </div>
      </div>
    </main>
  );
}
