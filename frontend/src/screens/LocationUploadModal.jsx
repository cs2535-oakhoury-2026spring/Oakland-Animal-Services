import { useState } from "react";
import { useFocusTrap, useEscapeKey } from "../hooks.js";
import "./LocationUploadModal.css";

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

function parseLocationCsv(csvText) {
  const sanitized = sanitizeCsvText(csvText);
  const lines = sanitized.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { locations: [], error: "No CSV content found." };
  }

  const header = lines[0].toLowerCase();
  if (header.includes("type") && header.includes("location")) {
    lines.shift();
  }

  const parsed = lines
    .map((line) => {
      const delimiter = line.includes("|") ? /\s*\|\s*/ : /\s*,\s*/;
      const parts = line.split(delimiter);
      if (parts.length < 2) return null;
      const species = parts[0].trim().toLowerCase();
      const location = parts[1].trim().toLowerCase();
      if (!species || !location) return null;
      return {
        species,
        location,
        label: `${species.toUpperCase()} ${location.toUpperCase()}`,
        count: 1,
        custom: true,
      };
    })
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  parsed.forEach((entry) => {
    const key = `${entry.species}|${entry.location}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(entry);
    }
  });

  if (unique.length === 0) {
    return {
      locations: [],
      error: "No valid rows found. Use columns like animalType,location." ,
    };
  }

  return { locations: unique, error: "" };
}

export default function LocationUploadModal({ onClose, onImport }) {
  const [csvText, setCsvText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const focusTrapRef = useFocusTrap(true);
  useEscapeKey(onClose, true);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      const sanitized = sanitizeCsvText(result);
      setCsvText(sanitized);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const { locations, error: parseError } = parseLocationCsv(csvText);
    if (parseError) {
      setError(parseError);
      return;
    }
    if (locations.length === 0) {
      setError("No valid location rows were found.");
      return;
    }
    setLoading(true);
    setError("");
    onImport(locations);
    setLoading(false);
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob(["animalType,location\ncat,holding 4:19\ndog,kennel 2:01\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locations_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="location-upload-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div ref={focusTrapRef} className="location-upload-modal__box" onClick={(e) => e.stopPropagation()}>
        <h2 className="location-upload-modal__title">Upload Locations CSV</h2>
        <p className="location-upload-modal__description">
          Upload a CSV file with columns <code>animalType,location</code> to add custom kennel locations.
        </p>
        <button onClick={downloadTemplate} className="location-upload-modal__template-link">
          Download template CSV
        </button>

        <label className="location-upload-modal__label">Select CSV file</label>
        <input
          type="file"
          accept=".csv,text/csv,.txt"
          onChange={handleFile}
          className="location-upload-modal__field location-upload-modal__file-input"
        />

        <label className="location-upload-modal__label">Or paste CSV directly</label>
        <textarea
          className="location-upload-modal__field location-upload-modal__textarea"
          placeholder="animalType,location\ncat,holding 4:19\ndog,kennel 2:01"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />

        {error && <div className="location-upload-modal__error">{error}</div>}

        <div className="location-upload-modal__footer">
          <button onClick={onClose} className="location-upload-modal__cancel-btn">Cancel</button>
          <button
            onClick={handleImport}
            disabled={loading || !csvText.trim()}
            className="location-upload-modal__import-btn"
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
