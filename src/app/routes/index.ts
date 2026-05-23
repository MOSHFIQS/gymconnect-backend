import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { MemberRoutes } from "../module/member/member.route";
import { PaymentRoutes } from "../module/payment/payment.route";
import { AdminRoutes } from "../module/admin/admin.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/members", MemberRoutes);
router.use("/payments", PaymentRoutes);
router.use("/admin", AdminRoutes);

export const IndexRoutes = router;