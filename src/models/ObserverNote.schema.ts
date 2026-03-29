import { z } from "zod";

export const ObserverNoteSchema = z.object({
  id: z.number().int(),
  status: z.string().optional(),
  timestamp: z.instanceof(Date),
  content: z.string().min(1),
  author: z.string().min(1),
  petId: z.number().int(),
});

export const ObserverNoteCreateSchema = z.object({
  content: z.string().min(1),
  author: z.string().min(1),
  petId: z.number().int(),
});

export type ObserverNote = z.infer<typeof ObserverNoteSchema>;
export type ObserverNoteCreate = z.infer<typeof ObserverNoteCreateSchema>;
