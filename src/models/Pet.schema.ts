import { z } from "zod";

export const PetSchema = z.object({
  id: z.int(),
  name: z.string().min(1),
  age: z.number().int().nonnegative(),

  birthdate: z.string().optional(),
  sex: z.string().min(1),
  species: z.string().min(1),

  image: z.string().optional(),
  description: z.string().optional(),
  locationSummary: z.string().min(1),
  breed: z.string().optional(),

  status: z.string().optional(),
  arn: z.string().optional(),
  availableDate: z.string().optional(),
  handlerLevel: z.string().optional(),
  dogDogCategory: z.string().optional(),
  generalAge: z.string().optional(),
  generalSize: z.string().optional(),
  colorDetails: z.string().optional(),
  handlingDescription: z.string().optional(),
  altered: z.string().optional(),
  okWithCats: z.string().optional(),
  okWithDogs: z.string().optional(),
  okWithKids: z.string().optional(),
  weightPounds: z.string().optional(),
  energyLevel: z.string().optional(),
  notes: z.string().optional(),
  createdDate: z.string().optional(),
  receivedDate: z.string().optional(),
});

export const PetLocationSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  image: z.string().optional(),
  locationSummary: z.string().min(1),
  status: z.string().optional(),
  species: z.string().optional(),
});

export type Pet = z.infer<typeof PetSchema>;
export type PetLocation = z.infer<typeof PetLocationSchema>;