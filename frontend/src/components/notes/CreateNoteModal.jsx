import { useState, useRef } from "react";
import { findSimilarNotes } from "../../utils/noteSearcher.js";
import { useFocusTrap, useEscapeKey, useResponsive } from "../../hooks.js";
import { api } from "../../api.js";
import Icons from "../../Icons.jsx";
import SimilarNotesPreview from "./SimilarNotesPreview.jsx";
import "./CreateNoteModal.css";

// ─── Create Medical Note Modal ───────────────────────────────────────────────
export default function CreateNoteModal({ petId, userName, userRole, onClose, onSubmit, existingNotes = [] }) {
  const [caseName, setCaseName] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Raised");
  const [deviceUserName, setDeviceUserName] = useState(userRole === "device" ? "" : userName);
  const [isListening, setIsListening] = useState(false);
  const [similarNotes, setSimilarNotes] = useState([]);
  const searchTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const canSetStatus = userRole === "medical";
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
    try {
      const created = await api.createNote({ petId, by: finalUserName, type: "medical", body, case: caseName, status: canSetStatus ? status : "Raised" });
      onSubmit(created);
      onClose();
    } catch (err) {
      console.warn("Failed to create observation note", err);
      alert("Unable to create observation. Please try again.");
    }
  };

  const showSidePanel = isDesktop && similarNotes.length > 0;
  const panelClass = [
    "create-note-modal__panel",
    showSidePanel ? "create-note-modal__panel--wide" : "create-note-modal__panel--single",
    !isDesktop ? "create-note-modal__panel--mobile" : "",
  ].join(" ").trim();

  const formClass = [
    "create-note-modal__form",
    isDesktop ? "create-note-modal__form--desktop" : "create-note-modal__form--mobile",
  ].join(" ");

  const buttons = (
    <div className="create-note-modal__actions">
      <button className="create-note-modal__btn-cancel" onClick={onClose}>Cancel</button>
      <button className="create-note-modal__btn-submit" onClick={handleSubmit} disabled={!canSubmit}>Submit</button>
    </div>
  );

  return (
    <div className="create-note-modal__overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="New medical observation">
      <div ref={focusTrapRef} className={panelClass} onClick={(e) => e.stopPropagation()}>
        {/* Form */}
        <div className={formClass}>
          <h2 className="create-note-modal__title">New Medical Observation</h2>
          {userRole === "device" && (
            <>
              <label className="create-note-modal__label">Your Name</label>
              <input className={`create-note-modal__field ${isMissing(deviceUserName) ? "create-note-modal__field--error" : ""}`} placeholder="Enter your name" value={deviceUserName} onChange={(e) => setDeviceUserName(e.target.value)} aria-label="Your name" />
            </>
          )}
          <label className="create-note-modal__label">Case Title</label>
          <input className={`create-note-modal__field ${isMissing(caseName) ? "create-note-modal__field--error" : ""}`} placeholder="e.g. Limp On Right Leg" value={caseName} onChange={(e) => { setCaseName(e.target.value); runSimilarSearch(e.target.value, body); }} aria-label="Case title" />
          {canSetStatus && (
            <>
              <label className="create-note-modal__label">Status</label>
              <select className="create-note-modal__field" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                <option value="Raised">Raised</option>
                <option value="Resolved">Resolved</option>
              </select>
            </>
          )}
          <label className="create-note-modal__label">
            Observation Notes
            <button
              className="create-note-modal__mic-btn"
              style={{ backgroundColor: isListening ? "var(--clr-brick-red)" : "var(--clr-input-bg)" }}
              onClick={toggleSpeech}
              aria-label={isListening ? "Stop speech to text" : "Start speech to text"}
            >
              <Icons.microphone size={16} color={isListening ? "#fff" : "var(--clr-text-primary)"} />
            </button>
          </label>
          <textarea className={`create-note-modal__field create-note-modal__textarea ${isMissing(body) ? "create-note-modal__field--error" : ""}`} placeholder="Describe your observation..." value={body} onChange={(e) => { setBody(e.target.value); runSimilarSearch(caseName, e.target.value); }} aria-label="Observation notes" />
          {buttons}
          {!isDesktop && similarNotes.length > 0 && (
            <div className="create-note-modal__similar-mobile">
              <SimilarNotesPreview similarNotes={similarNotes} />
            </div>
          )}
        </div>
        {/* Desktop side panel */}
        {showSidePanel && (
          <div className="create-note-modal__side-panel">
            <SimilarNotesPreview similarNotes={similarNotes} fullHeight />
          </div>
        )}
      </div>
    </div>
  );
}
