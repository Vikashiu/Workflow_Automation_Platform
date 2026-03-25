import { Router } from "express";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

/**
 * GET /oauth2callback
 * Google redirects here after the user grants/denies permission.
 * We exchange the one-time `code` for access + refresh tokens and
 * persist them in the DB against the userId carried in `state`.
 */
router.get("/", async (req: any, res: any) => {
  const code = req.query.code as string | undefined;
  const stateRaw = req.query.state as string | undefined;

  if (!code) {
    return res.status(400).json({ message: "Missing authorization code." });
  }

  let userId: string | undefined;
  try {
    if (stateRaw) {
      const parsed = JSON.parse(stateRaw);
      userId = parsed.userId ? String(parsed.userId) : undefined;
    }
  } catch {
    return res.status(400).json({ message: "Invalid state parameter." });
  }

  if (!userId) {
    return res.status(400).json({ message: "Missing userId in state." });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    await prisma.googleCredentials.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? undefined,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        userId,
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? "",
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    // Redirect back to the frontend dashboard
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (err: any) {
    console.error("❌ OAuth2 callback error:", err?.message || err);
    return res.status(500).json({ message: "Failed to exchange OAuth code." });
  }
});

export const oauth2callbackRouter = router;
