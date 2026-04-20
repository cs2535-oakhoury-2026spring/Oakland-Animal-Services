import { type ObserverNote } from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";
import {
  RescueGroupNotesBaseRepository,
  type RescueGroupsJournalEntry,
} from "./rescueGroupNotesShared.js";

const OBSERVER_ENTRY_TYPE_ID = "60460";

export class RescueGroupObserverNotesRepository
  extends RescueGroupNotesBaseRepository<ObserverNote>
  implements ObserverNoteRepository
{
  constructor() {
    super(OBSERVER_ENTRY_TYPE_ID);
  }

  protected toModel(entry: RescueGroupsJournalEntry): ObserverNote {
    const common = this.toCommon(entry);
    return {
      id: common.id,
      timestamp: common.timestamp,
      title: common.title,
      content: common.content,
      author: common.author,
      petId: common.petId,
      status: common.status ?? "RAISED",
    };
  }

  protected toPayload(note: ObserverNote) {
    return {
      source: "oas-notes" as const,
      schemaVersion: 1 as const,
      createdAt: note.timestamp.toISOString(),
      title: note.title,
      content: note.content,
      author: note.author,
      status: note.status,
    };
  }

  async updateObserverNoteStatus(
    uniqueId: number,
    status: string,
  ): Promise<boolean> {
    const note = await this.getNoteById(uniqueId);
    if (!note) {
      return false;
    }

    const updated: ObserverNote = {
      ...note,
      status,
    };

    return this.editJournalComment(uniqueId, this.serializeComment(updated));
  }
}
