import config from "../config/index.js";
import OpenAI from "openai";
import { getBehaviorNotesByPetId } from "../db/behaviorNotes.js";
import { getObserverNotesByPetId } from "../db/observerNotes.js";

const client = new OpenAI({
  apiKey: config.LLM_API_KEY,
});

/**
 * Summarizes text using OpenAI (placeholder for now, can swap Azure later)
 */
export const summarizeText = async (
  petId: number,
  prompt?: string,
): Promise<string> => {
  const notes = await getBehaviorNotesByPetId(petId);
  const obnotes = await getObserverNotesByPetId(petId);

  if (notes.length === 0 && obnotes.length === 0) {
    return "No notes found for this pet.";
  }
  const text =
    "BEHAVIOR NOTES:\n" +
    notes
      .map((note) => {
        const ts =
          note.timestamp instanceof Date
            ? note.timestamp.toISOString()
            : String(note.timestamp);
        return `${note.content}|${ts}|${note.author}`;
      })
      .join("\n") +
    "\n\nOBSERVATION NOTES:\n" +
    obnotes
      .map((note) => {
        const ts =
          note.timestamp instanceof Date
            ? note.timestamp.toISOString()
            : String(note.timestamp);
        const status = note.status || "N/A";
        return `${note.content}|${ts}|${note.author}|Status:${status}`;
      })
      .join("\n");
  const instruction =
    prompt || "Summarize the note data in 2-5 concise sentences";
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes pet notes for shelter staff. Note content is separated by | and includes the note text, timestamp, and author. Observation notes may also include a status field. Focus on key behaviors, trends, and any concerning patterns. Be concise and informative. Try to keep the summary under 4 sentences.",
      },
      { role: "user", content: instruction + "\n" + text },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
};
