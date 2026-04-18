import { formatTimestamp } from "../../utils.js";
import './SimilarNotesPreview.css';

// ─── Similar Notes Preview (shared) ─────────────────────────────────────────
export default function SimilarNotesPreview({ similarNotes, fullHeight = false }) {
  if (!similarNotes || similarNotes.length === 0) return null;
  const hlStyle = `background-color:#FFEB3B;color:#1a1a1a;font-weight:700;border-radius:2px;padding:0 2px;`;
  const injectStyle = (html) => (html || "").replace(/<b>/g, `<b style="${hlStyle}">`);
  return (
    <div className={`similar-notes-preview${fullHeight ? " similar-notes-preview--full-height" : ""}`}>
      <div className="similar-notes-preview__heading">
        Similar existing notes ({similarNotes.length})
      </div>
      <div className={`similar-notes-preview__list${fullHeight ? " similar-notes-preview__list--full-height" : ""}`}>
        {similarNotes.map((n) => (
          <div key={n.id} className="similar-notes-preview__item">
            <div
              className="similar-notes-preview__case"
              dangerouslySetInnerHTML={{ __html: injectStyle(n.highlightedCase || n.case) }}
            />
            <div
              className="similar-notes-preview__body"
              dangerouslySetInnerHTML={{ __html: injectStyle(n.highlightedBody || n.body) }}
            />
            <div className="similar-notes-preview__meta">{n.by} · {formatTimestamp(n.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
