import { getAllNotes, addNote, } from "../services/observerNoteService.js";
import { ObserverNoteCreateSchema, ObserverNoteSchema, } from "../models/ObserverNote.schema.js";
export function listObserverNotes(req, res) {
    res.json({ success: true, observerNotes: getAllNotes() });
}
export function uploadObserverNote(req, res) {
    const parseResult = ObserverNoteCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.format() });
    }
    const { content, author } = parseResult.data;
    const newNote = {
        timestamp: new Date(),
        content,
        author,
    };
    ObserverNoteSchema.parse(newNote);
    addNote(newNote);
    res.json({ success: true, message: "Observer note uploaded successfully", observerNote: newNote });
}
