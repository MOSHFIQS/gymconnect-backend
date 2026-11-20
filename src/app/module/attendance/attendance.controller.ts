import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AttendanceService } from "./attendance.service.js";

const checkIn = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { notes } = req.body;
  const result = await AttendanceService.checkIn(user.id, notes);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyAttendance = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await AttendanceService.getMyAttendance(user.id);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Attendance history retrieved",
    data: result,
  });
});

const getAttendanceStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AttendanceService.getAttendanceStats();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Attendance statistics retrieved",
    data: result,
  });
});

export const AttendanceController = {
  checkIn,
  getMyAttendance,
  getAttendanceStats,
};
