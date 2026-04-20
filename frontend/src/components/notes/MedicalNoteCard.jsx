import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatTimestamp } from "../../utils.js";
import Icons from "../../Icons.jsx";
import HighlightedText from "../HighlightedText.jsx";
import "./MedicalNoteCard.css";

// ─── Medical Note Card ───────────────────────────────────────────────────────
export default function MedicalNoteCard({ note, userRole, onToggleStatus, onDelete, onStaffCommentUpdate, searchQuery }) {
  const [isStaffCommentModalOpen, setIsStaffCommentModalOpen] = useState(false);
  const [staffCommentDraft, setStaffCommentDraft] = useState("");
  const [isSavingStaffComment, setIsSavingStaffComment] = useState(false);
  const [staffCommentError, setStaffCommentError] = useState("");

  const canManage = userRole === "admin" || userRole === "staff";
  const hasStaffComment = !!note.staffComment?.text?.trim();
  const staffCommentLabel = hasStaffComment
    ? `From ${note.staffComment.from} at ${formatTimestamp(note.staffComment.at)}${note.staffComment.editedBy ? ` | edited by ${note.staffComment.editedBy}${note.staffComment.editedAt ? ` at ${formatTimestamp(note.staffComment.editedAt)}` : ""}` : ""}`
    : "";

  const openStaffCommentModal = () => {
    setStaffCommentDraft(note.staffComment?.text || "");
    setStaffCommentError("");
    setIsStaffCommentModalOpen(true);
  };

  const closeStaffCommentModal = () => {
    if (isSavingStaffComment) return;
    setIsStaffCommentModalOpen(false);
  };

  useEffect(() => {
    if (!isStaffCommentModalOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeStaffCommentModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isStaffCommentModalOpen, isSavingStaffComment]);

  const saveStaffComment = async () => {
    const trimmed = staffCommentDraft.trim();
    if (!trimmed || isSavingStaffComment) return;

    setStaffCommentError("");
    setIsSavingStaffComment(true);
    try {
      const ok = await onStaffCommentUpdate?.(note, trimmed);
      if (ok !== false) {
        setIsStaffCommentModalOpen(false);
      } else {
        setStaffCommentError("Unable to save staff comment. Please try again.");
      }
    } catch (error) {
      setStaffCommentError("Unable to save staff comment. Please try again.");
    } finally {
      setIsSavingStaffComment(false);
    }
  };

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

      {(hasStaffComment || canManage) && (
        <div className="medical-note-card__staff-comment">
          <div className="medical-note-card__staff-comment-head">
            <div className="medical-note-card__staff-comment-label">Staff comment</div>
            {canManage && (
              <button
                type="button"
                className="medical-note-card__staff-comment-icon-btn"
                onClick={openStaffCommentModal}
                aria-label={hasStaffComment ? "Edit staff comment" : "Add staff comment"}
                title={hasStaffComment ? "Edit staff comment" : "Add staff comment"}
              >
                {hasStaffComment ? (
                  <Icons.pencil size={15} color="var(--clr-header-green)" />
                ) : (
                  <Icons.plus size={14} color="var(--clr-header-green)" />
                )}
              </button>
            )}
          </div>

          {hasStaffComment ? (
            <>
          <p className="medical-note-card__staff-comment-text">{note.staffComment.text}</p>
          <div className="medical-note-card__staff-comment-meta">{staffCommentLabel}</div>
            </>
          ) : (
            <div className="medical-note-card__staff-comment-empty">No staff comment yet.</div>
          )}
        </div>
      )}

      {isStaffCommentModalOpen &&
        createPortal(
          <div
            className="medical-note-card__mini-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Edit staff comment"
            onClick={closeStaffCommentModal}
          >
            <div className="medical-note-card__mini-modal" onClick={(e) => e.stopPropagation()}>
              <div className="medical-note-card__mini-modal-title-row">
                <div className="medical-note-card__mini-modal-title">
                  {hasStaffComment ? "Edit staff comment" : "Add staff comment"}
                </div>
                <button
                  type="button"
                  className="medical-note-card__mini-modal-close"
                  onClick={closeStaffCommentModal}
                  aria-label="Close staff comment editor"
                >
                  ×
                </button>
              </div>

              <div className="medical-note-card__mini-modal-note-preview">
                <div className="medical-note-card__mini-modal-label">Observation note</div>
                <p className="medical-note-card__mini-modal-note-text">{note.body}</p>
              </div>

              <div className="medical-note-card__mini-modal-label">Update staff comment</div>
              <textarea
                className="medical-note-card__mini-modal-textarea"
                value={staffCommentDraft}
                onChange={(e) => setStaffCommentDraft(e.target.value)}
                placeholder="Write a staff follow-up comment..."
                autoFocus
              />
              {staffCommentError && (
                <div className="medical-note-card__mini-modal-error" role="alert">
                  {staffCommentError}
                </div>
              )}
              <div className="medical-note-card__mini-modal-actions">
                <button
                  type="button"
                  className="medical-note-card__mini-modal-btn medical-note-card__mini-modal-btn--ghost"
                  onClick={closeStaffCommentModal}
                  disabled={isSavingStaffComment}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="medical-note-card__mini-modal-btn medical-note-card__mini-modal-btn--primary"
                  onClick={saveStaffComment}
                  disabled={isSavingStaffComment || !staffCommentDraft.trim()}
                >
                  {isSavingStaffComment ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}
