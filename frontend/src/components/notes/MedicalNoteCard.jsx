import { formatTimestamp } from "../../utils.js";
import Icons from "../../Icons.jsx";
import HighlightedText from "../HighlightedText.jsx";
import "./MedicalNoteCard.css";

// ─── Medical Note Card ───────────────────────────────────────────────────────
export default function MedicalNoteCard({ note, userRole, onToggleStatus, onDelete, searchQuery }) {
  const canManage = userRole === "admin" || userRole === "staff";

  const isRaised = (note.status || "").toUpperCase() === "RAISED";
  const statusColor = isRaised ? "var(--clr-status-raised)" : "var(--clr-status-resolved)";
  const statusBg = isRaised ? "var(--clr-status-raised-bg)" : "var(--clr-status-resolved-bg)";

  return (
    <article className="medical-note-card">
      {/* Header with title and status */}
      <div className="medical-note-card__header">
        <div className="medical-note-card__header-left">
          <h4 className="medical-note-card__title">
            <HighlightedText text={note.highlightedCase || note.case} searchQuery={searchQuery} />
          </h4>
          <div className="medical-note-card__meta">
            <span className="medical-note-card__author">{note.by}</span>
            <span className="medical-note-card__dot">•</span>
            <span className="medical-note-card__timestamp">{formatTimestamp(note.createdAt)}</span>
          </div>
        </div>
        {canManage ? (
          <button
            type="button"
            className="medical-note-card__status medical-note-card__status-btn"
            style={{ color: statusColor, backgroundColor: statusBg }}
            onClick={() => onToggleStatus(note)}
            aria-label={`Mark observation as ${isRaised ? "resolved" : "raised"}`}
            title={`Click to mark as ${isRaised ? "Resolved" : "Raised"}`}
          >
            {note.status}
          </button>
        ) : (
          <span
            className="medical-note-card__status"
            style={{ color: statusColor, backgroundColor: statusBg }}
          >
            {note.status}
          </span>
        )}
      </div>

      {/* Body content - highlights matched keywords when searching */}
      <div className="medical-note-card__body-row">
        <p className="medical-note-card__body">
          <HighlightedText text={note.highlightedBody || note.body} searchQuery={searchQuery} />
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="medical-note-card__delete-btn"
            aria-label="Delete observation"
            title="Delete observation"
          >
            <Icons.trash size={16} color="var(--clr-brick-red)" />
          </button>
        )}
      </div>
    </article>
  );
}
