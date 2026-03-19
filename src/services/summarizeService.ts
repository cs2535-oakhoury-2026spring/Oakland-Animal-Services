import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Summarizes text using OpenAI (placeholder for now, can swap Azure later)
 */
export const summarizeText = async (text: string): Promise<string> => {
    const completion = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
        { role: 'system', content: 'Summarize the following text in 1–2 concise sentences.' },
        { role: 'user', content: text },
    ],
    temperature: 0.3,
    max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
};