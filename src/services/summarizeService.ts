import config from "../config/index.js";
import OpenAI from "openai";
import { getBehaviorNotesByPetId } from "../db/behaviorNotes.js";

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

  if (notes.length === 0) {
    return "No behavior notes found for this pet.";
  }
  const text = notes
    .map(
      (note) =>
        `${note.content}|${note.timestamp.toISOString()}|${note.author}`,
    )
    .join("\n");
  const instruction =
    prompt || "Summarize the note data in 2-5 concise sentences";
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes pet notes for shelter staff. Note content is separated by | and includes the note text, timestamp, and author.",
      },
      { role: "user", content: instruction + "\n" + text },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
};
