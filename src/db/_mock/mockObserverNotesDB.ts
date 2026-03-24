import { ObserverNoteSchema, type ObserverNote } from "../../models/ObserverNote.schema.js";
import { ObserverNoteRepository } from "../../types/index.js";

const seedData: ObserverNote[] = [
  {
    id: 1,
    status: "active",
    timestamp: new Date(),
    content: "Marley is very friendly and playful.",
    author: "Tech Lead",
    petId: 22254130,
  },
  {
    id: 2,
    status: "active",
    timestamp: new Date(),
    content: "Needs a quiet environment for rest.",
    author: "Vet",
    petId: 22324883,
  },
];

export class MockObserverNoteRepository implements ObserverNoteRepository {
  private notes: ObserverNote[] = [...seedData];

  async getObserverNotes(limit?: number, page?: number): Promise<ObserverNote[]> {
    if (limit == null || page == null) {
      return [...this.notes];
    }

    if (limit <= 0 || page <= 0) {
      throw new Error("limit and page must be positive numbers");
    }

    const start = (page - 1) * limit;
    return [...this.notes].slice(start, start + limit);
  }

  async getObserverNoteByPetId(petId: number): Promise<ObserverNote[]> {
    return this.notes.filter((note) => note.petId === petId);
  }

  async addObserverNote(note: ObserverNote): Promise<boolean> {
    ObserverNoteSchema.parse(note);
    this.notes.push(note);
    return true;
  }

  async removeObserverNoteById(id: number): Promise<boolean> {
    const originalLength = this.notes.length;
    this.notes = this.notes.filter((note) => note.id !== id);
    return this.notes.length < originalLength;
  }

  async updateObserverNoteStatus(id: number, status: string): Promise<boolean> {
    const note = this.notes.find((n) => n.id === id);
    if (!note) {
      throw new Error(`Observer note with id ${id} not found`);
    }
    note.status = status;
    return true;
  }

  async removeNotesByPetId(petId: number): Promise<boolean> {
    const originalLength = this.notes.length;
    this.notes = this.notes.filter((note) => note.petId !== petId);
    return this.notes.length < originalLength;
  }

  seedObserverNotes(initial: ObserverNote[]): void {
    this.notes = [];
    for (const note of initial) {
      ObserverNoteSchema.parse(note);
      this.notes.push(note);
    }
  }
}
