import config from "../config/index.js";
import OpenAI from 'openai';
import { MockBehaviorNoteRepository } from "../db/_mock/mockBehaviorNotesDB.js";

const client = new OpenAI({
    apiKey: config.LLM_API_KEY,
});

/**
 * Summarizes text using OpenAI (placeholder for now, can swap Azure later)
 */
export const summarizeText = async (petId: number): Promise<string> => {
    const repo = new MockBehaviorNoteRepository();
    const notes = await repo.getBehaviorNoteByPetId(petId);
    const text = notes.map(note => note.content).join(" ");

    const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
        { role: 'system', content: 'Summarize the following text in 2-4 concise sentences' },
        { role: 'user', content: text },
    ],
    temperature: 0.3,
    max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
};