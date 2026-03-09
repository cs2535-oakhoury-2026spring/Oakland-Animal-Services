import { z } from "zod";

export const PetSchema = z.object({
  id: z.int(),
  name: z.string().min(1),
  age: z.number().int().positive(),
  sex: z.string().min(1),
  image: z.string().optional(),
  summary: z.string().min(1),
  species: z.string().min(1),
  breed: z.string().optional(),
});

export type Pet = z.infer<typeof PetSchema>;
