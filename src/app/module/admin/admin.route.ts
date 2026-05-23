import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// All admin routes require ADMIN role
router.use(checkAuth(Role.ADMIN));

// GET  /api/v1/admin/dashboard
router.get("/dashboard", AdminController.getDashboardStats);

// POST /api/v1/admin/users  - create a new admin user
router.post("/users", AdminController.createAdminUser);

// GET  /api/v1/admin/users
router.get("/users", AdminController.getAllUsers);

// GET  /api/v1/admin/users/:id
router.get("/users/:id", AdminController.getUserById);

// PATCH /api/v1/admin/users/:id/role
router.patch("/users/:id/role", AdminController.changeUserRole);

// PATCH /api/v1/admin/users/:id/toggle-active
router.patch("/users/:id/toggle-active", AdminController.toggleUserActive);

// DELETE /api/v1/admin/users/:id
router.delete("/users/:id", AdminController.deleteUser);

// PATCH /api/v1/admin/members/:memberId/approve
router.patch("/members/:memberId/approve", AdminController.approveMember);

export const AdminRoutes = router;