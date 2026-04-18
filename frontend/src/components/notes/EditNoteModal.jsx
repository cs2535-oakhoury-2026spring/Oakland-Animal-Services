import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../../hooks.js";
import "./EditNoteModal.css";

// ─── Edit Medical Note Modal ─────────────────────────────────────────────────
export default function EditNoteModal({ note, userRole, onClose, onSave }) {
  const [body, setBody] = useState(note.body);
  const [caseName, setCaseName] = useState(note.case || "");
  const [status, setStatus] = useState(note.status || "Raised");
  const canEditStatus = userRole === "admin" || userRole === "staff";
  const handleSave = () => { onSave({ ...note, body, case: caseName, ...(canEditStatus ? { status } : {}) }); onClose(); };

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  return (
    <div className="edit-note-modal__overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit medical observation">
      <div ref={focusTrapRef} className="edit-note-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="edit-note-modal__title">Edit Medical Observation</h2>
        <label className="edit-note-modal__label">Case Title</label>
        <input className="edit-note-modal__field" value={caseName} onChange={(e) => setCaseName(e.target.value)} aria-label="Case title" />
        {canEditStatus && (
          <>
            <label className="edit-note-modal__label">Status</label>
            <div className="edit-note-modal__status-row">
              {["Raised", "Resolved"].map((s) => {
                const isActive = status === s;
                const col = s === "Raised" ? "var(--clr-status-raised)" : "var(--clr-status-resolved)";
                const bg = s === "Raised" ? "var(--clr-status-raised-bg)" : "var(--clr-status-resolved-bg)";
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="edit-note-modal__status-btn"
                    style={{
                      border: `2px solid ${isActive ? col : "var(--clr-input-border)"}`,
                      backgroundColor: isActive ? bg : "transparent",
                      color: isActive ? col : "var(--clr-warm-gray)",
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <label className="edit-note-modal__label">Notes</label>
        <textarea className="edit-note-modal__field edit-note-modal__textarea" value={body} onChange={(e) => setBody(e.target.value)} aria-label="Observation notes" />
        <div className="edit-note-modal__actions">
          <button className="edit-note-modal__btn-cancel" onClick={onClose}>Cancel</button>
          <button className="edit-note-modal__btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
