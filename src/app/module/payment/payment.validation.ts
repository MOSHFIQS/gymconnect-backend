import { z } from "zod";
import { PaymentMethod } from "../../../generated/prisma/enums";

export const submitPaymentSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  transactionId: z.string().min(4, "Transaction ID is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.nativeEnum(PaymentMethod),
});

export const verifyPaymentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;