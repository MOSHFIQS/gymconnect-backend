import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { envVars } from "../../config/env.js";
import { SubmitPaymentInput, VerifyPaymentInput } from "./payment.validation.js";
import { prisma } from "../../lib/prisma.js";
import { PaymentStatus, Role } from "../../../generated/prisma/enums.js";

// Returns payment gateway info to show user before they send money
const getPaymentDetails = () => {
  return {
    bkash: {
      method: "BKASH",
      merchantNumber: envVars.BKASH_MERCHANT_NUMBER,
      instructions: "Send money to the merchant number and note the Transaction ID",
    },
    nagad: {
      method: "NAGAD",
      merchantNumber: envVars.NAGAD_MERCHANT_NUMBER,
      instructions: "Send money to the merchant number and note the Transaction ID",
    },
    bankTransfer: {
      method: "BANK_TRANSFER",
      bankName: envVars.BANK_NAME,
      accountNumber: envVars.BANK_ACCOUNT,
      routingNumber: envVars.BANK_ROUTING,
      instructions: "Transfer to the bank account and note your Transaction/Reference ID",
    },
  };
};

const submitPayment = async (userId: string, data: SubmitPaymentInput) => {
  // Verify member belongs to this user
  const member = await prisma.member.findUnique({
    where: { id: data.memberId },
  });
  if (!member) throw new AppError(status.NOT_FOUND, "Member not found");
  if (member.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden: Not your member profile");
  }

  // Check duplicate transaction ID
  const existing = await prisma.payment.findUnique({
    where: { transactionId: data.transactionId },
  });
  if (existing) {
    throw new AppError(status.CONFLICT, "Transaction ID already submitted");
  }

  const payment = await prisma.payment.create({
    data: {
      memberId: data.memberId,
      userId,
      transactionId: data.transactionId,
      amount: data.amount,
      method: data.method,
      status: PaymentStatus.PENDING,
    },
  });

  return payment;
};

const verifyPayment = async (
  paymentId: string,
  adminId: string,
  data: VerifyPaymentInput
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { member: true },
  });
  if (!payment) throw new AppError(status.NOT_FOUND, "Payment not found");
  if (payment.status !== PaymentStatus.PENDING) {
    throw new AppError(status.BAD_REQUEST, "Payment already processed");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: data.status as PaymentStatus,
        adminNote: data.adminNote,
        verifiedAt: new Date(),
      },
    });

    // If approved, activate the member
    if (data.status === "APPROVED") {
      await tx.member.update({
        where: { id: payment.memberId },
        data: { status: "ACTIVE" },
      });
    }

    return updatedPayment;
  });

  return updated;
};

const getMyPayments = async (userId: string) => {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { fullName: true, membershipPlan: true } },
    },
  });
};

const getPaymentById = async (paymentId: string, userId: string, role: Role) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      member: { select: { fullName: true, email: true, membershipPlan: true } },
      user: { select: { email: true } },
    },
  });

  if (!payment) throw new AppError(status.NOT_FOUND, "Payment not found");

  if (role !== Role.ADMIN && payment.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Forbidden");
  }

  return payment;
};

interface GetAllPaymentsOptions {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  method?: string;
}

const getAllPayments = async (options: GetAllPaymentsOptions) => {
  const { page = 1, limit = 10, status: paymentStatus, method } = options;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (paymentStatus) where.status = paymentStatus;
  if (method) where.method = method;

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { fullName: true, email: true, phone: true, membershipPlan: true, profileImage: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const PaymentService = {
  getPaymentDetails,
  submitPayment,
  verifyPayment,
  getMyPayments,
  getPaymentById,
  getAllPayments,
};