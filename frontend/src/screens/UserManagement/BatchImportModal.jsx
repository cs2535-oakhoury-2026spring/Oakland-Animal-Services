import { useEffect, useState } from "react";
import { useFocusTrap, useEscapeKey } from "../../hooks.js";
import { api } from "../../api.js";
import "./BatchImportModal.css";

function sanitizeCsvText(rawText) {
  if (typeof rawText !== "string") return "";
  const text = rawText.replace(/^\uFEFF/, "");
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }
  if (lines.length > 1) {
    const firstLine = lines[0].trim();
    const fileNameLike = /^[^,]+\.(csv|txt|xls|xlsx)$/i;
    if (fileNameLike.test(firstLine)) {
      lines.shift();
      while (lines.length > 0 && lines[0].trim() === "") {
        lines.shift();
      }
    }
  }
  return lines.join("\n");
}

// ─── Batch Import Modal ───────────────────────────────────────────────────────
export default function BatchImportModal({ token, onClose, onDone }) {
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  useEffect(() => {
    if (cooldownSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldownSecondsLeft]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      const sanitized = sanitizeCsvText(result);
      setCsvText(sanitized);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim() || cooldownSecondsLeft > 0) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.batchCreateUsers(token, csvText);
      setResult(data);
      onDone();
    } catch (err) {
      const status = err?.status;
      const message = String(err?.message || "").toLowerCase();
      const retryAfter = Number(err?.retryAfterSeconds);
      const isRateLimited = status === 429 || message.includes("too many requests");

      if (isRateLimited) {
        const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
        setCooldownSecondsLeft(waitSeconds);
        setError(`Rate limit reached. Please wait ${waitSeconds} seconds before trying again.`);
      } else {
        setError(err.message || "Batch import failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const importDisabled = loading || !csvText.trim() || cooldownSecondsLeft > 0;

  const downloadTemplate = () => {
    const blob = new Blob([
      "username,password,role,expiresAt,tag\n"
      + "john_doe,Pass1234,staff,,shelter-team\n"
      + "jane_doe,Pass5678,volunteer,2026-12-31T23:59,adoption-hold\n"
      + "tablet_1,DevicePass9,device,,No-tag\n",
    ], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "users_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="batch-import-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} className="batch-import-modal__box" onClick={(e) => e.stopPropagation()}>
        <h2 className="batch-import-modal__title">Batch Import Users</h2>
        <p className="batch-import-modal__description">
          Upload a CSV with columns: <code className="batch-import-modal__code">username, password, role, expiresAt, tag</code>
          {" "}— role must be <code className="batch-import-modal__code">staff</code>, <code className="batch-import-modal__code">volunteer</code>, or <code className="batch-import-modal__code">device</code>.
          {" "}<code className="batch-import-modal__code">expiresAt</code> is optional and only for volunteer rows.
          {" "}<code className="batch-import-modal__code">tag</code> is optional for all rows (blank becomes <code className="batch-import-modal__code">No-tag</code>).
        </p>
        <button onClick={downloadTemplate} className="batch-import-modal__template-link">
          Download template CSV
        </button>

        {!result ? (
          <>
            <label className="batch-import-modal__label">Select CSV file</label>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="batch-import-modal__field batch-import-modal__file-input" />
            <label className="batch-import-modal__label">Or paste CSV directly</label>
            <textarea
              className="batch-import-modal__field batch-import-modal__textarea"
                           placeholder={"username,password,role,expiresAt,tag\njohn_doe,Pass1234,staff,,shelter-team\njane_doe,Pass5678,volunteer,2026-12-31T23:59,adoption-hold\ntablet_1,DevicePass9,device,,No-tag"}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            {error && <div className="batch-import-modal__error">{error}</div>}
            {cooldownSecondsLeft > 0 && (
              <div className="batch-import-modal__rate-warning" role="status" aria-live="polite">
                Requests are temporarily limited. Try again in {cooldownSecondsLeft}s.
              </div>
            )}
            <div className="batch-import-modal__footer">
              <button onClick={onClose} className="batch-import-modal__cancel-btn">Cancel</button>
              <button onClick={handleImport} disabled={importDisabled} className="batch-import-modal__import-btn">
                {loading ? "Importing…" : cooldownSecondsLeft > 0 ? `Retry in ${cooldownSecondsLeft}s` : "Import"}
              </button>
            </div>
          </>
        ) : (
          <>
            {Array.isArray(result.updated) && result.updated.length > 0 && (
              <div className="batch-import-modal__result-success">
                <div className="batch-import-modal__result-success-title">
                  {result.updated.length} existing volunteer account{result.updated.length !== 1 ? "s" : ""} reactivated
                </div>
                <div className="batch-import-modal__result-success-list">{result.updated.join(", ")}</div>
              </div>
            )}
            <div className="batch-import-modal__result-success">
              <div className="batch-import-modal__result-success-title">
                {result.created.length} account{result.created.length !== 1 ? "s" : ""} created
              </div>
              {result.created.length > 0 && (
                <div className="batch-import-modal__result-success-list">{result.created.join(", ")}</div>
              )}
            </div>
            {result.failed.length > 0 && (
              <div className="batch-import-modal__result-fail">
                <div className="batch-import-modal__result-fail-title">
                  {result.failed.length} failed
                </div>
                {result.failed.map((f, i) => (
                  <div key={i} className="batch-import-modal__result-fail-item">
                    <strong>{f.username}</strong>: {f.reason}
                  </div>
                ))}
              </div>
            )}
            <button onClick={onClose} className="batch-import-modal__done-btn">Done</button>
          </>
        )}
      </div>
    </div>
  );
}
