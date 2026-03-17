import { PetSchema, type Pet } from "../models/Pet.schema.js";
import { PetRepository } from "../types/index.js";

export class MockPetRepository implements PetRepository {
  private readonly pets: Pet[];
  private readonly catLocationMap: Map<string, Pet[]>;
  private readonly dogLocationMap: Map<string, Pet[]>;

  constructor() {
    const marley = PetSchema.parse({
      id: 22254130,
      name: "Marley",
      age: 25,
      birthdate: "7/6/2000",
      sex: "Male",
      species: "Cat",
      image:
        "https://cdn.rescuegroups.org/12/pictures/animals//182/6.jpg?width=100",
      description: `<div class="rgDescription">Marley is a young white male, about 2 years old. Found wandering the streets near the Inner Harbor. EXTREMELY friendly.  FELV/FIV negative, shots, neutered.  Marley is currently in the adoption cage at Bethany Centennial Animal Hospital.  Call for hours and directions (and to make sure he's still there before you visit).  410-750-2322.</div>`,
      summary: `<div class="rgDescription">Marley is a young white male, about 2 years old. Found wandering the streets near the Inner Harbor. EXTREMELY friendly.  FELV/FIV negative, shots, neutered.  Marley is currently in the adoption cage at Bethany Centennial Animal Hospital.  Call for hours and directions (and to make sure he's still there before you visit).  410-750-2322.</div>`,
      breed: "Domestic Short Hair",
      status: "Adopted",
      rescueId: "",
      availableDate: "",
      otherNames: undefined,
      distinguishingMarks: "",
      generalAge: "Adult",
      generalSize: "",
      colorDetails: "White",
      specialNeeds: "",
      pictures: ["https://cdn.rescuegroups.org/12/pictures/animals//182/6.jpg"],
    } as any);

    const anotherCat = PetSchema.parse({
      ...marley,
      id: 22254131,
      name: "Nala",
      summary: "I am at Oakland Animal Services in kennel E:1",
      species: "Cat",
    } as any);

    const dog = PetSchema.parse({
      ...marley,
      id: 22325213,
      name: "Buddy",
      species: "Dog",
      summary: "I am at Oakland Animal Services in kennel E:1",
    } as any);

    this.pets = [marley, anotherCat, dog];

    this.catLocationMap = new Map([["e:1", [anotherCat]]]);

    this.dogLocationMap = new Map([["e:1", [dog]]]);
  }

  async getById(id: number): Promise<Pet | undefined> {
    return this.pets.find((pet) => pet.id === id);
  }

  async getDogIdFromLocation(location: string): Promise<number | undefined> {
    const lower = location.toLowerCase();
    return this.dogLocationMap.get(lower)?.[0]?.id;
  }

  async getCatIdFromLocation(location: string): Promise<number | undefined> {
    const lower = location.toLowerCase();
    return this.catLocationMap.get(lower)?.[0]?.id;
  }
}
