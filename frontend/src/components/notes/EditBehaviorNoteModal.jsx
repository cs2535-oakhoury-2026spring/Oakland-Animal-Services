import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../../hooks.js";
import "./EditBehaviorNoteModal.css";

// ─── Edit Behavior Note Modal ────────────────────────────────────────────────
export default function EditBehaviorNoteModal({ note, onClose, onSave }) {
  const [body, setBody] = useState(note.body);
  const [caseName, setCaseName] = useState(note.case || "");
  const handleSave = () => { onSave({ ...note, body, case: caseName }); onClose(); };

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  return (
    <div className="edit-behavior-note-modal__overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit behavior note">
      <div ref={focusTrapRef} className="edit-behavior-note-modal__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="edit-behavior-note-modal__title">Edit Behavior Note</h2>
        <label className="edit-behavior-note-modal__label">Case Title</label>
        <input className="edit-behavior-note-modal__field" value={caseName} onChange={(e) => setCaseName(e.target.value)} aria-label="Case title" />
        <label className="edit-behavior-note-modal__label">Notes</label>
        <textarea className="edit-behavior-note-modal__field edit-behavior-note-modal__textarea" value={body} onChange={(e) => setBody(e.target.value)} aria-label="Observation notes" />
        <div className="edit-behavior-note-modal__actions">
          <button className="edit-behavior-note-modal__btn-cancel" onClick={onClose}>Cancel</button>
          <button className="edit-behavior-note-modal__btn-save" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
