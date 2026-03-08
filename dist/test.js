import { seedNotes, searchNotes, } from "./services/observerNoteService.js";
// sample notes used for manual testing — copied into service store below
const sampleNotes = [
    {
        timestamp: new Date("2024-06-01T10:00:00Z"),
        content: "blah balh balh dog ate homework",
        author: "Dr. A",
    },
    {
        timestamp: new Date("2024-06-01T10:00:00Z"),
        content: "Cody has a limp on his left hind leg.",
        author: "Dr. Smith",
    },
    {
        timestamp: new Date("2024-06-01T10:00:00Z"),
        content: "Cody has a red bump and limp on his left hind leg. Threw up and diarrhea and puked on the floor. Fought with Anky",
        author: "Dr. John Hones",
    },
];
seedNotes(sampleNotes);
// observerNotes = [
//   {
//     timestamp: new Date("2024-06-01T10:00:00Z"),
//     content: "ct scaned cody saw bone fracture in left hind feet. Cody has a red bump and limping on his left hind leg. Threw up and diarrhea and puked on the floor. Fought with Anky",
//     author: "Dr. John Honeaes",
//   },
// ];
const searchNote = "left";
let start = performance.now();
const cache = new Map();
const first = searchNotes(searchNote, {
    nameToExclude: "Cody",
    maxResults: 5,
    noteDataCache: cache,
});
let end = performance.now();
console.log(`_____Search completed in ${(end - start).toFixed(2)} ms\n | Found ${first.length} similar notes\n`);
start = performance.now();
const similarNotes = searchNotes(searchNote, {
    nameToExclude: "Cody",
    maxResults: 5,
    noteDataCache: cache,
});
end = performance.now();
console.log(`_____Second Search completed in ${(end - start).toFixed(2)} ms\n | Found ${similarNotes.length} similar notes\n`);
console.log("=== Similar Notes Found ===\n");
similarNotes.forEach((result, index) => {
    console.log(`${index + 1}. Observer note by ${result.observerNote.author} | ${result.observerNote.timestamp.toISOString()}`);
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
