import { Router } from "express";
import { NoticeController } from "./notice.controller.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// GET /api/v1/notices - Get active notices (Public or Member)
router.get("/", NoticeController.getAllNotices);

// Admin-only management
router.post("/", checkAuth(Role.ADMIN), NoticeController.createNotice);
router.patch("/:id", checkAuth(Role.ADMIN), NoticeController.updateNotice);
router.delete("/:id", checkAuth(Role.ADMIN), NoticeController.deleteNotice);

export const NoticeRoutes = router;
