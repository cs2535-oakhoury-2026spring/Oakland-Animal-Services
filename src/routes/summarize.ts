import express from 'express';
import { summarizeNote } from '../controllers/summarizeController.js';

const router = express.Router();

// Have the api look like this
// /api/summarize/:petId/:noteType with the body of {"prompt": "Return the notes from the past week"}
// should be able to test this via postman.
router.post('/api/summarize', summarizeNote);

export default router;