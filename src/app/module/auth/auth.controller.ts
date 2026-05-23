import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AuthService } from "./auth.service.js";
import { signupSchema, signinSchema } from "./auth.validation.js";

const signup = catchAsync(async (req: Request, res: Response) => {
  const data = signupSchema.parse(req.body);
  const result = await AuthService.signup(data);

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Registration successful",
    data: { user: result.user, token: result.token },
  });
});

const signin = catchAsync(async (req: Request, res: Response) => {
  const data = signinSchema.parse(req.body);
  const result = await AuthService.signin(data);

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Login successful",
    data: { user: result.user, token: result.token },
  });
});

const signout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("token");
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Logged out successfully",
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthService.getMe(req.user!.id);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile fetched",
    data: user,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const result = await AuthService.changePassword(
    req.user!.id,
    oldPassword,
    newPassword
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
  });
});

export const AuthController = { signup, signin, signout, getMe, changePassword };