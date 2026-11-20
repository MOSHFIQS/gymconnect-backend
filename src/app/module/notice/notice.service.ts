import status from "http-status";
import AppError from "../../errorHelpers/AppError.js";
import { prisma } from "../../lib/prisma.js";

const DEFAULT_NOTICES = [
  {
    title: "Welcome to GymConnect!",
    content: "We are thrilled to have you with us. Enjoy 24/7 access to all equipment, clean locker rooms, and certified trainer support.",
    category: "GENERAL",
    priority: "HIGH",
    isActive: true,
  },
  {
    title: "New Olympic Barbells & Dumbbell Sets Arrived",
    content: "We have upgraded our free-weights area with brand new rubber-coated hex dumbbells up to 50kg and competition-grade Eleiko barbells.",
    category: "MAINTENANCE",
    priority: "NORMAL",
    isActive: true,
  },
  {
    title: "Weekend Powerlifting & Form Workshop",
    content: "Join Coach Alex this Saturday at 10:00 AM for an exclusive workshop on Squat, Bench, and Deadlift biomechanics. Free for all members!",
    category: "EVENT",
    priority: "HIGH",
    isActive: true,
  },
];

const getAllNotices = async (activeOnly = true) => {
  const count = await prisma.notice.count();
  if (count === 0) {
    for (const n of DEFAULT_NOTICES) {
      await prisma.notice.create({ data: n });
    }
  }

  const whereClause = activeOnly ? { isActive: true } : {};
  return await prisma.notice.findMany({
    where: whereClause,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
};

const createNotice = async (data: {
  title: string;
  content: string;
  category?: string;
  priority?: string;
}) => {
  return await prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      category: data.category || "GENERAL",
      priority: data.priority || "NORMAL",
      isActive: true,
    },
  });
};

const updateNotice = async (
  id: string,
  data: Partial<{
    title: string;
    content: string;
    category: string;
    priority: string;
    isActive: boolean;
  }>
) => {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) throw new AppError(status.NOT_FOUND, "Notice not found");

  return await prisma.notice.update({
    where: { id },
    data,
  });
};

const deleteNotice = async (id: string) => {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) throw new AppError(status.NOT_FOUND, "Notice not found");

  return await prisma.notice.delete({ where: { id } });
};

export const NoticeService = {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
