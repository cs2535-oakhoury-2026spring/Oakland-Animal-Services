import {
  BehaviorNoteSchema,
  type BehaviorNote,
} from "../../models/BehaviorNote.schema.js";
import { BehaviorNoteRepository } from "../../types/index.js";

const seedData: BehaviorNote[] = [
  {
    id: 1,
    timestamp: new Date(),
    content: "Marley is very friendly and playful.",
    author: "Tech Lead",
    petId: 22254130,
  },
  {
    id: 2,
    timestamp: new Date(),
    content: "Needs a quiet environment for rest.",
    author: "Vet",
    petId: 22324883,
  },
];

export class MockBehaviorNoteRepository implements BehaviorNoteRepository {
  private notes: BehaviorNote[] = [...seedData];

  async getBehaviorNotes(
    limit?: number,
    page?: number,
  ): Promise<BehaviorNote[]> {
    if (limit == null || page == null) {
      return [...this.notes];
    }

    if (limit <= 0 || page <= 0) {
      throw new Error("limit and page must be positive numbers");
    }

    const start = (page - 1) * limit;
    return [...this.notes].slice(start, start + limit);
  }

  async getBehaviorNoteByPetId(petId: number): Promise<BehaviorNote[]> {
    return this.notes.filter((note) => note.petId === petId);
  }

  async addBehaviorNote(note: BehaviorNote): Promise<number> {
    BehaviorNoteSchema.parse(note);
    const uniqueId =
      note.id || note.timestamp.getTime() + Math.floor(Math.random() * 1000);
    const created = { ...note, id: uniqueId };
    this.notes.push(created);
    return uniqueId;
  }

  async getBehaviorNoteById(id: number): Promise<BehaviorNote | null> {
    return this.notes.find((note) => note.id === id) ?? null;
  }

  async removeBehaviorNoteById(id: number): Promise<boolean> {
    const originalLength = this.notes.length;
    this.notes = this.notes.filter((note) => note.id !== id);
    return this.notes.length < originalLength;
  }

  async removeNotesByPetId(petId: number): Promise<boolean> {
    const originalLength = this.notes.length;
    this.notes = this.notes.filter((note) => note.petId !== petId);
    return this.notes.length < originalLength;
  }

  seedBehaviorNotes(initial: BehaviorNote[]): void {
    this.notes = [];
    for (const note of initial) {
      BehaviorNoteSchema.parse(note);
      this.notes.push(note);
    }
  }
}
