import { Router } from "express";
import { MemberController } from "./member.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { upload } from "../../config/multer.config.js";
import { Role } from "../../../generated/prisma/enums.js";


const router = Router();

// POST /api/v1/members - Create member registration (logged in user)
router.post(
  "/",
  checkAuth(Role.MEMBER, Role.ADMIN),
  upload.single("profileImage"),
  MemberController.createMember
);

// GET /api/v1/members/me - Get my member profile
router.get(
  "/me",
  checkAuth(Role.MEMBER, Role.ADMIN),
  MemberController.getMyMemberProfile
);

// GET /api/v1/members - Get all members (admin only)
router.get(
  "/",
  checkAuth(Role.ADMIN),
  MemberController.getAllMembers
);

// GET /api/v1/members/:id - Get single member
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.MEMBER),
  MemberController.getMemberById
);

// PATCH /api/v1/members/:id - Update member
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.MEMBER),
  upload.single("profileImage"),
  MemberController.updateMember
);

// DELETE /api/v1/members/:id - Delete member
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.MEMBER),
  MemberController.deleteMember
);

export const MemberRoutes = router;