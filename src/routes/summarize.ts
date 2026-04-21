import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { summarizeNote } from "../controllers/summarizeController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const summarizeRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 6,
  message: {
    error:
      "Too many summarization requests, please wait a minute and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    String(
      req.user?.userId ?? ipKeyGenerator(String(req.ip ?? "")) ?? "anonymous",
    ),
});

// Have the api look like this
// /api/summarize/:petId/:noteType with the body of {"prompt": "Return the notes from the past week"}
// should be able to test this via postman.
router.post(
  "/api/pets/:petId/behavior-notes/summarize",
  authenticate,
  summarizeRateLimit,
  summarizeNote,
);

export default router;
