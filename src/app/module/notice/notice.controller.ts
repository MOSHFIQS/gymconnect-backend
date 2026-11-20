import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { NoticeService } from "./notice.service.js";

const getAllNotices = catchAsync(async (req: Request, res: Response) => {
  const activeOnly = req.query.all !== "true";
  const result = await NoticeService.getAllNotices(activeOnly);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notices fetched successfully",
    data: result,
  });
});

const createNotice = catchAsync(async (req: Request, res: Response) => {
  const result = await NoticeService.createNotice(req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Notice created successfully",
    data: result,
  });
});

const updateNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.updateNotice(id as string, req.body);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notice updated successfully",
    data: result,
  });
});

const deleteNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.deleteNotice(id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Notice deleted successfully",
    data: result,
  });
});

export const NoticeController = {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
