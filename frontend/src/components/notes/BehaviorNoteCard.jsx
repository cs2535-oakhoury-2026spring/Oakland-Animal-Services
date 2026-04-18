import { useState } from "react";
import { formatTimestamp } from "../../utils.js";
import Icons from "../../Icons.jsx";
import HighlightedText from "../HighlightedText.jsx";
import "./BehaviorNoteCard.css";

// ─── Behavior Note Card ──────────────────────────────────────────────────────
export default function BehaviorNoteCard({ note, currentUser, userRole, onEdit, searchQuery }) {
  const isOwner = note.by === currentUser;
  const canEdit = userRole === "admin" || userRole === "staff" || isOwner;
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="behavior-note-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="behavior-note-card__header">
        <div className="behavior-note-card__header-left">
          <h4 className="behavior-note-card__title">
            <HighlightedText text={note.highlightedCase || note.case} searchQuery={searchQuery} />
          </h4>
          <div className="behavior-note-card__meta">
            <span className="behavior-note-card__author">{note.by}</span>
            <span className="behavior-note-card__dot">•</span>
            <span className="behavior-note-card__timestamp">{formatTimestamp(note.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="behavior-note-card__body-row">
        <p className="behavior-note-card__body">
          <HighlightedText text={note.highlightedBody || note.body} searchQuery={searchQuery} />
        </p>
        {canEdit && (
          <button
            onClick={() => onEdit(note)}
            className="behavior-note-card__edit-btn"
            style={{ opacity: hovered ? 1 : 0.6 }}
            aria-label="Edit note"
          >
            <Icons.pencil size={16} color="var(--clr-warm-gray)" />
          </button>
        )}
      </div>
    </article>
  );
}
