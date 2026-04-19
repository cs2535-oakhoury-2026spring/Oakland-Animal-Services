import { type BehaviorNote } from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";
import { BaseNoteDBRepository } from "./notesDB.js";

export class BehaviorNoteDBRepository
  extends BaseNoteDBRepository<BehaviorNote>
  implements BehaviorNoteRepository
{
  constructor() {
    super("BEHAVIOR");
  }
}
