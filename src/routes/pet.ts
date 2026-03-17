import { Router } from "express";
import { getPet, getPetByLocation } from "../controllers/petController.js";

const router = Router();
router.get("/api/pets/:petId", getPet);
router.get("/api/location/:petType/:location", getPetByLocation);

export default router;
