import { PetSchema, type Pet } from "../models/Pet.schema.js";

const _pets: Pet[] = [];

export function getPetById(id: number): Pet|undefined {
  return _pets.find((pet) => pet.id === id);
}

export function seedPets(initial: Pet[]) {
  _pets.length = 0;
  initial.forEach((pet) => PetSchema.parse(pet));
  _pets.push(...initial);
}

seedPets([
  {
    id: 1,
    name: "Buddy",
    age: 3,
    sex: "Male",
    image: "https://example.com/buddy.jpg",
    summary: "Friendly golden retriever who loves playing fetch",
    species: "Dog",
    breed: "Golden Retriever",
  },
  {
    id: 2,
    name: "Whiskers",
    age: 2,
    sex: "Female",
    image: "https://example.com/whiskers.jpg",
    summary: "Curious tabby cat with a playful personality",
    species: "Cat",
    breed: "Tabby",
  },
]);
