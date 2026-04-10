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

      age: 2,

      birthdate: "7/6/2022",

      sex: "Male",

      species: "Cat",

      image:

        "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",

      description: `<div class="rgDescription">Marley is a young white male, about 2 years old. Found wandering the streets near the Inner Harbor. EXTREMELY friendly.  FELV/FIV negative, shots, neutered.  Marley is currently in the adoption cage at Bethany Centennial Animal Hospital.  Call for hours and directions (and to make sure he's still there before you visit).  410-750-2322.</div>`,

      summary: `I am at Oakland Animal Services in kennel Cat W:5`,

      breed: "Domestic Short Hair",

      status: "Adopted",

      rescueId: "736727",

      availableDate: "",

      otherNames: undefined,

      distinguishingMarks: "White fur, green eyes",

      microchip: "123456789101213",

      handlerLevel: "green",

      generalAge: "Adult",

      generalSize: "Medium",

      colorDetails: "White",

      specialNeeds: "",

    } as any);



    const anotherCat = PetSchema.parse({

      id: 22254131,

      name: "Nala",

      age: 3,

      birthdate: "5/15/2021",

      sex: "Female",

      species: "Cat",

      image:

        "https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_640.jpg",

      description: `<div class="rgDescription">Nala is a beautiful tabby cat looking for a loving home. She's independent but enjoys attention on her own terms.</div>`,

      summary: "I am at Oakland Animal Services in kennel Cat W:5",

      breed: "Domestic Short Hair",

      status: "Available",

      rescueId: "736729",

      availableDate: "2024-05-20",

      otherNames: undefined,

      distinguishingMarks: "Tabby stripes, white paws",

      microchip: "111222333444555",

      handlerLevel: "pink",

      generalAge: "Adult",

      generalSize: "Small",

      colorDetails: "Brown Tabby",

      specialNeeds: "",

    } as any);



    const dog = PetSchema.parse({

      id: 22324883,

      name: "Buddy",

      age: 4,

      birthdate: "3/10/2020",

      sex: "Male",

      species: "Dog",

      image:

        "https://cdn.pixabay.com/photo/2023/08/18/15/02/dog-8198719_640.jpg",

      description: `<div class="rgDescription">Buddy is a friendly Labrador mix who loves to play fetch. Great with kids and other dogs.</div>`,

      summary: "I am at Oakland Animal Services in kennel E:1",

      breed: "Labrador Mix",

      status: "Available",

      rescueId: "736730",

      availableDate: "2024-06-01",

      otherNames: undefined,

      distinguishingMarks: "Black spot on left ear",

      microchip: "222333444555666",

      handlerLevel: "green",

      generalAge: "Adult",

      generalSize: "Large",

      colorDetails: "Golden",

      specialNeeds: "",

    } as any);



    this.pets = [marley, anotherCat, dog];



    this.catLocationMap = new Map([
      ["cat w:5", [marley, anotherCat]],
      ["cat w:6", [anotherCat]],
    ]);



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

