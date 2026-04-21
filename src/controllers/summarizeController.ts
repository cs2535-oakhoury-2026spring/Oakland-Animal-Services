import { Request, Response } from "express";
import { summarizeText } from "../services/summarizeService.js";
import { logActivity } from "../utils/logActivity.js";

export const summarizeNote = async (req: Request, res: Response) => {
  const petId = parseInt(req.params.petId as string);
  const prompt = req.body.prompt;
  const includeBehaviorNotes = req.body.includeBehaviorNotes !== false;
  const includeObserverNotes = req.body.includeObserverNotes !== false;

  if (!petId) {
    return res.status(400).json({ success: false, summary: "" });
  }

  try {
    const summary = await summarizeText(petId, prompt, undefined, {
      includeBehaviorNotes,
      includeObserverNotes,
    });

    logActivity({
      tag: "authEvent",
      actor: req.user!.username,
      action: "SUMMARY_GENERATED",
      jsonData: {
        petId,
        promptLength: typeof prompt === "string" ? prompt.length : 0,
        includeBehaviorNotes,
        includeObserverNotes,
      },
    });

    res.json({ success: true, summary });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({ success: false, summary: "" });
  }
};
