import express from "express";
import config from "./config/index.js";
import petRouter from "./routes/pet.js";
import observerNotesRouter from "./routes/observerNotes.js";
import behaviorNotesRouter from "./routes/behaviorNotes.js";
import searchRouter from "./routes/search.js";
import summarizeRoutes from "./routes/summarize.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(summarizeRoutes);
app.use(searchRouter);
app.use(observerNotesRouter);
app.use(behaviorNotesRouter);
app.use(petRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
