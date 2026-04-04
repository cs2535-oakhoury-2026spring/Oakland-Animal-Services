import { Request, Response } from 'express';
import { summarizeText } from '../services/summarizeService.js';

export const summarizeNote = async (req: Request, res: Response) => {
    const petId = parseInt(req.params.petId as string);
    const prompt = req.body.prompt;
    if (!petId) {
    return res.status(400).json({ success: false, summary: '' });
    }

    try {
    const summary = await summarizeText(petId, prompt);
    res.json({ success: true, summary });
    } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ success: false, summary: '' });
    }
};