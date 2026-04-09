import { z } from "zod";

export const BehaviorNoteSchema = z.object({
  id: z.number().int(),
  timestamp: z.instanceof(Date),
  title: z.string().optional(),
  content: z.string().min(1),
  author: z.string().min(1),
  petId: z.number().int(),
});

export const BehaviorNoteCreateSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  author: z.string().optional(), 
  petId: z.number().int(),
});

export type BehaviorNote = z.infer<typeof BehaviorNoteSchema>;
export type BehaviorNoteCreate = z.infer<typeof BehaviorNoteCreateSchema>;
