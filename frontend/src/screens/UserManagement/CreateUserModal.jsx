import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../../hooks.js";
import { api } from "../../api.js";
import Icons from "../../Icons.jsx";
import "./CreateUserModal.css";

// ─── Create User Modal ────────────────────────────────────────────────────────
export default function CreateUserModal({ token, isAdmin, defaultRole, onClose, onCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole || "volunteer");
  const [expiryDate, setExpiryDate] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const canSubmit = username.trim() && password.length >= 8 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await api.createUser(token, {
        username: username.trim(),
        password,
        role,
        ...(role === "volunteer" && expiryDate ? { expiryDate } : {}),
        ...(role === "device" && deviceName ? { deviceName: deviceName.trim() } : {}),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} className="create-user-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="create-user-modal__header">
          <h2 className="create-user-modal__title">Create Account</h2>
          <button onClick={onClose} className="create-user-modal__close-btn" aria-label="Close"><Icons.xMark size={20} color="var(--clr-warm-gray)" /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {isAdmin && (
            <>
              <label className="create-user-modal__label">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="create-user-modal__field create-user-modal__field--spaced" aria-label="Role">
                <option value="volunteer">Volunteer</option>
                <option value="staff">Staff</option>
                <option value="device">Device</option>
              </select>
            </>
          )}

          <label className="create-user-modal__label">Username</label>
          <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder="Username" className="create-user-modal__field create-user-modal__field--spaced" autoFocus autoComplete="off" aria-label="Username" />

          <label className="create-user-modal__label">Temporary Password</label>
          <div className="create-user-modal__pw-wrap">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Min 8 characters" className="create-user-modal__field create-user-modal__pw-input" autoComplete="new-password" aria-label="Password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="create-user-modal__toggle-btn" aria-label={showPassword ? "Hide" : "Show"}>
              {showPassword ? <Icons.eyeOff size={15} color="var(--clr-warm-gray)" /> : <Icons.eye size={15} color="var(--clr-warm-gray)" />}
            </button>
          </div>
          {password && password.length < 8 && <div className="create-user-modal__pw-hint">At least 8 characters</div>}

          {role === "volunteer" && (
            <>
              <label className="create-user-modal__label">Expiry Date <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="create-user-modal__field create-user-modal__field--spaced" aria-label="Expiry date" />
            </>
          )}

          {role === "device" && (
            <>
              <label className="create-user-modal__label">Device Name</label>
              <input type="text" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="e.g. Kiosk-1" className="create-user-modal__field create-user-modal__field--spaced" aria-label="Device name" />
            </>
          )}

          {error && (
            <div className="create-user-modal__alert" role="alert">
              <Icons.alertCircle size={15} color="#BE3A2B" />
              <span className="create-user-modal__alert-text">{error}</span>
            </div>
          )}

          <div className="create-user-modal__footer">
            <button type="button" onClick={onClose} className="create-user-modal__cancel-btn">Cancel</button>
            <button type="submit" disabled={!canSubmit} className="create-user-modal__submit-btn">
              {loading ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
