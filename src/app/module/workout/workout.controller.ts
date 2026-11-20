import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { WorkoutService } from "./workout.service.js";

const getRoutines = catchAsync(async (_req: Request, res: Response) => {
  const result = WorkoutService.getCuratedRoutines();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Workout routines retrieved successfully",
    data: result,
  });
});

const logWorkout = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { routineName, notes } = req.body;
  const result = await WorkoutService.logWorkout(user.id, routineName, notes);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyLogs = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await WorkoutService.getMyLogs(user.id);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Workout logs retrieved",
    data: result,
  });
});

export const WorkoutController = {
  getRoutines,
  logWorkout,
  getMyLogs,
};
