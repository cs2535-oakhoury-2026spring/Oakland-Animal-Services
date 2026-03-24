import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import {config }from "./config/index.js";
import observerNotesRouter from "./routes/observerNotes.js";
import searchRouter from "./routes/search.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use(observerNotesRouter);
app.use(searchRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
