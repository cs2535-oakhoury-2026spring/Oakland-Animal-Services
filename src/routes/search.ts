import { Router } from "express";
import { search } from "../controllers/searchController.js";

const router = Router();
router.post("/api/search", search);

export default router;
