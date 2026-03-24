import express from 'express';
import { summarizeNote } from '../controllers/summarizeController.js';

const router = express.Router();
// api/summarize/:petid/:notetype
//in the json body for API have {prompt: "" summarize last week}

//route call controller, controller call services, services is where you call observernoteservice (getobservernotesbyid), send that to AI and return the summary
//use postman?
router.post('/summarize', summarizeNote);

export default router;