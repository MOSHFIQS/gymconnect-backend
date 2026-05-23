import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import { IndexRoutes } from "./app/routes/index.js";
import { envVars } from "./app/config/env.js";

const app: Application = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        envVars.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5000",
        "http://localhost:5001",
      ];
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Static files (uploaded images) ──────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1", IndexRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Gym Management API is running",
    version: "1.0.0",
  });
});

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(globalErrorHandler);
app.use(notFound);

export default app;