import { Request, Response } from "express";
import { summarizeText } from "../services/summarizeService.js";
import { logActivity } from "../utils/logActivity.js";

export const summarizeNote = async (req: Request, res: Response) => {
  const petId = parseInt(req.params.petId as string);
  const prompt = req.body.prompt;
  if (!petId) {
    return res.status(400).json({ success: false, summary: "" });
  }

  try {
    const summary = await summarizeText(petId, prompt);

    logActivity({
      tag: "authEvent",
      actor: req.user!.username,
      action: "SUMMARY_GENERATED",
      jsonData: {
        petId,
        promptLength: typeof prompt === "string" ? prompt.length : 0,
      },
    });

    res.json({ success: true, summary });
  } catch (error) {
    console.error("Summarization error:", error);
    res.status(500).json({ success: false, summary: "" });
  }
};
