import express from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
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
import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set in .env");
if (!process.env.ADMIN_USER) throw new Error("ADMIN_USER must be set in .env");
if (!process.env.ADMIN_PASS) throw new Error("ADMIN_PASS must be set in .env");

// Skip table creation on startup - tables should already exist or be created manually
// To create tables manually, run: npm run create-tables

const app = express();
const PORT = config.port;

// CRA's dev proxy forwards requests with X-Forwarded-For, and express-rate-limit
// needs Express to trust that proxy to read the client IP safely.
app.set("trust proxy", 1);

// Max of [max] per minute per IP or userId but still allowing bulk delete
const generalRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "DELETE",
  keyGenerator: (req) =>
    String(req.user?.userId ?? ipKeyGenerator(req.ip || "") ?? "anonymous"),
  message: { error: "Too many requests, please try again in a minute." },
});

app.use(express.json());
app.use(cookieParser());
app.use(generalRequestLimiter);
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
