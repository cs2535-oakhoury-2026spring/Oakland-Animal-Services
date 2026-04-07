import { levenshtein as levenshteinDistance } from "./levenshtein.js";
// Common words to exclude from keyword extraction
const TOKENS_TO_EXCLUDE = new Set([
  // articles / determiners
  "the",
  "a",
  "an",
  "this",
  "that",
  "these",
  "those",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "some",
  "any",
  "each",
  "every",
  "both",
  "all",
  "few",
  "more",
  "most",
  "other",
  "such",
  "no",
  "nor",
  "not",
  // prepositions
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "up",
  "about",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "then",
  "once",
  "as",
  "per",
  // conjunctions
  "and",
  "or",
  "but",
  "so",
  "yet",
  "if",
  "than",
  "because",
  "while",
  "although",
  "though",
  "since",
  "until",
  "unless",
  "when",
  "where",
  // pronouns
  "i",
  "me",
  "we",
  "us",
  "he",
  "him",
  "she",
  "it",
  "they",
  "them",
  "who",
  "whom",
  "which",
  "what",
  // auxiliary verbs
  "be",
  "am",
  "is",
  "are",
  "was",
  "were",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "do",
  "does",
  "did",
  "doing",
  "will",
  "would",
  "shall",
  "should",
  "can",
  "could",
  "may",
  "might",
  "must",
]);
function toSingular(word) {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ves") && word.length > 4) return word.slice(0, -3) + "f";
  if (
    word.endsWith("ses") ||
    word.endsWith("xes") ||
    word.endsWith("zes") ||
    word.endsWith("ches") ||
    word.endsWith("shes")
  ) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}
// Words to exclude from normalization to avoid incorrect matches (e.g. "left" vs "leave")
const NORMALIZATION_EXCLUSIONS = new Set([
  "left",
  "right",
  "front",
  "back",
  "hind",
  "fore",
]);
/**
 *  Extracts keywords from the given text.
 * @param text The input text to extract keywords from.
 * @param nameToExclude An optional name to exclude from the keywords (e.g. animal name).
 * @returns An array of extracted keywords.
 */
export function extractKeywords(text, nameToExclude) {
  const seen = new Set();
  const keywords = [];
  nameToExclude = nameToExclude ? nameToExclude.toLowerCase() : undefined;
  function addKeyword(token) {
    if (token.length >= 2 && !seen.has(token)) {
      seen.add(token);
      keywords.push(token);
    }
  }
  const words = text.match(/\w+/g) || [];
  words.forEach((word) => {
    const lower = word.toLowerCase();
    if (nameToExclude && lower === nameToExclude) return;
    if (TOKENS_TO_EXCLUDE.has(lower)) return;
    addKeyword(lower);
    // singular form
    const singular = toSingular(lower);
    if (singular !== lower) addKeyword(singular);
    // stem -ing / -ed
    if (lower.endsWith("ing") && lower.length > 4) {
      addKeyword(lower.slice(0, -3));
    } else if (lower.endsWith("ed") && lower.length > 3) {
      addKeyword(lower.slice(0, -2));
    }
  });
  return keywords;
}
/**
 *  Finds matching indices in the note content for a given keyword, allowing for fuzzy matches based on Levenshtein distance.
 * @param tokens The preprocessed tokens of the note content.
 * @param keyword The keyword to search for.
 * @param normalizations A map of token normalizations.
 * @param lowerText The lowercase version of the note content.
 * @returns An array of matching indices.
 */
function findMatchIndices(tokens, keyword, normalizations, lowerText) {
  const indices = [];
  const lowerKeyword = keyword.toLowerCase();
  const maxDistance = Math.max(1, Math.ceil(keyword.length * 0.2));
  let searchPos = 0;
  tokens.forEach((token) => {
    const normalizedToken = normalizations.get(token.lower) || token.lower;
    const distance = levenshteinDistance(normalizedToken, lowerKeyword);
    if (distance <= maxDistance) {
      const tokenStart = lowerText.indexOf(token.lower, searchPos);
      if (tokenStart !== -1) {
        indices.push({
          start: tokenStart,
          end: tokenStart + token.text.length,
        });
        searchPos = tokenStart + token.text.length;
      }
    } else {
      const tokenStart = lowerText.indexOf(token.lower, searchPos);
      if (tokenStart !== -1) {
        searchPos = tokenStart + token.text.length;
      }
    }
  });
  return indices;
}
/**
 *  Highlights matched keywords in the note content by wrapping them in <b> tags.
 * @param content   The original note content.
 * @param matchedIndices  A set of character indices that are part of matched keywords.
 * @returns The note content with matched keywords highlighted.
 */
