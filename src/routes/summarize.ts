import express from 'express';
import { summarizeNote } from '../controllers/summarizeController.js';

const router = express.Router();

router.post('/summarize', summarizeNote);

export default router;