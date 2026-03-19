import express from 'express';
import { summarizeNote } from '../controllers/summarizeController.js';

const router = express.Router();

router.post('/api/summarize', summarizeNote);

export default router;