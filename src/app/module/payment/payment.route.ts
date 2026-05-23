import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// GET /api/v1/payments/details - Payment gateway details (public)
router.get("/details", PaymentController.getPaymentDetails);

// GET /api/v1/payments/my - Get my payments (member)
router.get(
  "/my",
  checkAuth(Role.MEMBER, Role.ADMIN),
  PaymentController.getMyPayments
);

// GET /api/v1/payments - Get all payments (admin)
router.get(
  "/",
  checkAuth(Role.ADMIN),
  PaymentController.getAllPayments
);

// GET /api/v1/payments/:id - Get single payment
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.MEMBER),
  PaymentController.getPaymentById
);

// POST /api/v1/payments - Submit a payment
router.post(
  "/",
  checkAuth(Role.MEMBER, Role.ADMIN),
  PaymentController.submitPayment
);

// PATCH /api/v1/payments/:id/verify - Admin verifies payment
router.patch(
  "/:id/verify",
  checkAuth(Role.ADMIN),
  PaymentController.verifyPayment
);

export const PaymentRoutes = router;