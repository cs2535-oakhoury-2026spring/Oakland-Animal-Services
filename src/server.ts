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
import activityRouter from "./routes/activity.js";
import { main as createUsersTable } from "./db/scripts/createUsersTable.js";
import { main as createRefreshTokensTable } from "./db/scripts/createRefreshTokensTable.js";
import { main as createObserverNotesTable } from "./db/scripts/createObserverNotesTable.js";
import { main as createBehaviorNotesTable } from "./db/scripts/createBehaviorNotesTable.js";
import { main as createPetCompatibilityTable } from "./db/scripts/createPetCompatibilityTable.js";
import { main as createActivityLogTable } from "./db/scripts/createActivityLogTable.js";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set in .env");
if (!process.env.ADMIN_USER) throw new Error("ADMIN_USER must be set in .env");
if (!process.env.ADMIN_PASS) throw new Error("ADMIN_PASS must be set in .env");

await Promise.all([
    createUsersTable(),
    createRefreshTokensTable(),
    createObserverNotesTable(),
    createBehaviorNotesTable(),
    createPetCompatibilityTable(),
    createActivityLogTable(),
]);

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(cookieParser());
app.use(authRouter);
app.use(usersRouter);
app.use(activityRouter);
app.use(summarizeRoutes);
app.use(searchRouter);
app.use(observerNotesRouter);
app.use(behaviorNotesRouter);
app.use(petRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
