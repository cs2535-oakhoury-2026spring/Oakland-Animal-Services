import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import config from "./config/index.js";
import petRouter from "./routes/pet.js";
import observerNotesRouter from "./routes/observerNotes.js";
import searchRouter from "./routes/search.js";
import summarizeRoutes from "./routes/summarize.js";
import dotenv from "dotenv";
import { seedObserverNotes } from "./db/observerNotes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use(summarizeRoutes);
app.use(searchRouter);
app.use(observerNotesRouter);
app.use(petRouter);


seedObserverNotes([
  {
    id: 1,
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "Buddy has been very energetic today, loves playing fetch in the yard",
    author: "Dr. A",
    petId: 1,
  },
  {
    id: 2,
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "Buddy showed signs of limping on his left hind leg after exercise",
    author: "Dr. Smith",
    petId: 1,
  },
  {
    id: 3,
    timestamp: new Date("2024-06-01T09:15:00Z"),
    content: "Whiskers has been more vocal than usual, meowing frequently",
    author: "Dr. Brown",
    petId: 2,
  },
]);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
