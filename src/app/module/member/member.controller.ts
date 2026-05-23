import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { MemberService } from "./member.service.js";
import { createMemberSchema, updateMemberSchema } from "./member.validation.js";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../../config/cloudinary.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { MemberStatus } from "../../../generated/prisma/enums.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * If req.file exists (multer memoryStorage puts the file in req.file.buffer),
 * upload it to Cloudinary and return the secure_url.
 * Returns undefined if no file was attached.
 */
const handleProfileImageUpload = async (
  req: Request
): Promise<string | undefined> => {
  if (!req.file) return undefined;

  const result = await uploadToCloudinary(req.file.buffer, "gym/profiles");
  return result.secure_url;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

const createMember = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const data = createMemberSchema.parse(req.body);

  // Upload profile image to Cloudinary (if attached)
  const profileImageUrl = await handleProfileImageUpload(req);

  const result = await MemberService.createMember(
    user.id,
    user.email,
    data,
    profileImageUrl
  );

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Member registration submitted. Pending admin approval.",
    data: result,
  });
});

const updateMember = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const data = updateMemberSchema.parse(req.body);

  // If a new image is uploaded, delete the old one from Cloudinary first
  let profileImageUrl: string | undefined;

  if (req.file) {
    // Fetch current member to get old image URL
    const existing = await MemberService.getMemberById(id as string);

    if (existing.profileImage) {
      const oldPublicId = extractPublicId(existing.profileImage);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId).catch(() => {
          // Non-fatal: log but don't block the update
          console.warn("Could not delete old Cloudinary image:", oldPublicId);
        });
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, "gym/profiles");
    profileImageUrl = result.secure_url;
  }

  const result = await MemberService.updateMember(
    user.id,
    id as string,
    user.role,
    data,
    profileImageUrl
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Member updated successfully",
    data: result,
  });
});

const deleteMember = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  // Delete profile image from Cloudinary before deleting the record
  const existing = await MemberService.getMemberById(id as string);
  if (existing.profileImage) {
    const publicId = extractPublicId(existing.profileImage);
    if (publicId) {
      await deleteFromCloudinary(publicId).catch(() => {
        console.warn("Could not delete Cloudinary image:", publicId);
      });
    }
  }

  const result = await MemberService.deleteMember(user.id, id as string, user.role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
  });
});

const getMemberById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MemberService.getMemberById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Member fetched successfully",
    data: result,
  });
});

const getMyMemberProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await MemberService.getMyMemberProfile(user.id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Your profile fetched",
    data: result,
  });
});

const getAllMembers = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    search,
    status: memberStatus,
    membershipPlan,
    gender,
  } = req.query;

  const result = await MemberService.getAllMembers({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string | undefined,
    status: memberStatus as MemberStatus | undefined,
    membershipPlan: membershipPlan as string | undefined,
    gender: gender as string | undefined,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Members fetched successfully",
    data: result.members,
    meta: result.meta,
  });
});

export const MemberController = {
  createMember,
  updateMember,
  deleteMember,
  getMemberById,
  getMyMemberProfile,
  getAllMembers,
};