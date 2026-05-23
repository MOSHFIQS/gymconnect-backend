import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AdminService } from "./admin.service.js";
import { z } from "zod";
import { Role } from "../../../generated/prisma/enums.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Dashboard stats fetched",
    data: result,
  });
});

// ─── User Management ──────────────────────────────────────────────────────────

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, search, role, isActive } = req.query;
  const result = await AdminService.getAllUsers({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string | undefined,
    role: role as Role | undefined,
    isActive: isActive !== undefined ? isActive === "true" : undefined,
  });
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users fetched",
    data: result.users,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getUserById(req.params.id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User fetched",
    data: result,
  });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = z.object({ role: z.nativeEnum(Role) }).parse(req.body);
  const result = await AdminService.changeUserRole(req.params.id as string, role);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User role updated",
    data: result,
  });
});

const toggleUserActive = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.toggleUserActive(req.params.id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `User ${result.isActive ? "activated" : "deactivated"} successfully`,
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.deleteUser(req.params.id as string, req.user!.id);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
  });
});

const approveMember = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.approveMember(req.params.memberId as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Member approved",
    data: result,
  });
});

const createAdminUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = z
    .object({ email: z.string().email(), password: z.string().min(6) })
    .parse(req.body);
  const result = await AdminService.createAdminUser(email, password);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Admin user created",
    data: result,
  });
});

export const AdminController = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  changeUserRole,
  toggleUserActive,
  deleteUser,
  approveMember,
  createAdminUser,
};