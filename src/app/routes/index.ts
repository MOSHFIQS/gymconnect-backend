import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { MemberRoutes } from "../module/member/member.route.js";
import { PaymentRoutes } from "../module/payment/payment.route.js";
import { AdminRoutes } from "../module/admin/admin.route.js";
import { NoticeRoutes } from "../module/notice/notice.route.js";
import { AttendanceRoutes } from "../module/attendance/attendance.route.js";
import { WorkoutRoutes } from "../module/workout/workout.route.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/members", MemberRoutes);
router.use("/payments", PaymentRoutes);
router.use("/admin", AdminRoutes);
router.use("/notices", NoticeRoutes);
router.use("/attendance", AttendanceRoutes);
router.use("/workouts", WorkoutRoutes);

export const IndexRoutes = router;