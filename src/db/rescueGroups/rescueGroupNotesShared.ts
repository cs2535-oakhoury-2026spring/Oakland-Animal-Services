import axios from "axios";
import config from "../../config/index.js";

const rescueGroupsClient = axios.create({
  baseURL: config.rescueGroups.endpoint,
  headers: {
    Authorization: `Bearer ${config.rescueGroups.bearer}`,
    "Content-Type": "application/json",
  },
});

const JOURNAL_FIELDS = [
  "journalEntryID",
  "journalEntryAnimalID",
  "journalEntryDate",
  "journalEntryEntrytypeID",
  "journalEntryComment",
];

export interface RescueGroupsJournalEntry {
  journalEntryID: string;
  journalEntryAnimalID: string;
  journalEntryDate: string;
  journalEntryEntrytypeID: string;
  journalEntryComment?: string;
}

type RescueGroupsFilter = {
  fieldName: string;
  operation: "equals";
  criteria: string;
};

type StoredNotePayload = {
  source: "oas-notes";
  schemaVersion: 1;
  createdAt: string;
  title?: string;
  content: string;
  author: string;
  status?: string;
  staffComment?: {
    text: string;
    from: string;
    at: string;
    editedBy?: string;
    editedAt?: string;
  };
};

export type ParsedComment = {
  createdAt?: string;
  title?: string;
  content: string;
  author: string;
  status?: string;
  staffComment?: {
    text: string;
    from: string;
    at: string;
    editedBy?: string;
    editedAt?: string;
  };
};

function parseStaffComment(
  raw: any,
): ParsedComment["staffComment"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  if (
    typeof raw.text !== "string" ||
    typeof raw.from !== "string" ||
    typeof raw.at !== "string"
  ) {
    return undefined;
  }

  return {
    text: raw.text,
    from: raw.from,
    at: raw.at,
    editedBy: typeof raw.editedBy === "string" ? raw.editedBy : undefined,
    editedAt: typeof raw.editedAt === "string" ? raw.editedAt : undefined,
  };
}

