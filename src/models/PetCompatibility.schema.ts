import { z } from "zod";

export const PetCompatibilitySchema = z.object({
  petId: z.number().int(),
  kidsOver12: z.string().optional(),
  kidsUnder12: z.string().optional(),
  // Dog-specific
  canLiveWithCats: z.string().optional(),
  dogToDog: z.string().optional(),
  // Cat-specific
  canLiveWithDogs: z.string().optional(),
  catToCat: z.string().optional(),
});

export type PetCompatibility = z.infer<typeof PetCompatibilitySchema>;
