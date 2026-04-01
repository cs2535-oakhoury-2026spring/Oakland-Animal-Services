import config from "../../config/index.js";
import { PetLocation, PetSchema, type Pet } from "../../models/Pet.schema.js";
import { PetRepository } from "../../types/index.js";
import axios from "axios";

/**
 * Rescue Groups API endpoint URL.
 */
const RESCUE_GROUPS_ENDPOINT = config.rescueGroups.endpoint;

/**
 * Authorization bearer token for Rescue Groups API.
 */
const RESCUE_GROUPS_BEARER = config.rescueGroups.bearer;

/**
 * Axios client configured for Rescue Groups API requests.
 * Automatically includes authorization headers.
 */
const rescueGroupsClient = axios.create({
  baseURL: RESCUE_GROUPS_ENDPOINT,
  headers: {
    Authorization: `Bearer ${RESCUE_GROUPS_BEARER}`,
  },
});

/**
 * Array of field names to retrieve from Rescue Groups API for detailed pet information.
 * These fields include comprehensive pet data for display and search purposes.
 */
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

/**
 * Array of field names to retrieve from Rescue Groups API for location-based searches.
 * These fields include minimal pet data needed for location search results.
 */
const LOCATION_FIELDS = [
  "animalName",
  "animalSummary",
  "animalThumbnailUrl",
  "animalID",
  "animalPictures",
];

/**
 * Extracts picture URLs from a Rescue Groups API response record.
 * 
 * Handles multiple possible picture URL formats and returns an array of valid URLs.
 * 
 * @param {any} record - The API response record containing picture data.
 * @returns {string[] | undefined} Array of picture URLs or undefined if no pictures found.
 */
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

/**
 * Computes the age of a pet in years based on birthdate or general age field.
 * 
 * First attempts to calculate age from birthdate, falling back to the general age field.
 * Returns 0 if no valid age information is found.
 * 
 * @param {any} record - The API response record containing age information.
 * @returns {number} The pet's age in years.
 */
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

/**
 * Parses location information from a pet's summary text.
 * 
 * Extracts kennel location information from the summary string.
 * Handles foster status and kennel number extraction.
 * 
 * @param {string | null} summary - The pet's summary text.
 * @returns {string | null} The parsed location or null if not found.
 */
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

/**
 * Parses pet location data from a Rescue Groups API response record.
 * 
 * Extracts minimal pet information needed for location-based search results.
 * 
 * @param {any} record - The API response record containing pet data.
 * @returns {PetLocation | undefined} Parsed pet location data or undefined if invalid.
 */
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

/**
 * Parses comprehensive pet data from a Rescue Groups API response record.
 * 
 * Extracts all available pet information and validates against the PetSchema.
 * Returns undefined if the record is invalid or fails schema validation.
 * 
 * @param {any} record - The API response record containing pet data.
 * @returns {Pet | undefined} Parsed pet data or undefined if invalid.
 */
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

/**
 * Repository implementation for interacting with the Rescue Groups API.
 * 
 * This class provides methods to retrieve pet information from the Rescue Groups
 * external API, including individual pet lookup and location-based searches.
 * Implements the PetRepository interface for integration with the application.
 * 
 * @class RescueGroupPetRepository
 * @implements {PetRepository}
 */
export class RescueGroupPetRepository implements PetRepository {
  /**
   * Retrieves a specific pet by its unique identifier from the Rescue Groups API.
   * 
   * @param {number} id - The unique identifier of the pet to retrieve.
   * @returns {Promise<Pet | undefined>} The pet data or undefined if not found/error.
   */
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

  /**
   * Internal method for searching pets by species and location.
   * 
   * Performs a location-based search against the Rescue Groups API,
   * filtering results to match the exact location string in pet summaries.
   * 
   * @private
   * @param {string} species - The pet species to search for.
   * @param {string} location - The location string to match in pet summaries.
   * @returns {Promise<PetLocation[] | undefined>} Array of matching pet locations or undefined if none found.
   */
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

  /**
   * Searches for pets by species and location.
   * 
   * Public method that delegates to the internal search implementation.
   * Returns pets matching the specified species and location criteria.
   * 
   * @param {string} petType - The pet species to search for.
   * @param {string} location - The location string to match.
   * @returns {Promise<PetLocation[] | undefined>} Array of matching pet locations or undefined if none found.
   */
  async searchByLocation(
    petType: string,
    location: string,
  ): Promise<PetLocation[] | undefined> {
    return this.searchByLocationInternal(petType, location);
  }
}
