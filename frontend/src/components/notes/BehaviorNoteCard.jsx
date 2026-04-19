import { useState } from "react";
import { formatTimestamp } from "../../utils.js";
import Icons from "../../Icons.jsx";
import HighlightedText from "../HighlightedText.jsx";
import "./BehaviorNoteCard.css";

// ─── Behavior Note Card ──────────────────────────────────────────────────────
export default function BehaviorNoteCard({ note, currentUser, userRole, onDelete, searchQuery }) {
  const isOwner = note.by === currentUser;
  const canDelete = userRole === "admin" || userRole === "staff" || isOwner;
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
        {canDelete && (
          <button
            onClick={() => onDelete?.(note)}
            className="behavior-note-card__delete-btn"
            style={{ opacity: hovered ? 1 : 0.7 }}
            aria-label="Delete note"
            type="button"
          >
            <Icons.trash size={16} color="var(--clr-brick-red)" />
          </button>
        )}
      </div>
    </article>
  );
}
