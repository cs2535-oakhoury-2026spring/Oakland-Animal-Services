import { Router } from "express";
import {
  getPet,
  getPetByLocation,
  getAllAnimalsHandler,
} from "../controllers/petController.js";
import {
  getCompatibilityHandler,
  updateCompatibilityHandler,
} from "../controllers/petCompatibilityController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.get("/api/animals/all", authenticate, getAllAnimalsHandler);
router.get(
  "/api/pets/:petId/compatibility",
  authenticate,
  getCompatibilityHandler,
);
router.put(
  "/api/pets/:petId/compatibility",
  authenticate,
  updateCompatibilityHandler,
);
router.get("/api/pets/:petId", authenticate, getPet);
router.get("/api/location/:petType/:location", authenticate, getPetByLocation);

export default router;
