import config from "../config/index.js";
import { PetSchema, type Pet } from "../models/Pet.schema.js";
import { PetRepository } from "../types/index.js";
import axios from "axios";

const RESCUE_GROUPS_ENDPOINT = config.rescueGroups.endpoint;
const RESCUE_GROUPS_BEARER = config.rescueGroups.bearer;

const rescueGroupsClient = axios.create({
  baseURL: RESCUE_GROUPS_ENDPOINT,
  headers: {
    Authorization: `Bearer ${RESCUE_GROUPS_BEARER}`,
  },
});

const FIELDS = [
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

export class RescueGroupPetRepository implements PetRepository {
  async getById(id: number): Promise<Pet | undefined> {
    const payload = {
      objectType: "animals",
      objectAction: "publicView",
      values: [{ animalID: String(id) }],
      fields: FIELDS,
    };

    try {
      const response = await rescueGroupsClient.post("", payload);
      const record = response.data?.animals?.[0] || response.data?.data?.[0];
      if (!record) {
        return undefined;
      }

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

        pictures: extractPictures(record),
        image:
          record.animalThumbnailUrl ||
          record.urlSecureThumbnail ||
          record.image ||
          undefined,
        age: computeAge(record),
      } as any;

      try {
        return PetSchema.parse(pet);
      } catch (parseErr) {
        console.error(
          "RG repo getById - schema validation failed",
          parseErr,
          "raw pet:",
          pet,
        );
        return undefined;
      }
    } catch (err) {
      console.error("RG repo getById failed", err);
      return undefined;
    }
  }
}
