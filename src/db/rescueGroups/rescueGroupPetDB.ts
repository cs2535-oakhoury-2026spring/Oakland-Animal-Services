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
  "animalAltered",
  "animalOKWithCats",
  "animalOKWithDogs",
  "animalOKWithKids",
  "animalSizeCurrent",
  "animalEnergyLevel",
  "animalNotes",
  "animalBirthdateExact",
  "animalCreatedDate",
  "animalReceivedDate",
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
  "animalStatus",
  "animalSpecies",
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

function getFirstRecord(data: any): any {
  if (!data) return undefined;
  if (Array.isArray(data)) return data[0];
  const keys = Object.keys(data);
  return keys.length ? data[keys[0]] : undefined;
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
    status: record.animalStatus || undefined,
    species: record.animalSpecies || undefined,
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
  const normalizedName =
    typeof record.animalName === "string" && record.animalName.trim().length > 0
      ? record.animalName.trim()
      : `Animal #${record.animalID ?? "Unknown"}`;
  const normalizedSpecies =
    typeof record.animalSpecies === "string" &&
    record.animalSpecies.trim().length > 0
      ? record.animalSpecies.trim()
      : "Unknown";
  const normalizedSex =
    typeof record.animalSex === "string" && record.animalSex.trim().length > 0
      ? record.animalSex.trim()
      : "Unknown";
  const normalizedSummary =
    (typeof record.animalSummary === "string" && record.animalSummary.trim()) ||
    (typeof record.animalDescription === "string" &&
      record.animalDescription.trim()) ||
    `I am at Oakland Animal Services`;

  const pet: Pet = {
    id: parseInt(record.animalID, 10),
    name: normalizedName,
    species: normalizedSpecies,
    sex: normalizedSex,
    description: record.animalDescription || undefined,
    summary: normalizedSummary,
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
    altered: record.animalAltered || undefined,
    okWithCats: record.animalOKWithCats || undefined,
    okWithDogs: record.animalOKWithDogs || undefined,
    okWithKids: record.animalOKWithKids || undefined,
    weightPounds: record.animalSizeCurrent
      ? `${record.animalSizeCurrent} lbs`
      : undefined,
    energyLevel: record.animalEnergyLevel || undefined,
    notes: record.animalNotes || undefined,
    createdDate: record.animalCreatedDate || undefined,
    receivedDate: record.animalReceivedDate || undefined,

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
  private allAnimalsCache: {
    expiresAt: number;
    animals: AllAnimalEntry[];
    index: Map<string, PetLocation[]>;
  } | null = null;
  private static readonly ALL_ANIMALS_CACHE_TTL_MS = 60_000;

  private normalizeLocationKey(species: string, location: string): string {
    const normalizedSpecies = (species || "").toLowerCase().trim();
    let normalizedLocation = (location || "")
      .toLowerCase()
      .replace(/-/g, " ")
      .trim();

    const prefix = `${normalizedSpecies} `;
    if (normalizedSpecies && normalizedLocation.startsWith(prefix)) {
      normalizedLocation = normalizedLocation.slice(prefix.length).trim();
    }

    return `${normalizedSpecies}|${normalizedLocation}`;
  }

  /**
   * Retrieves a specific pet by its unique identifier from the Rescue Groups API.
   *
   * @param {number} id - The unique identifier of the pet to retrieve.
   * @returns {Promise<Pet | undefined>} The pet data or undefined if not found/error.
   */
  async getById(id: number | string): Promise<Pet | undefined> {
    const rawId = String(id || "").trim();
    if (!rawId) return undefined;

    const numericId = Number(rawId);
    if (rawId && Number.isFinite(numericId)) {
      const pet = await this.getByAnimalId(Math.floor(numericId));
      if (pet) return pet;
    }

    return this.getByRescueId(rawId);
  }

  private async getByAnimalId(id: number): Promise<Pet | undefined> {
    const payload = {
      objectType: "animals",
      objectAction: "view",
      values: [{ animalID: String(id) }],
      fields: GET_FIELDS,
    };

    try {
      const response = await rescueGroupsClient.post("", payload);
      const record =
        response.data?.animals?.[0] || getFirstRecord(response.data?.data);
      return parsePet(record);
    } catch (err) {
      console.error("RG repo getByAnimalId failed", err);
      return undefined;
    }
  }

  private async getByRescueId(rescueId: string): Promise<Pet | undefined> {
    const payload = {
      objectType: "animals",
      objectAction: "search",
      search: {
        resultStart: 0,
        resultLimit: 1,
        resultSort: "animalUpdatedDate",
        resultOrder: "desc",
        filters: [
          {
            fieldName: "animalRescueID",
            operation: "equals",
            criteria: rescueId,
          },
        ],
        fields: GET_FIELDS,
      },
    };

    try {
      const response = await rescueGroupsClient.post("", payload);
      const record = getFirstRecord(response.data?.data);
      return parsePet(record);
    } catch (err) {
      console.error("RG repo getByRescueId failed", err);
      return undefined;
    }
  }

  private isAllAnimalsCacheValid(): boolean {
    return (
      !!this.allAnimalsCache && Date.now() < this.allAnimalsCache.expiresAt
    );
  }

  private async getAllAvailableAnimalsCached(): Promise<AllAnimalEntry[]> {
    if (this.isAllAnimalsCacheValid()) {
      return this.allAnimalsCache!.animals;
    }

    const animals = await this.fetchAllAnimals();
    const index = new Map<string, PetLocation[]>();

    for (const animal of animals) {
      if (!animal.species || !animal.location) continue;
      const key = this.normalizeLocationKey(animal.species, animal.location);
      if (!key) continue;

      const entry: PetLocation = {
        id: animal.id,
        name: animal.name,
        image: animal.image,
        status: animal.status,
        species: animal.species,
        summary: animal.summary || animal.location || animal.name,
      };

      const existing = index.get(key);
      if (existing) {
        existing.push(entry);
      } else {
        index.set(key, [entry]);
      }
    }

    this.allAnimalsCache = {
      expiresAt: Date.now() + RescueGroupPetRepository.ALL_ANIMALS_CACHE_TTL_MS,
      animals,
      index,
    };
    return animals;
  }

  private async searchByLocationCached(
    species: string,
    location: string,
  ): Promise<PetLocation[] | undefined> {
    const key = this.normalizeLocationKey(species, location);
    await this.getAllAvailableAnimalsCached();
    return this.allAnimalsCache?.index.get(key);
  }

  private async searchByLocationInternal(
    species: string,
    location: string,
    status?: string,
  ): Promise<PetLocation[] | undefined> {
    const normalizedLocation = location.toLowerCase().replace(/-/g, " ");

    const filters: any[] = [
      { fieldName: "animalSpecies", operation: "equals", criteria: species },
      {
        fieldName: "animalSummary",
        operation: "contains",
        criteria: normalizedLocation,
      },
      {
        fieldName: "animalStatusID",
        operation: "equals",
        criteria: ["1", "2", "16"],
      },
    ];
    if (status) {
      filters.push({
        fieldName: "animalStatus",
        operation: "equals",
        criteria: status,
      });
    }

    const payload = {
      objectType: "animals",
      objectAction: "search",
      search: {
        resultStart: 0,
        resultLimit: 20,
        resultSort: "animalUpdatedDate",
        resultOrder: "desc",
        filters,
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
        if (locationInSummary === normalizedLocation) {
          const parsed = parsePetLocation(pet);
          if (parsed) {
            if (status && !parsed.status) parsed.status = status;
            parsedPets.push(parsed);
          }
        }
      }

      return parsedPets.length > 0 ? parsedPets : undefined;
    } catch (err) {
      console.error(
        `RG repo searchByLocation failed (${species} @ ${normalizedLocation} status=${status ?? "any"})`,
        err,
      );
      return undefined;
    }
  }

  // Run one search per status so each animal is definitively tagged current or past.
  // RescueGroups does not reliably return animalStatus in generic search responses.
  async searchByLocation(
    petType: string,
    location: string,
    refresh: boolean = false,
  ): Promise<PetLocation[] | undefined> {
    if (refresh) {
      this.allAnimalsCache = null;
    }

    if (!refresh) {
      const cachedResults = await this.searchByLocationCached(
        petType,
        location,
      );
      if (cachedResults && cachedResults.length > 0) {
        return cachedResults;
      }
    }

    const directResults = await this.searchByLocationInternal(
      petType,
      location,
    );
    if (directResults && directResults.length > 0) {
      return directResults;
    }

    return undefined;
  }

  private getResultTotal(response: any): number | undefined {
    const maybeValue =
      response?.data?.resultTotal ??
      response?.data?.pagination?.resultTotal ??
      response?.data?.pagination?.total ??
      response?.data?.total ??
      response?.resultTotal;

    if (typeof maybeValue === "number") return maybeValue;
    if (typeof maybeValue === "string") {
      const parsed = Number(maybeValue);
      if (Number.isFinite(parsed)) return parsed;
    }

    return undefined;
  }

  private async fetchAnimalsPage(
    page: number,
    limit: number,
  ): Promise<{ animals: AllAnimalEntry[]; total?: number }> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), 200)
        : 50;
    const resultStart = (safePage - 1) * safeLimit;
    const allFields = [
      "animalID",
      "animalName",
      "animalSpecies",
      "animalStatus",
      "animalSummary",
      "animalThumbnailUrl",
      "animalPictures",
      "animalOthernames",
      "animalGeneralAge",
      "animalPrimaryBreed",
      "animalRescueID",
    ];

    const payload = {
      objectType: "animals",
      objectAction: "search",
      search: {
        resultStart,
        resultLimit: safeLimit,
        resultSort: "animalName",
        resultOrder: "asc",
        filters: [
          {
            fieldName: "animalStatusID",
            operation: "equals",
            criteria: ["1", "2", "16"],
          },
          {
            fieldName: "animalSummary",
            operation: "contains",
            criteria: "Oakland Animal Services",
          },
          {
            fieldName: "animalUpdatedDate",
            operation: "greaterthanorequal",
            criteria: "1/1/2026 1:00 AM",
          },
          {
            fieldName: "animalUpdatedBy",
            operation: "notequal",
            criteria: ["PetPoint, OAS"],
          },
        ],
        fields: allFields,
      },
    };

    try {
      const response = await rescueGroupsClient.post("", payload);
      const pets: Record<string, any> = response?.data?.data || {};
      const animals: AllAnimalEntry[] = [];

      for (const key in pets) {
        const record = pets[key];
        const pictures = extractPictures(record);
        animals.push({
          id: parseInt(record.animalID, 10),
          name: record.animalName || `Animal #${record.animalID}`,
          species: record.animalSpecies || "Unknown",
          status: record.animalStatus || "Unknown",
          location: parseLocationFromSummary(record.animalSummary) || "Unknown",
          image: record.animalThumbnailUrl || pictures?.[0] || undefined,
          handlerLevel: (record.animalOthernames || "green").toLowerCase(),
          breed: record.animalPrimaryBreed || undefined,
          generalAge: record.animalGeneralAge || undefined,
          rescueId: record.animalRescueID || undefined,
        });
      }

      return {
        animals,
        total: this.getResultTotal(response),
      };
    } catch (err) {
      console.error("RG repo fetchAnimalsPage failed", err);
      return { animals: [] };
    }
  }

  private async fetchAllAnimals(): Promise<AllAnimalEntry[]> {
    const allFields = [
      "animalID",
      "animalName",
      "animalSpecies",
      "animalStatus",
      "animalSummary",
      "animalThumbnailUrl",
      "animalPictures",
      "animalOthernames",
      "animalGeneralAge",
      "animalPrimaryBreed",
      "animalRescueID",
    ];

    const results: AllAnimalEntry[] = [];

    try {
      const payload = {
        objectType: "animals",
        objectAction: "search",
        search: {
          resultStart: 0,
          resultLimit: 1000,
          resultSort: "animalName",
          resultOrder: "asc",
          filters: [
            {
              fieldName: "animalStatusID",
              operation: "equals",
              criteria: ["1", "2", "16"],
            },
            {
              fieldName: "animalSummary",
              operation: "contains",
              criteria: "Oakland Animal Services",
            },
            {
              fieldName: "animalUpdatedDate",
              operation: "greaterthanorequal",
              criteria: "1/1/2026 1:00 AM",
            },
            {
              fieldName: "animalUpdatedBy",
              operation: "notequal",
              criteria: ["PetPoint, OAS"],
            },
          ],
          fields: allFields,
        },
      };

      const response = await rescueGroupsClient.post("", payload);
      const pets: Record<string, any> = response?.data?.data || {};

      for (const key in pets) {
        const record = pets[key];
        const pictures = extractPictures(record);
        results.push({
          id: parseInt(record.animalID, 10),
          name: record.animalName || `Animal #${record.animalID}`,
          species: record.animalSpecies || "Unknown",
          status: record.animalStatus || "Unknown",
          location:
            parseLocationFromSummary(record.animalSummary) || "Unknown",
          image: record.animalThumbnailUrl || pictures?.[0] || undefined,
          handlerLevel: (record.animalOthernames || "green").toLowerCase(),
          breed: record.animalPrimaryBreed || undefined,
          generalAge: record.animalGeneralAge || undefined,
          rescueId: record.animalRescueID || undefined,
          summary: record.animalSummary || record.animalDescription || "",
        });
      }
    } catch (err) {
      console.error("getAllAnimals failed", err);
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAllAnimals(
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedAnimalsResult> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), 200)
        : 50;

    const pageResult = await this.fetchAnimalsPage(safePage, safeLimit);

    if (typeof pageResult.total === "number") {
      const total = pageResult.total;
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));
      const clampedPage = Math.min(safePage, totalPages);
      return {
        animals: pageResult.animals,
        page: clampedPage,
        limit: safeLimit,
        total,
        totalPages,
      };
    }

    const allAnimals = await this.fetchAllAnimals();
    const total = allAnimals.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const clampedPage = Math.min(safePage, totalPages);
    const start = (clampedPage - 1) * safeLimit;
    const animals = allAnimals.slice(start, start + safeLimit);

    return {
      animals,
      page: clampedPage,
      limit: safeLimit,
      total,
      totalPages,
    };
  }
}

export interface AllAnimalEntry {
  id: number;
  name: string;
  species: string;
  status: string;
  location: string;
  image?: string;
  handlerLevel: string;
  breed?: string;
  generalAge?: string;
  rescueId?: string;
  summary?: string;
}

export interface PaginatedAnimalsResult {
  animals: AllAnimalEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
