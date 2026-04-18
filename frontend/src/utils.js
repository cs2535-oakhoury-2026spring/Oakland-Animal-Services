import { GENERAL_AGE_RANGES } from "./constants.js";

// Strip HTML tags from API description fields for plain-text display
export function stripHtml(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// Shared timestamp formatter used by note cards
export const formatTimestamp = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch {
    return "";
  }
};

// Parse weight from description text (e.g. "about 56 pounds" → "56 lbs")
export function parseWeightFromDesc(desc) {
  if (!desc) return null;
  const m = desc.match(/(\d+)\s*(?:pounds?|lbs?)/i);
  return m ? `${m[1]} lbs` : null;
}

// Compute display age as "Xy Zm/o" from description age + listing date
// Parses "X year(s) old" from description, then adds months elapsed since reference date
// Prefers receivedDate (when shelter assessed the animal) over createdDate
export function computeDisplayAge(desc, createdDate, receivedDate, generalAge, species) {
  let baseMonths = 0;
  if (desc) {
    const ym = desc.match(/(\d+)\s*year/i);
    const mm = desc.match(/(\d+)\s*month/i);
    if (ym) baseMonths += parseInt(ym[1], 10) * 12;
    if (mm) baseMonths += parseInt(mm[1], 10);
  }
  const refDate = receivedDate || createdDate;
  if (baseMonths > 0 && refDate) {
    const ref = new Date(refDate);
    if (!isNaN(ref.getTime())) {
      const now = new Date();
      const elapsedMonths = (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth());
      baseMonths += Math.max(0, elapsedMonths);
    }
  }
  if (baseMonths > 0) {
    const y = Math.floor(baseMonths / 12);
    const m = baseMonths % 12;
    if (y > 0 && m > 0) return `${y}y ${m}m/o`;
    if (y > 0) return `${y}y`;
    return `${m}m/o`;
  }
  if (generalAge) {
    const speciesKey = (species || "").toLowerCase();
    const table = GENERAL_AGE_RANGES[speciesKey] || GENERAL_AGE_RANGES.default;
    const range = table[generalAge];
    return range ? `${generalAge} (${range})` : generalAge;
  }
  return "Unknown";
}

// Compute display age from ISO birthdate string e.g. "2023-06-01" → "2y 10m/o"
export function computeAgeFromBirthdate(birthdate) {
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return "Unknown";
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  if (months <= 0) return "< 1m/o";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y > 0 && m > 0) return `${y}y ${m}m/o`;
  if (y > 0) return `${y}y`;
  return `${m}m/o`;
}

/**
 * Parse kennel location from RescueGroups summary field
 * Example: "I am at Oakland Animal Services in kennel Cat W:5" → "Cat W:5"
 * Handles foster animals specially: returns "In Foster"
 */
export function parseLocationFromSummary(summary) {
  if (!summary) return "";
  const trimmed = summary.trim();
  if (trimmed.toLowerCase().includes("foster")) return "In Foster";
  const prefix = "I am at Oakland Animal Services in kennel ";
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim();
  }
  return "";
}

// Decode JWT payload (client-side only, no verification)
export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// ─── Levenshtein Distance ─────────────────────────────────────────────────────
// Used by both HighlightedText (fuzzy highlighting) and fuzzyMatchText (local filter).
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => j === 0 ? i : 0));
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// ─── Fuzzy Match Helper ───────────────────────────────────────────────────────
// Returns true if every query word either appears as a substring or is within
// ~25% edit distance of any word in the text (tolerates 1 typo in short words).
export function fuzzyMatchText(text, query) {
  if (!text || !query) return false;
  const textLower = text.toLowerCase();
  const textWords = textLower.split(/\W+/).filter(Boolean);
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  return queryWords.every((qw) => {
    if (textLower.includes(qw)) return true;
    const maxDist = Math.max(1, Math.floor(qw.length * 0.25));
    return textWords.some((tw) => levenshtein(tw, qw) <= maxDist);
  });
}
