import { z } from "zod";


export const ObserverNoteSchema = z.object({
  timestamp: z.instanceof(Date),
  content: z.string().min(1),
  author: z.string().min(1),
});


export const ObserverNoteCreateSchema = z.object({
  content: z.string().min(1),
  author: z.string().min(1),
});

export type ObserverNote = z.infer<typeof ObserverNoteSchema>;
export type ObserverNoteCreate = z.infer<typeof ObserverNoteCreateSchema>;

