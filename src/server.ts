import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import config from "./config/index.js";
import petRouter from "./routes/pet.js";
import observerNotesRouter from "./routes/observerNotes.js";
import behaviorNotesRouter from "./routes/behaviorNotes.js";
import searchRouter from "./routes/search.js";
import summarizeRoutes from "./routes/summarize.js";
import dotenv from "dotenv";
import { seedObserverNotes } from "./db/observerNotes.js";
import { seedBehaviorNotes } from "./db/behaviorNotes.js";

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
app.use(behaviorNotesRouter);
app.use(petRouter);


seedObserverNotes([
  {
    id: 1,
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "Marley has been very energetic today, loves playing with feather toys",
    author: "Dr. A",
    petId: 22254130,
  },
  {
    id: 2,
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "Marley showed signs of limping on his left hind leg after playtime",
    author: "Dr. Smith",
    petId: 22254130,
  },
  {
    id: 3,
    timestamp: new Date("2024-06-01T09:15:00Z"),
    content: "Nala has been more vocal than usual, meowing frequently",
    author: "Dr. Brown",
    petId: 22254131,
  },
  {
    id: 4,
    timestamp: new Date("2024-06-02T14:30:00Z"),
    content:
      "Buddy is very friendly and energetic, loves playing fetch in the yard",
    author: "Dr. A",
    petId: 22324883,
  },
]);

seedBehaviorNotes([
  {
    id: 1,
    timestamp: new Date("2024-06-01T11:00:00Z"),
    content: "Marley loves people but needs training around strangers.",
    author: "Trainer A",
    petId: 22254130,
  },
  {
    id: 2,
    timestamp: new Date("2024-06-01T11:30:00Z"),
    content: "Luna gets anxious when in a crate; calming treats help.",
    author: "Trainer B",
    petId: 22324883,
  },
]);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
