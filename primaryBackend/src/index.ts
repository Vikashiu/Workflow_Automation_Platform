import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes";
import zapRouter from "./routes/zapRoutes";
import { triggerRouter } from "./routes/triggerRoutes";
import { actionRouter } from "./routes/actionRoutes";
import { oauth2callbackRouter } from "./routes/oauth2callbackRouter";
import { notionOauth } from "./routes/notionOauth";
import { googleApiRoute } from "./routes/googleApiRoutes";
import { authMiddleware } from "./authMiddleware";

require("dotenv").config();

const { google } = require("googleapis");

const app = express();

app.use(express.json());
app.use(cors());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/oauth2callback", oauth2callbackRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/zap", zapRouter);
app.use("/api/v1/trigger", triggerRouter);
app.use("/api/v1/action", actionRouter);
app.use("/api/oauth/notion", notionOauth);
app.use("/api/v1/google", googleApiRoute);

// ─── Google OAuth URL generation ─────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.get("/auth", authMiddleware, (req: any, res: any) => {
  const userId = req.id;
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
    state: JSON.stringify({ userId }),
  });
  res.json({ url });
});

// ─── Global error handler (keeps Express from crashing on route errors) ───────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled Express error:", err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Process-level crash guards ───────────────────────────────────────────────
// These prevent the server from exiting on unhandled errors
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception (server kept alive):", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection (server kept alive):", reason);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Primary backend listening on port ${PORT}`);
});