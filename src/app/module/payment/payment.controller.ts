import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { PaymentService } from "./payment.service.js";
import { submitPaymentSchema, verifyPaymentSchema } from "./payment.validation.js";
import { PaymentStatus } from "../../../generated/prisma/enums.js";

const getPaymentDetails = catchAsync(async (_req: Request, res: Response) => {
  const result = PaymentService.getPaymentDetails();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment details fetched",
    data: result,
  });
});

const submitPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const data = submitPaymentSchema.parse({
    ...req.body,
    amount: Number(req.body.amount),
  });

  const result = await PaymentService.submitPayment(user.id, data);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Payment submitted. Awaiting admin verification.",
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = verifyPaymentSchema.parse(req.body);

  const result = await PaymentService.verifyPayment(id as string, req.user!.id, data);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `Payment ${data.status.toLowerCase()} successfully`,
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getMyPayments(req.user!.id);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Your payments fetched",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PaymentService.getPaymentById(id as string, req.user!.id, req.user!.role);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment fetched",
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, status: paymentStatus, method } = req.query;
  const result = await PaymentService.getAllPayments({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status: paymentStatus as PaymentStatus | undefined,
    method: method as string | undefined,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payments fetched",
    data: result.payments,
    meta: result.meta,
  });
});

export const PaymentController = {
  getPaymentDetails,
  submitPayment,
  verifyPayment,
  getMyPayments,
  getPaymentById,
  getAllPayments,
};