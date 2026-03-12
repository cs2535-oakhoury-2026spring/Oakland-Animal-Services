import { Router } from "express";
import { getPet } from "../controllers/petController.js";

const router = Router();
router.get("/api/pets/:petId", getPet);
export default router;
