import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../../hooks.js";
import { api } from "../../api.js";
import Icons from "../../Icons.jsx";
import "./ResetPasswordModal.css";

// ─── Reset Password Modal ─────────────────────────────────────────────────────
export default function ResetPasswordModal({ token, targetUser, onClose, onReset }) {
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const canSubmit = newPwd.length >= 8 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.resetUserPassword(token, targetUser.userId, newPwd);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-pw-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} className="reset-pw-modal__box" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="reset-pw-modal__success">
            <div className="reset-pw-modal__success-icon">
              <Icons.check size={22} color="#4CAF50" />
            </div>
            <h2 className="reset-pw-modal__success-title">Password Reset</h2>
            <p className="reset-pw-modal__success-body">
              <strong>{targetUser.username}</strong>'s password has been reset. They will need to sign in with the new password.
            </p>
            <button onClick={onClose} className="reset-pw-modal__done-btn">Done</button>
          </div>
        ) : (
          <>
            <div className="reset-pw-modal__header">
              <h2 className="reset-pw-modal__title">Reset Password</h2>
              <button onClick={onClose} className="reset-pw-modal__close-btn" aria-label="Close"><Icons.xMark size={20} color="var(--clr-warm-gray)" /></button>
            </div>
            <p className="reset-pw-modal__description">Set a new temporary password for <strong>{targetUser.username}</strong>.</p>
            <form onSubmit={handleSubmit} noValidate>
              <label className="reset-pw-modal__label">New Password</label>
              <div className="reset-pw-modal__pw-wrap">
                <input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setError(""); }} placeholder="Min 8 characters" className="reset-pw-modal__field" autoFocus autoComplete="new-password" aria-label="New password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="reset-pw-modal__toggle-btn" aria-label={showPwd ? "Hide" : "Show"}>
                  {showPwd ? <Icons.eyeOff size={15} color="var(--clr-warm-gray)" /> : <Icons.eye size={15} color="var(--clr-warm-gray)" />}
                </button>
              </div>
              {newPwd && newPwd.length < 8 && <div className="reset-pw-modal__pw-hint">At least 8 characters</div>}

              {error && (
                <div className="reset-pw-modal__alert" role="alert">
                  <Icons.alertCircle size={15} color="#BE3A2B" />
                  <span className="reset-pw-modal__alert-text">{error}</span>
                </div>
              )}

              <div className="reset-pw-modal__footer">
                <button type="button" onClick={onClose} className="reset-pw-modal__cancel-btn">Cancel</button>
                <button type="submit" disabled={!canSubmit} className="reset-pw-modal__submit-btn">
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
