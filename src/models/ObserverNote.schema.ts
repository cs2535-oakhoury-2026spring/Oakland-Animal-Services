import { z } from "zod";

export const ObserverNoteSchema = z.object({
  id: z.number().int(),
  status: z.string().optional(),
  timestamp: z.instanceof(Date),
  title: z.string().optional(),
  content: z.string().min(1),
  author: z.string().min(1),
  petId: z.number().int(),
});

export const ObserverNoteCreateSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  author: z.string().optional(),
  petId: z.number().int(),
  status: z.string().optional(),
});

export type ObserverNote = z.infer<typeof ObserverNoteSchema>;
export type ObserverNoteCreate = z.infer<typeof ObserverNoteCreateSchema>;
