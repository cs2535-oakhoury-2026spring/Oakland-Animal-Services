import { Router } from "express";
import {
  createUserHandler,
  listUsersHandler,
  resetPasswordHandler,
  updateUserHandler,
  deleteUserHandler,
  batchCreateUsersHandler,
} from "../controllers/userController.js";
import { authenticate, requireStaff } from "../middleware/auth.js";

const router = Router();

router.post("/api/users", authenticate, requireStaff, createUserHandler);
router.get("/api/users", authenticate, requireStaff, listUsersHandler);
router.put(
  "/api/users/:userId/password",
  authenticate,
  requireStaff,
  resetPasswordHandler,
);
router.patch(
  "/api/users/:userId",
  authenticate,
  requireStaff,
  updateUserHandler,
);
router.delete(
  "/api/users/:userId",
  authenticate,
  requireStaff,
  deleteUserHandler,
);
router.post(
  "/api/users/batch",
  authenticate,
  requireStaff,
  batchCreateUsersHandler,
);
router.post(
  "/api/users/import",
  authenticate,
  requireStaff,
  batchCreateUsersHandler,
);

export default router;
