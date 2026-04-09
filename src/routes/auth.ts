import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginHandler, refreshHandler, logoutHandler, meHandler, changePasswordHandler } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const loginRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 20,
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/api/auth/login", loginRateLimit, loginHandler);
router.post("/api/auth/refresh", refreshHandler);
router.post("/api/auth/logout", logoutHandler);
router.get("/api/auth/me", authenticate, meHandler);
router.post("/api/auth/change-password", authenticate, changePasswordHandler);

export default router;
