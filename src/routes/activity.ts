import { Router } from "express";
import { listActivityLogs } from "../controllers/activityController.js";
import { authenticate, requireStaff } from "../middleware/auth.js";

const router = Router();
router.get("/api/activity", authenticate, requireStaff, listActivityLogs);

export default router;
