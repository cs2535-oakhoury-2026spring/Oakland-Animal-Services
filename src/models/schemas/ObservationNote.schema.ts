import { z } from "zod";

export const ObservationNoteSchema = z.object({
  animalId: z.string(),
  dateReported: z.instanceof(Date),
  reportedBy: z.string().min(1),
  noteContent: z.string().min(1),
});

export const MedicalNoteSchema = ObservationNoteSchema.extend({
  noteType: z.literal("MEDICAL"),
  caseTitle: z.string().min(1),
  status: z.enum(["RAISED", "RESOLVED"]).default("RAISED"),
  resolvedAt: z.instanceof(Date).nullable().default(null),
  resolvedBy: z.string().nullable().default(null),
});

export const BehavioralNoteSchema = ObservationNoteSchema.extend({
  noteType: z.literal("BEHAVIOR"),
});

export type ObservationNote = z.infer<typeof ObservationNoteSchema>;
export type MedicalNote = z.infer<typeof MedicalNoteSchema>;
export type BehavioralNote = z.infer<typeof BehavioralNoteSchema>;
