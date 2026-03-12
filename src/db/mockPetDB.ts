import { PetSchema, type Pet } from "../models/Pet.schema.js";
import { PetRepository } from "../types/index.js";

export class MockPetRepository implements PetRepository {
  private readonly pet: Pet;

  constructor() {
    this.pet = PetSchema.parse({
      id: 182,
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
  }

  async getById(id: number): Promise<Pet | undefined> {
    return id === this.pet.id ? this.pet : undefined;
  }
}