function formatDateForRG(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function parseRGDate(rawDate?: string): Date {
  if (!rawDate) return new Date();
  const parsed = new Date(rawDate);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = rawDate.split("/").map((v) => Number(v));
  if (parts.length === 3 && parts.every((p) => Number.isFinite(p))) {
    const [month, day, year] = parts;
    const fallback = new Date(year, month - 1, day);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return new Date();
}

function asRecords(responseBody: any): RescueGroupsJournalEntry[] {
  const data = responseBody?.data;
  if (!data) return [];

  if (Array.isArray(data)) {
    return data as RescueGroupsJournalEntry[];
  }

  if (typeof data === "object") {
    return Object.values(data) as RescueGroupsJournalEntry[];
  }

  return [];
}

export abstract class RescueGroupNotesBaseRepository<
  T extends { id: number; timestamp: Date; petId: number },
> {
  constructor(private readonly entryTypeId: string) {}

  protected abstract toModel(entry: RescueGroupsJournalEntry): T;

  protected abstract toPayload(note: T): StoredNotePayload;

  protected parseComment(rawComment?: string): ParsedComment {
    const raw = (rawComment ?? "").trim();
    if (!raw) {
      return { content: "", author: "Unknown" };
    }

    try {
      const parsed = JSON.parse(raw) as any;
      if (parsed && typeof parsed === "object") {
        if (
          parsed.source === "oas-notes" &&
          parsed.schemaVersion === 1 &&
          typeof parsed.content === "string"
        ) {
          return {
            createdAt:
              typeof parsed.createdAt === "string"
                ? parsed.createdAt
                : undefined,
            title: typeof parsed.title === "string" ? parsed.title : undefined,
            content: parsed.content,
            author:
              typeof parsed.author === "string" &&
              parsed.author.trim().length > 0
                ? parsed.author
                : "Unknown",
            status:
              typeof parsed.status === "string" ? parsed.status : undefined,
            staffComment: parseStaffComment(parsed.staffComment),
          };
        }

        if (typeof parsed.content === "string") {
          return {
            createdAt:
              typeof parsed.createdAt === "string"
                ? parsed.createdAt
                : undefined,
            title: typeof parsed.title === "string" ? parsed.title : undefined,
            content: parsed.content,
            author:
              typeof parsed.author === "string" &&
              parsed.author.trim().length > 0
                ? parsed.author
                : "Unknown",
            status:
              typeof parsed.status === "string" ? parsed.status : undefined,
            staffComment: parseStaffComment(parsed.staffComment),
          };
        }
      }
    } catch {
      // Fallback to plain text comments.
    }

    return {
      content: raw,
      author: "Unknown",
    };
  }

  protected toCommon(entry: RescueGroupsJournalEntry): {
    id: number;
    petId: number;
    timestamp: Date;
    title?: string;
    content: string;
    author: string;
    status?: string;
    staffComment?: {
      text: string;
      from: string;
      at: string;
      editedBy?: string;
      editedAt?: string;
    };
  } {
    const parsedComment = this.parseComment(entry.journalEntryComment);

    const exactTimestamp =
      parsedComment.createdAt != null
        ? new Date(parsedComment.createdAt)
        : undefined;
    const timestamp =
      exactTimestamp && !Number.isNaN(exactTimestamp.getTime())
        ? exactTimestamp
        : parseRGDate(entry.journalEntryDate);

    return {
      id: Number(entry.journalEntryID),
      petId: Number(entry.journalEntryAnimalID),
      timestamp,
      title: parsedComment.title,
      content: parsedComment.content,
      author: parsedComment.author,
      status: parsedComment.status,
      staffComment: parsedComment.staffComment,
    };
  }

  protected serializeComment(note: T): string {
    return JSON.stringify(this.toPayload(note));
  }

  protected async editJournalComment(
    journalEntryId: number,
    comment: string,
  ): Promise<boolean> {
    try {
      await rescueGroupsClient.post("", {
        objectType: "animalsJournalEntries",
        objectAction: "edit",
        values: [
          {
            journalEntryID: String(journalEntryId),
            journalEntryComment: comment,
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("RG notes edit failed", error);
      return false;
    }
  }

  private async searchEntries(
    filters: RescueGroupsFilter[],
    options?: {
      resultStart?: number;
      resultLimit?: number;
      fetchAll?: boolean;
    },
  ): Promise<RescueGroupsJournalEntry[]> {
    const fetchAll = options?.fetchAll ?? false;

    if (!fetchAll) {
      try {
        const response = await rescueGroupsClient.post("", {
          objectType: "animalsJournalEntries",
          objectAction: "search",
          search: {
            fields: JOURNAL_FIELDS,
            filters,
            ...(options?.resultStart != null
              ? { resultStart: options.resultStart }
              : {}),
            ...(options?.resultLimit != null
              ? { resultLimit: options.resultLimit }
              : {}),
          },
        });
        return asRecords(response.data);
      } catch (error) {
        console.error("RG notes search failed", error);
        return [];
      }
    }

    const pageSize = options?.resultLimit ?? 200;
    let start = options?.resultStart ?? 0;
    const all: RescueGroupsJournalEntry[] = [];

    while (true) {
      const batch = await this.searchEntries(filters, {
        resultStart: start,
        resultLimit: pageSize,
      });
      all.push(...batch);
      if (batch.length < pageSize) {
        break;
      }
      start += pageSize;
    }

    return all;
  }

  async getNotes(limit?: number, page?: number): Promise<T[]> {
    const resolvedLimit = limit ?? 10;
    const resolvedPage = page ?? 1;

    const records = await this.searchEntries(
      [
        {
          fieldName: "journalEntryEntrytypeID",
          operation: "equals",
          criteria: this.entryTypeId,
        },
      ],
      {
        resultStart: (resolvedPage - 1) * resolvedLimit,
        resultLimit: resolvedLimit,
      },
    );

    return records
      .map((entry) => this.toModel(entry))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getNoteByPetId(petId: number): Promise<T[]> {
    const records = await this.searchEntries(
      [
        {
          fieldName: "journalEntryAnimalID",
          operation: "equals",
          criteria: String(petId),
        },
        {
          fieldName: "journalEntryEntrytypeID",
          operation: "equals",
          criteria: this.entryTypeId,
        },
      ],
      { fetchAll: true, resultLimit: 200 },
    );

    return records
      .map((entry) => this.toModel(entry))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getNoteById(id: number): Promise<T | null> {
    const records = await this.searchEntries([
      {
        fieldName: "journalEntryID",
        operation: "equals",
        criteria: String(id),
      },
      {
        fieldName: "journalEntryEntrytypeID",
        operation: "equals",
        criteria: this.entryTypeId,
      },
    ]);

    const first = records[0];
    return first ? this.toModel(first) : null;
  }

  async addNote(note: T): Promise<number> {
    const comment = this.serializeComment(note);

    try {
      const response = await rescueGroupsClient.post("", {
        objectType: "animalsJournalEntries",
        objectAction: "add",
        values: [
          {
            journalEntryEntrytypeID: this.entryTypeId,
            journalEntryDate: formatDateForRG(note.timestamp),
            journalEntryComment: comment,
            journalEntryAnimalID: String(note.petId),
          },
        ],
      });

      const createdFromResponse = asRecords(response.data)[0];
      const createdId = Number(createdFromResponse?.journalEntryID);
      if (!Number.isNaN(createdId) && createdId > 0) {
        return createdId;
      }

      const fallback = await this.searchEntries(
        [
          {
            fieldName: "journalEntryAnimalID",
            operation: "equals",
            criteria: String(note.petId),
          },
          {
            fieldName: "journalEntryEntrytypeID",
            operation: "equals",
            criteria: this.entryTypeId,
          },
          {
            fieldName: "journalEntryComment",
            operation: "equals",
            criteria: comment,
          },
        ],
        { resultLimit: 1 },
      );

      const fallbackId = Number(fallback[0]?.journalEntryID);
      return Number.isNaN(fallbackId) ? 0 : fallbackId;
    } catch (error) {
      console.error("RG notes add failed", error);
      return 0;
    }
  }

  async removeNoteById(id: number): Promise<boolean> {
    try {
      await rescueGroupsClient.post("", {
        objectType: "animalsJournalEntries",
        objectAction: "delete",
        values: [{ journalEntryID: String(id) }],
      });
      return true;
    } catch (error) {
      console.error("RG notes delete failed", error);
      return false;
    }
  }

  async removeNotesByPetId(petId: number): Promise<boolean> {
    const notes = await this.getNoteByPetId(petId);
    if (notes.length === 0) {
      return false;
    }

    let deletedCount = 0;
    for (const note of notes) {
      const removed = await this.removeNoteById(note.id);
      if (removed) deletedCount += 1;
    }

    return deletedCount > 0;
  }
}
