import { useState, useRef } from "react";
import { findSimilarNotes } from "../../utils/noteSearcher.js";
import { useFocusTrap, useEscapeKey, useResponsive } from "../../hooks.js";
import { api } from "../../api.js";
import Icons from "../../Icons.jsx";
import SimilarNotesPreview from "./SimilarNotesPreview.jsx";
import "./CreateBehaviorNoteModal.css";

// ─── Create Behavior Note Modal ─────────────────────────────────────────────
export default function CreateBehaviorNoteModal({ petId, userName, userRole, onClose, onSubmit, existingNotes = [] }) {
  const [caseName, setCaseName] = useState("");
  const [body, setBody] = useState("");
  const [deviceUserName, setDeviceUserName] = useState(userRole === "device" ? "" : userName);
  const [isListening, setIsListening] = useState(false);
  const [similarNotes, setSimilarNotes] = useState([]);
  const searchTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const { width } = useResponsive();
  const isDesktop = width >= 768;

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const finalUserName = userRole === "device" ? deviceUserName : userName;
  const canSubmit = caseName.trim() && body.trim() && (userRole !== "device" || deviceUserName.trim());

  const isMissing = (field) => !canSubmit && !field.trim();

  const runSimilarSearch = (caseVal, bodyVal) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const query = `${caseVal} ${bodyVal}`.trim();
    if (!query) { setSimilarNotes([]); return; }
    searchTimerRef.current = setTimeout(() => {
      const mapped = existingNotes.map((n) => ({
        id: n.id, petId: n.petId, title: n.case, content: n.body,
        author: n.by, timestamp: new Date(n.createdAt),
      }));
      const results = findSimilarNotes(query, mapped, { maxResults: 20 });
      setSimilarNotes(results.map((r) => {
        const orig = existingNotes.find((n) => n.id === r.observerNote.id);
        return { ...orig, highlightedBody: r.highlightedContent, highlightedCase: r.highlightedTitle };
      }));
    }, 300);
  };

  const toggleSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Speech recognition not supported."); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.continuous = true; r.interimResults = true;
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setBody(t); runSimilarSearch(caseName, t); };
    r.onerror = () => setIsListening(false); r.onend = () => setIsListening(false);
    r.start(); recognitionRef.current = r; setIsListening(true);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const created = await api.createBehaviorNote({ petId, by: finalUserName, body, case: caseName });
    onSubmit(created); onClose();
  };

  const showSidePanel = isDesktop && similarNotes.length > 0;
  const panelClass = [
    "create-behavior-note-modal__panel",
    showSidePanel ? "create-behavior-note-modal__panel--wide" : "create-behavior-note-modal__panel--single",
    !isDesktop ? "create-behavior-note-modal__panel--mobile" : "",
  ].join(" ").trim();

  const formClass = [
    "create-behavior-note-modal__form",
    isDesktop ? "create-behavior-note-modal__form--desktop" : "create-behavior-note-modal__form--mobile",
  ].join(" ");

  const buttons = (
    <div className="create-behavior-note-modal__actions">
      <button className="create-behavior-note-modal__btn-cancel" onClick={onClose}>Cancel</button>
      <button className="create-behavior-note-modal__btn-submit" onClick={handleSubmit} disabled={!canSubmit}>Submit</button>
    </div>
  );

  return (
    <div className="create-behavior-note-modal__overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="New behavior note">
      <div ref={focusTrapRef} className={panelClass} onClick={(e) => e.stopPropagation()}>
        {/* Form */}
        <div className={formClass}>
          <h2 className="create-behavior-note-modal__title">New Behavior Note</h2>
          {userRole === "device" && (
            <>
              <label className="create-behavior-note-modal__label">Your Name</label>
              <input className={`create-behavior-note-modal__field ${isMissing(deviceUserName) ? "create-behavior-note-modal__field--error" : ""}`} placeholder="Enter your name" value={deviceUserName} onChange={(e) => setDeviceUserName(e.target.value)} aria-label="Your name" />
            </>
          )}
          <label className="create-behavior-note-modal__label">Case Title</label>
          <input className={`create-behavior-note-modal__field ${isMissing(caseName) ? "create-behavior-note-modal__field--error" : ""}`} placeholder="e.g. Socialization Progress" value={caseName} onChange={(e) => { setCaseName(e.target.value); runSimilarSearch(e.target.value, body); }} aria-label="Case title" />
          <label className="create-behavior-note-modal__label">
            Observation Notes
            <button
              className="create-behavior-note-modal__mic-btn"
              style={{ backgroundColor: isListening ? "var(--clr-brick-red)" : "var(--clr-input-bg)" }}
              onClick={toggleSpeech}
              aria-label={isListening ? "Stop speech to text" : "Start speech to text"}
            >
              <Icons.microphone size={16} color={isListening ? "#fff" : "var(--clr-text-primary)"} />
            </button>
          </label>
          <textarea className={`create-behavior-note-modal__field create-behavior-note-modal__textarea ${isMissing(body) ? "create-behavior-note-modal__field--error" : ""}`} placeholder="Describe your observation..." value={body} onChange={(e) => { setBody(e.target.value); runSimilarSearch(caseName, e.target.value); }} aria-label="Observation notes" />
          {buttons}
          {!isDesktop && similarNotes.length > 0 && (
            <div className="create-behavior-note-modal__similar-mobile">
              <SimilarNotesPreview similarNotes={similarNotes} />
            </div>
          )}
        </div>
        {/* Desktop side panel */}
        {showSidePanel && (
          <div className="create-behavior-note-modal__side-panel">
            <SimilarNotesPreview similarNotes={similarNotes} fullHeight />
          </div>
        )}
      </div>
    </div>
  );
}
