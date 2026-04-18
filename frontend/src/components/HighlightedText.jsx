import { levenshtein } from "../utils.js";
import './HighlightedText.css';

// ─── Highlighted Text Component ──────────────────────────────────────────────
// Priority 1: backend <b> tags (exact positions from NLP fuzzy search)
// Priority 2: client-side fuzzy word highlighting (tolerates typos via Levenshtein)
// Priority 3: plain text
export default function HighlightedText({ text, searchQuery, highlightColor = "#FFEB3B" }) {
  // Backend returned pre-highlighted content with <b> tags — render those
  if (text && text.includes("<b>")) {
    const parts = text.split(/(<b>.*?<\/b>)/g);
    return (
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("<b>") && part.endsWith("</b>")) {
            const inner = part.slice(3, -4);
            return (
              <mark
                key={i}
                className="highlighted-text__mark"
                style={{ backgroundColor: highlightColor }}
              >
                {inner}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  // Client-side fuzzy highlighting: split text into word/non-word tokens,
  // highlight any word that fuzzy-matches a query word (handles typos).
  if (searchQuery && searchQuery.trim() && text) {
    const queryWords = searchQuery.toLowerCase().split(/\W+/).filter(Boolean);
    // Split text into alternating [word, non-word] segments preserving original case
    const segments = text.split(/(\w+)/);
    return (
      <span>
        {segments.map((seg, i) => {
          if (!/\w+/.test(seg)) return <span key={i}>{seg}</span>;
          const segLower = seg.toLowerCase();
          const isMatch = queryWords.some((qw) => {
            if (segLower.includes(qw) || qw.includes(segLower)) return true;
            const maxDist = Math.max(1, Math.floor(Math.max(qw.length, segLower.length) * 0.25));
            // Only fuzzy-match if lengths are close enough to be plausible typos
            if (Math.abs(qw.length - segLower.length) > maxDist) return false;
            return levenshtein(segLower, qw) <= maxDist;
          });
          return isMatch
            ? (
              <mark
                key={i}
                className="highlighted-text__mark"
                style={{ backgroundColor: highlightColor }}
              >
                {seg}
              </mark>
            )
            : <span key={i}>{seg}</span>;
        })}
      </span>
    );
  }

  return <span>{text}</span>;
}
