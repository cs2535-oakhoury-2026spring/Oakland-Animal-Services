import { Router } from "express";
import { createUserHandler, listUsersHandler, resetPasswordHandler, updateUserHandler, deleteUserHandler, batchCreateUsersHandler } from "../controllers/userController.js";
import { authenticate, requireStaff, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/api/users", authenticate, requireStaff, createUserHandler);
router.get("/api/users", authenticate, requireAdmin, listUsersHandler);
router.put("/api/users/:userId/password", authenticate, requireStaff, resetPasswordHandler);
router.patch("/api/users/:userId", authenticate, requireStaff, updateUserHandler);
router.delete("/api/users/:userId", authenticate, requireStaff, deleteUserHandler);
router.post("/api/users/batch", authenticate, requireAdmin, batchCreateUsersHandler);

export default router;
