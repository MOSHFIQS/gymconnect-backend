import { Router } from "express";
import { WorkoutController } from "./workout.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// GET /api/v1/workouts/routines - Public / Member routines
router.get("/routines", WorkoutController.getRoutines);

// Member logs
router.post(
  "/log",
  checkAuth(Role.MEMBER, Role.ADMIN),
  WorkoutController.logWorkout
);

router.get(
  "/my-logs",
  checkAuth(Role.MEMBER, Role.ADMIN),
  WorkoutController.getMyLogs
);

export const WorkoutRoutes = router;
