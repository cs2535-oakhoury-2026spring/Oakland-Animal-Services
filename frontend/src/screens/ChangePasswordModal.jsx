import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../hooks.js";
import { api } from "../api.js";
import Icons from "../Icons.jsx";
import "./ChangePasswordModal.css";

// ─── Change Password Modal ────────────────────────────────────────────────────
export default function ChangePasswordModal({ token, username, onClose }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const mismatch = confirm && newPwd !== confirm;
  const tooShort = newPwd && newPwd.length < 8;
  const canSubmit = current && newPwd.length >= 8 && newPwd === confirm && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.changePassword(token, current, newPwd);
      if (username) sessionStorage.setItem("pending_login_username", username);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-pw-modal__overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Change password">
      <div ref={focusTrapRef} className="change-pw-modal__box" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="change-pw-modal__success">
            <div className="change-pw-modal__success-icon">
              <Icons.check size={24} color="#4CAF50" />
            </div>
            <h2 className="change-pw-modal__success-title">Password Changed</h2>
            <p className="change-pw-modal__success-body">Your password has been updated. Please sign in again.</p>
            <button onClick={onClose} className="change-pw-modal__done-btn">Done</button>
          </div>
        ) : (
          <>
            <div className="change-pw-modal__header">
              <h2 className="change-pw-modal__title">Change Password</h2>
              <button onClick={onClose} className="change-pw-modal__close-btn" aria-label="Close"><Icons.xMark size={20} color="var(--clr-warm-gray)" /></button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <label className="change-pw-modal__label">Current Password</label>
              <div className="change-pw-modal__input-wrap">
                <div className="change-pw-modal__input-icon"><Icons.lock size={15} color="var(--clr-warm-gray)" /></div>
                <input type={showCurrent ? "text" : "password"} value={current} onChange={(e) => { setCurrent(e.target.value); setError(""); }} placeholder="Current password" className="change-pw-modal__field" autoFocus autoComplete="current-password" aria-label="Current password" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="change-pw-modal__toggle-btn" aria-label={showCurrent ? "Hide" : "Show"}>
                  {showCurrent ? <Icons.eyeOff size={15} color="var(--clr-warm-gray)" /> : <Icons.eye size={15} color="var(--clr-warm-gray)" />}
                </button>
              </div>

              <label className="change-pw-modal__label">New Password</label>
              <div className="change-pw-modal__input-wrap change-pw-modal__input-wrap--tight">
                <div className="change-pw-modal__input-icon"><Icons.lock size={15} color="var(--clr-warm-gray)" /></div>
                <input type={showNew ? "text" : "password"} value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(""); }} placeholder="New password (min 8 chars)" className={`change-pw-modal__field${tooShort ? " change-pw-modal__field--error" : ""}`} autoComplete="new-password" aria-label="New password" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="change-pw-modal__toggle-btn" aria-label={showNew ? "Hide" : "Show"}>
                  {showNew ? <Icons.eyeOff size={15} color="var(--clr-warm-gray)" /> : <Icons.eye size={15} color="var(--clr-warm-gray)" />}
                </button>
              </div>
              {tooShort && <div className="change-pw-modal__field-error">At least 8 characters required</div>}

              <label className="change-pw-modal__label change-pw-modal__label--spaced">Confirm New Password</label>
              <div className="change-pw-modal__confirm-wrap">
                <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="Confirm new password" className={`change-pw-modal__field change-pw-modal__field--no-left-icon${mismatch ? " change-pw-modal__field--error" : ""}`} autoComplete="new-password" aria-label="Confirm new password" />
              </div>
              {mismatch && <div className="change-pw-modal__field-error">Passwords do not match</div>}

              {error && (
                <div className="change-pw-modal__alert" role="alert">
                  <Icons.alertCircle size={15} color="#BE3A2B" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div className="change-pw-modal__alert-text">
                    {error.toLowerCase().includes("environment") || error.toLowerCase().includes("admin")
                      ? <>The <strong>admin</strong> password is set via the server's <code>.env</code> file (<code>ADMIN_PASS</code>) and cannot be changed here. Update it there and restart the server.</>
                      : error}
                  </div>
                </div>
              )}

              <div className="change-pw-modal__footer">
                <button type="button" onClick={onClose} className="change-pw-modal__cancel-btn">Cancel</button>
                <button type="submit" disabled={!canSubmit} className="change-pw-modal__submit-btn">
                  {loading ? "Saving…" : "Change Password"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
