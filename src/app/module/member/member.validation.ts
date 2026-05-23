import { z } from "zod";
import { Gender, MembershipPlan } from "../../../generated/prisma/enums.js";

export const createMemberSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date of birth",
  }),
  address: z.string().min(5, "Address is required"),
  membershipPlan: z.nativeEnum(MembershipPlan),
  joiningDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid joining date",
  }),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
});

export const updateMemberSchema = createMemberSchema.partial();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;