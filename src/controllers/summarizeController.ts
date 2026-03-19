import { Request, Response } from 'express';
import { summarizeText } from '../services/summarizeService.js';

export const summarizeNote = async (req: Request, res: Response) => {
    const { text } = req.body as { text: string };

    if (!text || !text.trim()) {
    return res.json({ success: false, summary: '' });
    }

    try {
    // Call service to get summary (OpenAI for now)
    const summary = await summarizeText(text);

    res.json({ success: true, summary });
    } catch (error) {
    console.error('Summarization error:', error);
    res.json({ success: false, summary: '' });
    }
};