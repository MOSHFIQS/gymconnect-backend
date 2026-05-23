import bcrypt from "bcryptjs";
import { envVars } from "../config/env.js";
import { Role } from "../../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";

export const seedAdmin = async () => {
  const existing = await prisma.user.findUnique({
    where: { email: envVars.ADMIN_EMAIL },
  });

  if (!existing) {
    const hashed = await bcrypt.hash(
      envVars.ADMIN_PASSWORD,
      envVars.BCRYPT_SALT_ROUNDS
    );
    await prisma.user.create({
      data: {
        email: envVars.ADMIN_EMAIL,
        password: hashed,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Admin seeded: ${envVars.ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${envVars.ADMIN_EMAIL}`);
  }
};