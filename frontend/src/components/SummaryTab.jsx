import { useRef, useState } from "react";
import './SummaryTab.css';

// ─── Summary Tab (AI Chat Interface) ────────────────────────────────────────
export default function SummaryTab({ aiQuery, aiResponse, onQueryChange, onSubmit, aiLoading }) {
  const textareaRef = useRef(null);
  const [includeBehaviorNotes, setIncludeBehaviorNotes] = useState(true);
  const [includeObserverNotes, setIncludeObserverNotes] = useState(true);

  const handleSubmit = () => {
    onSubmit({ includeBehaviorNotes, includeObserverNotes });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <section className="summary-tab" aria-label="AI Summary">
      <div className="summary-tab__card">
        <h3 className="summary-tab__title">Ask AI About This Animal</h3>
        <p className="summary-tab__description">
          Ask questions about medical observations, behavior notes, or anything related to this animal.
        </p>

        <div className="summary-tab__filters">
          <label className="summary-tab__checkbox">
            <input
              type="checkbox"
              checked={includeObserverNotes}
              onChange={(e) => setIncludeObserverNotes(e.target.checked)}
            />
            <span>Medical/Observer Notes</span>
          </label>
          <label className="summary-tab__checkbox">
            <input
              type="checkbox"
              checked={includeBehaviorNotes}
              onChange={(e) => setIncludeBehaviorNotes(e.target.checked)}
            />
            <span>Behavior Notes</span>
          </label>
        </div>

        <div className="summary-tab__field">
          <label className="summary-tab__label">Your Question</label>
          <textarea
            ref={textareaRef}
            className="summary-tab__textarea"
            placeholder="e.g., What is the current health status? Are there any behavioral concerns?"
            value={aiQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
            aria-label="AI query input"
          />
          <div className="summary-tab__hint">Press Cmd/Ctrl + Enter to submit</div>
        </div>

        <button
          className="summary-tab__submit"
          onClick={handleSubmit}
          disabled={!aiQuery.trim() || aiLoading}
        >
          {aiLoading ? "Generating..." : "Ask AI"}
        </button>

        {aiResponse && (
          <div className="summary-tab__response">
            <div className="summary-tab__response-label">AI Response</div>
            <div className="summary-tab__response-body">
              {aiResponse}
            </div>
          </div>
        )}

        {!aiResponse && (
          <div className="summary-tab__empty">
            Response will appear here after you ask a question
          </div>
        )}
      </div>
    </section>
  );
}
