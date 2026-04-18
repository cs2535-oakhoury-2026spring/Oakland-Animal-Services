import { useState } from "react";
import { formatTimestamp } from "../../utils.js";
import Icons from "../../Icons.jsx";
import HighlightedText from "../HighlightedText.jsx";
import "./MedicalNoteCard.css";

// ─── Medical Note Card ───────────────────────────────────────────────────────
export default function MedicalNoteCard({ note, currentUser, userRole, onEdit, searchQuery }) {
  const isOwner = note.by === currentUser;
  const canEdit = userRole === "admin" || userRole === "staff" || isOwner;
  const [hovered, setHovered] = useState(false);

  const isRaised = (note.status || "").toUpperCase() === "RAISED";
  const statusColor = isRaised ? "var(--clr-status-raised)" : "var(--clr-status-resolved)";
  const statusBg = isRaised ? "var(--clr-status-raised-bg)" : "var(--clr-status-resolved-bg)";

  return (
    <article
      className="medical-note-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
        <span
          className="medical-note-card__status"
          style={{ color: statusColor, backgroundColor: statusBg }}
        >
          {note.status}
        </span>
      </div>

      {/* Body content - highlights matched keywords when searching */}
      <div className="medical-note-card__body-row">
        <p className="medical-note-card__body">
          <HighlightedText text={note.highlightedBody || note.body} searchQuery={searchQuery} />
        </p>
        {canEdit && (
          <button
            onClick={() => onEdit(note)}
            className="medical-note-card__edit-btn"
            style={{ opacity: hovered ? 1 : 0.6 }}
            aria-label="Edit your observation"
          >
            <Icons.pencil size={16} color="var(--clr-warm-gray)" />
          </button>
        )}
      </div>
    </article>
  );
}
