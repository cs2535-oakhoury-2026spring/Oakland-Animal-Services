import config from "../config/index.js";
import OpenAI from "openai";
import { getBehaviorNotesByPetId } from "../db/behaviorNotes.js";
import { getObserverNotesByPetId } from "../db/observerNotes.js";
import type { LLMClient } from "../types/index.js";

const defaultSystemPrompt =
  "You are an assistant for animal shelter staff. Summarize pet behavior and observation notes using the provided labeled note records. " +
  "Behavior note lines use the fields: behavior, timestamp, author. Observation note lines use: observation, timestamp, author, status. " +
  "Focus on important patterns, repeated behaviors, mood, triggers, health concerns, and anything staff need to know. " +
  "If the user explicitly asks to focus only on behavior notes, ignore observation notes. " +
  "If the user explicitly asks to focus only on observation notes, ignore behavior notes. " +
  "Do not repeat every line; highlight the most relevant themes and any concerning findings. Keep the summary concise and under 4 sentences.";

class OpenAITextSummarizer implements LLMClient {
  private client = new OpenAI({ apiKey: config.LLM_API_KEY });
  private systemPrompt: string;

  constructor(systemPrompt: string = defaultSystemPrompt) {
    this.systemPrompt = systemPrompt;
  }

  public async summarize({
    instruction,
    text,
  }: {
    instruction: string;
    text: string;
  }): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: instruction + "\n" + text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  }
}

const defaultLlm = new OpenAITextSummarizer(defaultSystemPrompt);

/**
 * Summarizes text using OpenAI (placeholder for now, can swap Azure later)
 */
export const summarizeText = async (
  petId: number,
  prompt?: string,
  llm: LLMClient = defaultLlm,
): Promise<string> => {
  const notes = await getBehaviorNotesByPetId(petId);
  const obnotes = await getObserverNotesByPetId(petId);

  if (notes.length === 0 && obnotes.length === 0) {
    return "No notes found for this pet.";
  }
  const formatTimestamp = (timestamp: string | Date): string =>
    timestamp instanceof Date ? timestamp.toISOString() : String(timestamp);

  const formatBehaviorNote = (note: {
    content: string;
    timestamp: string | Date;
    author: string;
    title?: string;
  }): string => {
    const titlePart = note.title ? `Title: ${note.title} | ` : "";
    return `${titlePart}Behavior: ${note.content} | Timestamp: ${formatTimestamp(note.timestamp)} | Author: ${note.author}`;
  };

  const formatObserverNote = (note: {
    content: string;
    timestamp: string | Date;
    author: string;
    status?: string;
    title?: string;
  }): string => {
    const status = note.status || "N/A";
    const titlePart = note.title ? `Title: ${note.title} | ` : "";
    return `${titlePart}Observation: ${note.content} | Timestamp: ${formatTimestamp(note.timestamp)} | Author: ${note.author} | Status: ${status}`;
  };

  const instruction =
    prompt || "Summarize the note data in 2-5 concise sentences";

  const normalizedPrompt = instruction.toLowerCase();
  const focusBehaviorOnly =
    /behavior/.test(normalizedPrompt) &&
    !/(observation|observer)/.test(normalizedPrompt);
  const focusObserverOnly =
    /(observation|observer)/.test(normalizedPrompt) &&
    !/behavior/.test(normalizedPrompt);

  const textSections: string[] = [];

  if (!focusObserverOnly && notes.length > 0) {
    textSections.push(
      "BEHAVIOR NOTES:\n" + notes.map(formatBehaviorNote).join("\n"),
    );
  }

  if (!focusBehaviorOnly && obnotes.length > 0) {
    textSections.push(
      "OBSERVATION NOTES:\n" + obnotes.map(formatObserverNote).join("\n"),
    );
  }

  const text = textSections.join("\n\n");
  return llm.summarize({ instruction, text });
};
