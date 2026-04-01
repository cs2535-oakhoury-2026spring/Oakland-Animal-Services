import { Request, Response } from 'express';
import { summarizeText } from '../services/summarizeService.js';

export const summarizeNote = async (req: Request, res: Response) => {
    const petId = parseInt(req.params.petId as string);

    if (!petId) {
    return res.json({ success: false, summary: '' });
    }

    try {
    const summary = await summarizeText(petId);
    res.json({ success: true, summary });
    } catch (error) {
    console.error('Summarization error:', error);
    res.json({ success: false, summary: '' });
    }
};