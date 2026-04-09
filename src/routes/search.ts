import { Router } from "express";
import { search } from "../controllers/searchController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.post("/api/search", authenticate, search);

export default router;
