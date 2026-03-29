import config from "../../config/index.js";
import { PetLocation, PetSchema, type Pet } from "../../models/Pet.schema.js";
import { PetRepository } from "../../types/index.js";
import axios from "axios";

const RESCUE_GROUPS_ENDPOINT = config.rescueGroups.endpoint;
const RESCUE_GROUPS_BEARER = config.rescueGroups.bearer;

const rescueGroupsClient = axios.create({
  baseURL: RESCUE_GROUPS_ENDPOINT,
  headers: {
    Authorization: `Bearer ${RESCUE_GROUPS_BEARER}`,
  },
});

const GET_FIELDS = [
  "animalID",
  "animalName",
  "animalSpecies",
  "animalSex",
  "animalStatus",
  "animalPrimaryBreed",
  "animalBreed",
  "animalSummary",
  "animalDescription",
  "animalBirthdate",
  "animalGeneralAge",
  "animalGeneralSizePotential",
  "animalColorDetails",
  "animalAvailableDate",
  "animalOthernames",
  "animalDistinguishingMarks",
  "animalPictures",
  "animalThumbnailUrl",
  "animalRescueID",
  "animalSpecialneedsDescription",
  "animalUpdatedDate",
];

const LOCATION_FIELDS = [
  "animalName",
  "animalSummary",
  "animalThumbnailUrl",
  "animalID",
  "animalPictures",
];

function extractPictures(record: any): string[] | undefined {
  const raw = record.animalPictures || record.pictures;
  if (!Array.isArray(raw)) return undefined;
  return raw
    .map((p: any) => {
      if (typeof p === "string") return p;
      return (
        p.url ||
        p.urlSecureFullsize ||
        p.urlSecureThumbnail ||
        p.urlInsecureFullsize ||
        p.urlInsecureThumbnail
      );
    })
    .filter((u) => typeof u === "string");
}

function computeAge(record: any): number {
  const byBirthdate = record.animalBirthdate
    ? new Date(record.animalBirthdate)
    : null;
  if (byBirthdate && !isNaN(byBirthdate.getTime())) {
    const years = Math.floor(
      (Date.now() - byBirthdate.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    );
    if (years > 0) return years;
  }
  const parsed = Number(record.animalGeneralAge);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  return 0;
}

function parseLocationFromSummary(summary?: string | null): string | null {
  if (!summary) return null;

  const trimmed = summary.trim();

  const lower = trimmed.toLowerCase();
  if (lower.includes("foster")) {
    return "In Foster";
  }

  let loc = trimmed.replace("I am at Oakland Animal Services in kennel ", "");

  loc = loc.trim();
  return loc;
}

function parsePetLocation(record: any): PetLocation | undefined {
  if (!record) return undefined;

  const pictures = extractPictures(record);
  const petLocation: PetLocation = {
    id: parseInt(record.animalID, 10),
    name: record.animalName,
    summary: record.animalSummary || "",
    image: record.animalThumbnailUrl || pictures?.[0] || undefined,
  };
  return petLocation;
}

function parsePet(record: any): Pet | undefined {
  if (!record) return undefined;

  const pictures = extractPictures(record);
  const pet: Pet = {
    id: parseInt(record.animalID, 10),
    name: record.animalName,
    species: record.animalSpecies,
    sex: record.animalSex,
    description: record.animalDescription || undefined,
    summary: record.animalSummary || record.animalDescription || "",
    breed: record.animalPrimaryBreed || record.animalBreed || undefined,
    status: record.animalStatus,
    rescueId: record.animalRescueID,
    availableDate: record.animalAvailableDate,
    otherNames: record.animalOthernames,
    distinguishingMarks: record.animalDistinguishingMarks,
    generalAge: record.animalGeneralAge,
    generalSize: record.animalGeneralSizePotential,
    colorDetails: record.animalColorDetails,
    specialNeeds: record.animalSpecialneedsDescription,
    birthdate: record.animalBirthdate,

    image: record.animalThumbnailUrl || pictures?.[0] || undefined,
    age: computeAge(record),
  } as any;

  try {
    return PetSchema.parse(pet);
  } catch (parseErr) {
    console.error(
      "RG repo parsePet - schema validation failed",
      parseErr,
      "raw pet:",
      pet,
    );
    return undefined;
  }
}

export class RescueGroupPetRepository implements PetRepository {
  async getById(id: number): Promise<Pet | undefined> {
    const payload = {
      objectType: "animals",
      objectAction: "view",
      values: [{ animalID: String(id) }],
      fields: GET_FIELDS,
    };

    try {
      const response = await rescueGroupsClient.post("", payload);
      const record = response.data?.animals?.[0] || response.data?.data?.[0];
      return parsePet(record);
    } catch (err) {
      console.error("RG repo getById failed", err);
      return undefined;
    }
  }

  private async searchByLocationInternal(
    species: string,
    location: string,
  ): Promise<PetLocation[] | undefined> {
    location = location.toLowerCase().replace(/-/g, " ");
    const payload = {
      objectType: "animals",
      objectAction: "search",
      search: {
        resultStart: 0,
        resultLimit: 10,
        resultSort: "animalUpdatedDate",
        resultOrder: "desc",
        filters: [
          {
            fieldName: "animalSpecies",
            operation: "equals",
            criteria: species,
          },
          {
            fieldName: "animalSummary",
            operation: "contains",
            criteria: location,
          },
        ],
        fields: LOCATION_FIELDS,
      },
    };

    try {
      const response = await rescueGroupsClient.post("", payload);
      const pets: Record<string, any> = response?.data?.data || {};

      const parsedPets: PetLocation[] = [];
      for (const key in pets) {
        const pet = pets[key];
        const summary: string = pet.animalSummary;
        let locationInSummary =
          parseLocationFromSummary(summary)?.toLowerCase() || "";
        locationInSummary = locationInSummary.replace(
          `${species.toLowerCase()} `,
          "",
        );
        // console.log(
        //   `Checking pet ${pet.animalID} with location "${locationInSummary}" against search location "${location}"`,
        // );
        if (locationInSummary === location) {
          const parsed = parsePetLocation(pet);
          if (parsed) {
            parsedPets.push(parsed);
          }
        }
      }

      return parsedPets.length > 0 ? parsedPets : undefined;
    } catch (err) {
      console.error(
        `RG repo searchByLocation failed (${species} @ ${location})`,
        err,
      );
      return undefined;
    }
  }

  async searchByLocation(
    petType: string,
    location: string,
  ): Promise<PetLocation[] | undefined> {
    return this.searchByLocationInternal(petType, location);
  }
}
