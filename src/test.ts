import {
  ObserverNote,
  findSimilarObserverNotes,
} from "./services/observerNoteService.js";
import { seedObserverNotes } from "./db/observerNotes.js";

import { getCatIdFromLocation, getDogIdFromLocation, getPetById } from "./db/pets.js";
import { get } from "http";

// getPetById(22254130).then((pet) => {
//   console.log("=== Pet from DB ===");
//   console.log(pet);
//   console.log();
// });

// getDogIdFromLocation("e:1").then((petId) => {
//   console.log("=== Dog ID by Location ===");
//   console.log(petId);
//   console.log();
// });

getCatIdFromLocation("Holding-4:19").then((petId) => {
  console.log("=== Cat ID by Location ===");
  console.log(petId);
  console.log();
});

const sampleNotes: ObserverNote[] = [
  {
    id: 1,
    status: "active",
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content: "blah balh balh dog ate homework",
    author: "Dr. A",
    petId: 1,
  },
  {
    id: 2,
    status: "active",
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content: "Cody has a limp on his left hind leg.",
    author: "Dr. Smith",
    petId: 1,
  },
  {
    id: 3,
    status: "active",
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "Cody has a red bump and limp on his left hind leg. Threw up and diarrhea and puked on the floor. Fought with Anky",
    author: "Dr. John Hones",
    petId: 1,
  },
];

seedObserverNotes(sampleNotes);

async function runSearch() {
  const searchNote = "left";
  let start = performance.now();
  const cache = new Map();

  const first = await findSimilarObserverNotes(searchNote, {
    nameToExclude: "Cody",
    maxResults: 5,
    noteDataCache: cache,
  });

  let end = performance.now();
  console.log(
    `_____Search completed in ${(end - start).toFixed(2)} ms\n | Found ${first.length} similar notes\n`,
  );

  start = performance.now();

  const similarNotes = await findSimilarObserverNotes(searchNote, {
    nameToExclude: "Cody",
    maxResults: 5,
    noteDataCache: cache,
  });

  end = performance.now();
  console.log(
    `_____Second Search completed in ${(end - start).toFixed(2)} ms\n | Found ${similarNotes.length} similar notes\n`,
  );

  console.log("=== Similar Notes Found ===\n");
  similarNotes.forEach((result, index) => {
    console.log(
      `${index + 1}. Observer note by ${result.observerNote.author} | ${result.observerNote.timestamp.toISOString()}`,
    );
    console.log(`   Content: ${result.observerNote.content}`);
    console.log(`   Marked:  ${result.highlightedContent}`);
    console.log(`   Matches: ${result.matchCount}`);
    console.log(`   Keywords:`);
    result.matchedKeywords.forEach((kw) => {
      const positions = kw.positions
        .map((p) => `[${p.start}-${p.end}]`)
        .join(", ");
      console.log(`     • "${kw.keyword}" - Positions: ${positions}`);
    });
    console.log();
  });
}

runSearch().catch((err) => {
  console.error("Test search failed", err);
});
