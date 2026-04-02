import nlp from "compromise";
import { distance } from "fastest-levenshtein";
import {
  type ObserverNote,
  type SimilarNoteResult,
} from "../services/observerNoteService.js";

function levenshteinDistance(str1: string, str2: string): number {
  return distance(str1, str2);
}

// Common words to exclude from keyword extraction
const TOKENS_TO_EXCLUDE = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
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

// Words to exclude from normalization to avoid incorrect matches (e.g. "left" vs "leave")
const NORMALIZATION_EXCLUSIONS = new Set([
  "left",
  "right",
  "front",
  "back",
  "hind",
  "fore",
]);

export type NoteData = {
  tokens: Array<{ text: string; lower: string }>;
  normalizations: Map<string, string>;
  lowerContent: string;
};

/**
 *  Extracts keywords from the given text.
 * @param text The input text to extract keywords from.
 * @param nameToExclude An optional name to exclude from the keywords (e.g. animal name).
 * @returns An array of extracted keywords.
 */
export function extractKeywords(
  text: string,
  nameToExclude?: string,
): string[] {
  const doc = nlp(text.toLowerCase());
  const seen = new Set<string>();
  const keywords: string[] = [];
  nameToExclude = nameToExclude ? nameToExclude.toLowerCase() : undefined;

  function addKeyword(token: string) {
    if (token.length >= 2 && !seen.has(token)) {
      seen.add(token);
      keywords.push(token);
    }
  }

  doc.terms().forEach((term: any) => {
    const token = term.text();

    if (nameToExclude && token === nameToExclude.toLowerCase()) return;

    if (TOKENS_TO_EXCLUDE.has(token)) return;

    if (
      term.has("#Determiner") ||
      term.has("#Preposition") ||
      term.has("#Conjunction") ||
      term.has("#Pronoun")
    ) {
      return;
    }

    addKeyword(token);
  });

  doc.verbs().forEach((verb: any) => {
    const infinitive = verb.toInfinitive().text();
    console.log(`Verb: "${verb.text()}" -> Infinitive: "${infinitive}"`);
    if (TOKENS_TO_EXCLUDE.has(infinitive)) {
      return;
    }
    addKeyword(infinitive);
  });

  doc.nouns().forEach((noun: any) => {
    const singular = noun.toSingular().text();
    if (nameToExclude && singular === nameToExclude) {
      return;
    }
    addKeyword(singular);
  });

  const words = text.match(/\w+/g) || [];
  words.forEach((word) => {
    const lower = word.toLowerCase();
    let base;
    if (lower.endsWith("ing") && lower.length > 4) {
      base = lower.slice(0, -3);
    } else if (lower.endsWith("ed") && lower.length > 3) {
      base = lower.slice(0, -2);
    }
    if (base) {
      addKeyword(base);
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
function findMatchIndices(
  tokens: Array<{ text: string; lower: string }>,
  keyword: string,
  normalizations: Map<string, string>,
  lowerText: string,
): Array<{ start: number; end: number }> {
  const indices: Array<{ start: number; end: number }> = [];
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
function highlightMatches(
  content: string,
  matchedIndices: Set<number>,
): string {
  if (matchedIndices.size === 0) return content;

  const ranges: Array<{ start: number; end: number }> = [];
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
export function findSimilarNotes(
  searchNote: string,
  allNotes: ObserverNote[],
  options: {
    nameToExclude?: string;
    maxResults?: number;
    noteDataCache?: Map<string, NoteData>;
  } = {},
): SimilarNoteResult[] {
  console.log(
    `___Starting search for similar notes...\nSearch Note: "${searchNote}"\nTotal Notes: ${allNotes.length}\n`,
  );
  const startOverallTime = performance.now();
  const { nameToExclude, maxResults, noteDataCache } = options;
  const startExtractTime = performance.now();
  const keywords = extractKeywords(searchNote, nameToExclude);
  const endExtractTime = performance.now();
  console.log(
    `Extracted ${keywords.length} keywords in ${(endExtractTime - startExtractTime).toFixed(2)} ms\n`,
  );
  if (keywords.length === 0) return [];

  const noteDataMap = noteDataCache || new Map<string, NoteData>();
  const startTime = performance.now();

  // Preprocess all notes to extract tokens and normalizations, using cache if available
  allNotes.forEach((note) => {
    const noteKey = `${note.author}|${note.timestamp}|${note.content}`;
    if (noteDataMap.has(noteKey)) return;

    const doc = nlp(note.content);
    const normalizations = new Map<string, string>();

    doc.verbs().forEach((verb: any) => {
      const original = verb.text().toLowerCase();
      const infinitive = verb.toInfinitive().text().toLowerCase();

      if (!NORMALIZATION_EXCLUSIONS.has(original) && original !== infinitive) {
        normalizations.set(original, infinitive);
      }
    });

    doc.nouns().forEach((noun: any) => {
      const original = noun.text().toLowerCase();
      const singular = noun.toSingular().text().toLowerCase();

      if (!NORMALIZATION_EXCLUSIONS.has(original) && original !== singular) {
        normalizations.set(original, singular);
      }
    });

    const tokens: Array<{ text: string; lower: string }> = [];

    const words = note.content.match(/\w+/g) || [];
    words.forEach((word) => {
      const lower = word.toLowerCase();
      tokens.push({ text: word, lower });

      if (!normalizations.has(lower) && !NORMALIZATION_EXCLUSIONS.has(lower)) {
        let base;
        if (lower.endsWith("ing") && lower.length > 4) {
          base = lower.slice(0, -3);
        } else if (lower.endsWith("ed") && lower.length > 3) {
          base = lower.slice(0, -2);
        }
        if (base) {
          normalizations.set(lower, base);
        }
      }
    });

    noteDataMap.set(noteKey, {
      tokens,
      normalizations,
      lowerContent: note.content.toLowerCase(),
    });
  });

  const endTime = performance.now();
  console.log(
    `Preprocessed ${allNotes.length} notes in ${(endTime - startTime).toFixed(
      2,
    )} ms\n`,
  );

  const noteMatches = new Map<
    string,
    {
      note: ObserverNote;
      matchCount: number;
      matchedKeywords: Map<
        string,
        {
          keyword: string;
          positions: Array<{ start: number; end: number }>;
        }
      >;
      matchedIndices: Set<number>;
    }
  >();
  const startFindTime = performance.now();
  // Find matches for each keyword in each note
  allNotes.forEach((note) => {
    const noteKey = `${note.author}|${note.timestamp}|${note.content}`;
    const noteData = noteDataMap.get(noteKey)!;

    keywords.forEach((keyword) => {
      const positions = findMatchIndices(
        noteData.tokens,
        keyword,
        noteData.normalizations,
        noteData.lowerContent,
      );

      if (positions.length === 0) return;

      if (!noteMatches.has(noteKey)) {
        noteMatches.set(noteKey, {
          note: note,
          matchCount: 0,
          matchedKeywords: new Map(),
          matchedIndices: new Set(),
        });
      }

      const noteMatch = noteMatches.get(noteKey)!;

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
      }
    });
  });
  const endFindTime = performance.now();
  console.log(
    `Found matches for ${keywords.length} keywords in ${(endFindTime - startFindTime).toFixed(2)} ms\n`,
  );

  // Compile results with highlighted content and sort by relevance and recency
  const results: SimilarNoteResult[] = Array.from(noteMatches.values())
    .map((match) => {
      const seenPositions = new Set<string>();
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
      return {
        observerNote: match.note,
        matchCount: uniqueKeywords.length,
        matchedKeywords: uniqueKeywords.map((kw) => ({
          keyword: kw.keyword,
          positions: kw.positions,
        })),
        highlightedContent: highlightedContent,
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
  console.log(
    `Total search time: ${(endOverallTime - startOverallTime).toFixed(2)} ms\n`,
  );
  return maxResults ? results.slice(0, maxResults) : results;
}
