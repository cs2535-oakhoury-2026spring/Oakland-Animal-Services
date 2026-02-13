import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MedicalNote, findSimilarNotes } from "./medicalNoteSearch.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const medicalNotes: MedicalNote[] = [
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
    content:
      "Cody has a red bump and limp on his left hind leg. Threw up and diarrhea and puked on the floor. Fought with Anky",
    author: "Dr. John Hones",
  },
  {
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "Cody has a red bump and limping on his left hind leg leg. Threw up and diarrhea and puked on the floor. Fought with Anky",
    author: "Dr. John Hones",
  },
  {
    timestamp: new Date("2025-06-01T10:00:00Z"),
    content:
      "ct scaned cody saw bone fracture in left hind feet. Cody has a red bump and limping on his left hind leg. Threw up and diarrhea and puked on the floor. Fought with Anky",
    author: "Dr. John Honesv2",
  },
  {
    timestamp: new Date("2024-06-01T10:00:00Z"),
    content:
      "[TYPO] yesterda YEstrday Cody been has a red bump and limpiing on his left hind legacy. Threw up and diarrhea and puked on the floor. Fought with Anky",
    author: "Dr. John Hones",
  },
];

app.post("/api/search", (req: Request, res: Response) => {
  const { note, nameToExclude, maxResults } = req.body;

  if (!note) {
    return res.status(400).json({ error: "Note content is required" });
  }

  try {
    const results = findSimilarNotes(note, medicalNotes, {
      nameToExclude,
      maxResults: maxResults || 5,
    });

    res.json({
      success: true,
      query: note,
      results: results,
      resultCount: results.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/notes", (req: Request, res: Response) => {
  res.json({
    success: true,
    notes: medicalNotes,
  });
});

app.post("/api/upload", (req: Request, res: Response) => {
  const { content, author } = req.body;

  if (!content || !author) {
    return res.status(400).json({ error: "Content and author are required" });
  }

  const newNote: MedicalNote = {
    timestamp: new Date(),
    content,
    author,
  };

  medicalNotes.push(newNote);

  res.json({
    success: true,
    message: "Medical note uploaded successfully",
    note: newNote,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
