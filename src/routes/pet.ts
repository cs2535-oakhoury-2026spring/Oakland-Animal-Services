import { Router } from "express";
import { getPet, getPetByLocation, getAllAnimalsHandler } from "../controllers/petController.js";
import { getCompatibilityHandler, updateCompatibilityHandler } from "../controllers/petCompatibilityController.js";

const router = Router();
router.get("/api/animals/all", getAllAnimalsHandler);
router.get("/api/pets/:petId/compatibility", getCompatibilityHandler);
router.put("/api/pets/:petId/compatibility", updateCompatibilityHandler);
router.get("/api/pets/:petId", getPet);
router.get("/api/location/:petType/:location", getPetByLocation);

export default router;
