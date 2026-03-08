import { searchNotes } from "../services/observerNoteService.js";
export function search(req, res) {
    const { note: observerNoteContent, nameToExclude, maxResults } = req.body;
    if (!observerNoteContent) {
        return res.status(400).json({ error: "Observer note content is required" });
    }
    try {
        const results = searchNotes(observerNoteContent, {
            nameToExclude,
            maxResults: maxResults || 5,
        });
        res.json({ success: true, query: observerNoteContent, results, resultCount: results.length });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
}
