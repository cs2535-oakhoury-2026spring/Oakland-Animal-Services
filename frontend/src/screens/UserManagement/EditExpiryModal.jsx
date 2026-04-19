import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../../hooks.js";
import { api } from "../../api.js";
import Icons from "../../Icons.jsx";
import "./EditExpiryModal.css";

// ─── Edit Expiry Modal ────────────────────────────────────────────────────────
export default function EditExpiryModal({ token, targetUser, onClose, onUpdated }) {
  const [expiryDate, setExpiryDate] = useState(
    targetUser?.expiresAt ? new Date(targetUser.expiresAt).toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expiryDate.trim()) return;
    setLoading(true);
    setError("");
    try {
      const isoExpiryDate = new Date(expiryDate).toISOString();
      await api.updateUser(token, targetUser.userId, {
        expiresAt: isoExpiryDate,
      });
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-expiry-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} className="edit-expiry-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="edit-expiry-modal__header">
          <h2 className="edit-expiry-modal__title">Edit Expiry Date</h2>
          <button onClick={onClose} className="edit-expiry-modal__close-btn" aria-label="Close">
            <Icons.xMark size={20} color="var(--clr-warm-gray)" />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="edit-expiry-modal__content">
            <div>
              <p className="edit-expiry-modal__label-text">Volunteer:</p>
              <p className="edit-expiry-modal__volunteer-name">{targetUser?.username}</p>
            </div>

            {targetUser?.expiresAt && (
              <div className="edit-expiry-modal__info-box">
                <div className="edit-expiry-modal__info-label">Expires:</div>
                <div className="edit-expiry-modal__info-value">{new Date(targetUser.expiresAt).toLocaleString()}</div>
              </div>
            )}

            <div>
              <label className="edit-expiry-modal__label">New Expiry Date & Time</label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => { setExpiryDate(e.target.value); setError(""); }}
                className="edit-expiry-modal__field"
                aria-label="Expiry date and time"
                autoFocus
              />
            </div>

            {error && (
              <div className="edit-expiry-modal__alert" role="alert">
                <Icons.alertCircle size={15} color="#BE3A2B" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="edit-expiry-modal__footer">
            <button type="button" onClick={onClose} className="edit-expiry-modal__cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={!expiryDate.trim() || loading} className="edit-expiry-modal__submit-btn">
              {loading ? "Updating…" : "Update Expiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