function highlightMatches(content, matchedIndices) {
  if (matchedIndices.size === 0) return content;
  const ranges = [];
  let rangeStart = -1;
  for (let i = 0; i < content.length; i++) {
    if (matchedIndices.has(i)) {
      if (rangeStart === -1) rangeStart = i;
    } else {
      if (rangeStart !== -1) {
        ranges.push({ start: rangeStart, end: i });
        rangeStart = -1;
      }
    }
  }
  if (rangeStart !== -1) {
    ranges.push({ start: rangeStart, end: content.length });
  }
  let result = "";
  let lastEnd = 0;
  for (const range of ranges) {
    result += content.slice(lastEnd, range.start);
    result += "<b>" + content.slice(range.start, range.end) + "</b>";
    lastEnd = range.end;
  }
  result += content.slice(lastEnd);
  return result;
}
/**
 *  Finds notes similar to the search note based on extracted keywords and fuzzy matching.
 * @param searchNote The note content to search for similar notes.
 * @param allNotes The list of all notes to search within.
 * @param options Additional options for the search such as caching and result limits.
 * @returns A list of similar notes.
 */
export function findSimilarNotes(searchNote, allNotes, options = {}) {
  const startOverallTime = performance.now();
  const { nameToExclude, maxResults, noteDataCache } = options;
  console.log(
    `[NoteSearch] ── START ──────────────────────────────\n` +
      `  query      : "${searchNote}"\n` +
      `  notes      : ${allNotes.length}\n` +
      `  maxResults : ${maxResults ?? "unlimited"}\n` +
      `  exclude    : ${nameToExclude ?? "none"}\n` +
      `  cache size : ${noteDataCache?.size ?? 0} entries`,
  );
  const startExtractTime = performance.now();
  const keywords = extractKeywords(searchNote, nameToExclude);
  const endExtractTime = performance.now();
  console.log(
    `[NoteSearch] keywords (${keywords.length}) in ${(endExtractTime - startExtractTime).toFixed(2)} ms: [${keywords.join(", ")}]`,
  );
  if (keywords.length === 0) return [];
  const noteDataMap = noteDataCache || new Map();
  const sizeBeforePreprocess = noteDataMap.size;
  const startTime = performance.now();
  // Preprocess all notes to extract tokens and normalizations, using cache if available
  allNotes.forEach((note) => {
    const noteKey = `${note.author}|${note.timestamp}|${note.title}|${note.content}`;
    if (noteDataMap.has(noteKey)) return;
    const normalizations = new Map();
    const tokens = [];
    const words = note.content.match(/\w+/g) || [];
    words.forEach((word) => {
      const lower = word.toLowerCase();
      tokens.push({ text: word, lower });
      if (!normalizations.has(lower) && !NORMALIZATION_EXCLUSIONS.has(lower)) {
        const singular = toSingular(lower);
        if (singular !== lower) {
          normalizations.set(lower, singular);
        } else if (lower.endsWith("ing") && lower.length > 4) {
          normalizations.set(lower, lower.slice(0, -3));
        } else if (lower.endsWith("ed") && lower.length > 3) {
          normalizations.set(lower, lower.slice(0, -2));
        }
      }
    });
    // Also tokenize the title and add its normalizations to the same map
    const titleText = (note.title || "").trim();
    const titleTokens = [];
    (titleText.match(/\w+/g) || []).forEach((word) => {
      const lower = word.toLowerCase();
      titleTokens.push({ text: word, lower });
      if (!normalizations.has(lower) && !NORMALIZATION_EXCLUSIONS.has(lower)) {
        const singular = toSingular(lower);
        if (singular !== lower) {
          normalizations.set(lower, singular);
        } else if (lower.endsWith("ing") && lower.length > 4) {
          normalizations.set(lower, lower.slice(0, -3));
        } else if (lower.endsWith("ed") && lower.length > 3) {
          normalizations.set(lower, lower.slice(0, -2));
        }
      }
    });
    noteDataMap.set(noteKey, {
      tokens,
      titleTokens,
      normalizations,
      lowerContent: note.content.toLowerCase(),
      lowerTitle: titleText.toLowerCase(),
    });
  });
  const endTime = performance.now();
  const freshCount = noteDataMap.size - sizeBeforePreprocess;
  console.log(
    `[NoteSearch] preprocess: ${(endTime - startTime).toFixed(2)} ms` +
      ` — ${allNotes.length - freshCount} from cache, ${freshCount} freshly built`,
  );
  const noteMatches = new Map();
  const startFindTime = performance.now();
  // Find matches for each keyword in each note
  allNotes.forEach((note) => {
    const noteKey = `${note.author}|${note.timestamp}|${note.title}|${note.content}`;
    const noteData = noteDataMap.get(noteKey);
    keywords.forEach((keyword) => {
      const positions = findMatchIndices(
        noteData.tokens,
        keyword,
        noteData.normalizations,
        noteData.lowerContent,
      );
      // Also search the title with the same fuzzy logic
      const titlePositions = findMatchIndices(
        noteData.titleTokens,
        keyword,
        noteData.normalizations,
        noteData.lowerTitle,
      );
      if (positions.length === 0 && titlePositions.length === 0) return;
      if (!noteMatches.has(noteKey)) {
        noteMatches.set(noteKey, {
          note: note,
          matchCount: 0,
          matchedKeywords: new Map(),
          matchedIndices: new Set(),
          matchedTitleIndices: new Set(),
        });
      }
      const noteMatch = noteMatches.get(noteKey);
      if (!noteMatch.matchedKeywords.has(keyword)) {
        noteMatch.matchCount += 1;
        noteMatch.matchedKeywords.set(keyword, {
          keyword: keyword,
          positions,
        });
        positions.forEach((pos) => {
          for (let i = pos.start; i < pos.end; i++) {
            noteMatch.matchedIndices.add(i);
          }
        });
        titlePositions.forEach((pos) => {
          for (let i = pos.start; i < pos.end; i++) {
            noteMatch.matchedTitleIndices.add(i);
          }
        });
      }
    });
  });
  const endFindTime = performance.now();
  console.log(
    `[NoteSearch] matching: ${(endFindTime - startFindTime).toFixed(2)} ms` +
      ` — ${noteMatches.size}/${allNotes.length} notes matched across ${keywords.length} keywords`,
  );
  // Compile results with highlighted content and sort by relevance and recency
  const results = Array.from(noteMatches.values())
    .map((match) => {
      const seenPositions = new Set();
      const uniqueKeywords = Array.from(match.matchedKeywords.values()).filter(
        (kw) => {
          const posKey = kw.positions
            .map((p) => `${p.start}-${p.end}`)
            .join("|");
          if (seenPositions.has(posKey)) {
            return false;
          }
          seenPositions.add(posKey);
          return true;
        },
      );
      const highlightedContent = highlightMatches(
        match.note.content,
        match.matchedIndices,
      );
      const highlightedTitle = highlightMatches(
        match.note.title || "",
        match.matchedTitleIndices,
      );
      return {
        observerNote: match.note,
        matchCount: uniqueKeywords.length,
        matchedKeywords: uniqueKeywords.map((kw) => ({
          keyword: kw.keyword,
          positions: kw.positions,
        })),
        highlightedContent,
        highlightedTitle,
      };
    })
    .sort((a, b) => {
      const matchDiff = b.matchCount - a.matchCount;
      if (Math.abs(matchDiff) <= 2) {
        const dateA = a.observerNote.timestamp.getTime();
        const dateB = b.observerNote.timestamp.getTime();
        return dateB - dateA;
      }
      return matchDiff;
    });
  const endOverallTime = performance.now();
  const returned = maxResults ? results.slice(0, maxResults) : results;
  console.log(
    `[NoteSearch] ── DONE ───────────────────────────────\n` +
      `  total time : ${(endOverallTime - startOverallTime).toFixed(2)} ms\n` +
      `  results    : ${returned.length} returned (${results.length} total matches)\n` +
      (returned.length > 0
        ? `  top result : "${returned[0].observerNote.title}" — ${returned[0].matchCount} keyword(s) matched`
        : `  top result : none`),
  );
  return maxResults ? results.slice(0, maxResults) : results;
}
