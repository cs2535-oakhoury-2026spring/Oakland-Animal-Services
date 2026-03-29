import { PetSchema, type Pet, type PetLocation } from "../../models/Pet.schema.js";
import { PetRepository } from "../../types/index.js";

function mapper(pet: any): PetLocation {
  return {
    id: pet.id,
    name: pet.name,
    image: pet.image,
    summary: pet.summary,
  };
}

export class MockPetRepository implements PetRepository {
  private readonly pets: Pet[];
  private readonly catLocationMap: Map<string, PetLocation[]>;
  private readonly dogLocationMap: Map<string, PetLocation[]>;

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
      id: 22324883,
      name: "Buddy",
      species: "Dog",
      summary: "I am at Oakland Animal Services in kennel E:1",
      otherNames: "green"
    } as any);

    this.pets = [marley, anotherCat, dog];

    this.catLocationMap = new Map([["holding 4:19", [anotherCat]]]);
    this.catLocationMap = new Map([["holding 4:0", [marley,anotherCat]]]);

    this.dogLocationMap = new Map([["e:1", [dog]]]);
  }

  async getById(id: number): Promise<Pet | undefined> {
    return this.pets.find((pet) => pet.id === id);
  }

  async searchByLocation(
    petType: "dog" | "cat",
    location: string,
  ): Promise<PetLocation[] | undefined> {
    const lower = location.toLowerCase().replaceAll("-", " ");
    if (petType === "dog") {
      return this.dogLocationMap.get(lower)?.map(mapper);
    }
    return this.catLocationMap.get(lower)?.map(mapper);
  }
}
