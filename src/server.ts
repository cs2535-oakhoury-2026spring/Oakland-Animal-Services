import express from "express";
import cookieParser from "cookie-parser";
import config from "./config/index.js";
import petRouter from "./routes/pet.js";
import observerNotesRouter from "./routes/observerNotes.js";
import behaviorNotesRouter from "./routes/behaviorNotes.js";
import searchRouter from "./routes/search.js";
import summarizeRoutes from "./routes/summarize.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set in .env");
if (!process.env.ADMIN_USER) throw new Error("ADMIN_USER must be set in .env");
if (!process.env.ADMIN_PASS) throw new Error("ADMIN_PASS must be set in .env");

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(cookieParser());
app.use(authRouter);
app.use(usersRouter);
app.use(summarizeRoutes);
app.use(searchRouter);
app.use(observerNotesRouter);
app.use(behaviorNotesRouter);
app.use(petRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
