import { Router } from "express";
import {
  createUserHandler,
  listUsersHandler,
  resetPasswordHandler,
  updateUserHandler,
  deleteUserHandler,
  batchCreateUsersHandler,
  batchDeleteUsersHandler,
  batchUpdateUsersHandler,
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

// Batch user creation/import endpoints. /api/users/import is an alias for compatibility.
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

// Batch update and delete endpoints used by the user management UI.
router.post(
  "/api/users/batch-delete",
  authenticate,
  requireStaff,
  batchDeleteUsersHandler,
);
router.post(
  "/api/users/batch-update",
  authenticate,
  requireStaff,
  batchUpdateUsersHandler,
);
router.post(
  "/api/users/batch-rename-tag",
  authenticate,
  requireStaff,
  batchUpdateUsersHandler,
);

export default router;
