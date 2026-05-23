import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// POST /api/v1/auth/signup
router.post("/signup", AuthController.signup);

// POST /api/v1/auth/signin
router.post("/signin", AuthController.signin);

// POST /api/v1/auth/signout
router.post("/signout", AuthController.signout);

// GET /api/v1/auth/me
router.get(
  "/me",
  checkAuth(Role.ADMIN, Role.MEMBER),
  AuthController.getMe
);

// PATCH /api/v1/auth/change-password
router.patch(
  "/change-password",
  checkAuth(Role.ADMIN, Role.MEMBER),
  AuthController.changePassword
);

export const AuthRoutes = router;