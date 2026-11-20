import { Router } from "express";
import { AttendanceController } from "./attendance.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// Member Check-in
router.post(
  "/check-in",
  checkAuth(Role.MEMBER, Role.ADMIN),
  AttendanceController.checkIn
);

// Get my attendance
router.get(
  "/my",
  checkAuth(Role.MEMBER, Role.ADMIN),
  AttendanceController.getMyAttendance
);

// Admin-only stats
router.get(
  "/stats",
  checkAuth(Role.ADMIN),
  AttendanceController.getAttendanceStats
);

export const AttendanceRoutes = router;
