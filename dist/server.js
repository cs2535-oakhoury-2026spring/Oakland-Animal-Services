import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config/index.js";
import observerNotesRouter from "./routes/observerNotes.js";
import searchRouter from "./routes/search.js";
import { seedNotes } from "./services/observerNoteService.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = config.port;
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(observerNotesRouter);
app.use(searchRouter);
seedNotes([
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
]);
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
