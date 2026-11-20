import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const envVars = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@gym.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Admin@123",

  // Payment details
  BKASH_MERCHANT_NUMBER: process.env.BKASH_MERCHANT_NUMBER || "01XXXXXXXXXX",
  NAGAD_MERCHANT_NUMBER: process.env.NAGAD_MERCHANT_NUMBER || "01XXXXXXXXXX",
  BANK_NAME: process.env.BANK_NAME || "Dutch-Bangla Bank",
  BANK_ACCOUNT: process.env.BANK_ACCOUNT || "1234567890",
  BANK_ROUTING: process.env.BANK_ROUTING || "090261001",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,

  // Email
  EMAIL_SENDER: {
    SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT || "465",
    SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER || "",
    SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS || "",
    SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM || "noreply@gym.com",
  },
};