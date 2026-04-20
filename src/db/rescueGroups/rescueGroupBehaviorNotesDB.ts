import { type BehaviorNote } from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";
import {
  RescueGroupNotesBaseRepository,
  type RescueGroupsJournalEntry,
} from "./rescueGroupNotesShared.js";

const BEHAVIOR_ENTRY_TYPE_ID = "60461";

export class RescueGroupBehaviorNotesRepository
  extends RescueGroupNotesBaseRepository<BehaviorNote>
  implements BehaviorNoteRepository
{
  constructor() {
    super(BEHAVIOR_ENTRY_TYPE_ID);
  }

  protected toModel(entry: RescueGroupsJournalEntry): BehaviorNote {
    const common = this.toCommon(entry);
    return {
      id: common.id,
      timestamp: common.timestamp,
      title: common.title,
      content: common.content,
      author: common.author,
      petId: common.petId,
    };
  }

  protected toPayload(note: BehaviorNote) {
    return {
      source: "oas-notes" as const,
      schemaVersion: 1 as const,
      createdAt: note.timestamp.toISOString(),
      title: note.title,
      content: note.content,
      author: note.author,
    };
  }
}
