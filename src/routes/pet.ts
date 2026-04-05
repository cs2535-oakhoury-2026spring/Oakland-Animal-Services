import { Router } from "express";
import { getPet, getPetByLocation } from "../controllers/petController.js";

const router = Router();
router.get("/api/pets/:petId", getPet);

// Example /api/location/dog/e:1
// EX:     /api/location/cat/cat-w:6
// multi cats EX: /api/location/cat/cat-w:5 (in mock)
// Returns an array of pets that are located there.
router.get("/api/location/:petType/:location", getPetByLocation);

export default router;
