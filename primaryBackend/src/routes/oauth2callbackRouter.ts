import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../authMiddleware";
const app = Router();
const prisma = new PrismaClient();
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.get("/" ,async (req, res) => {
  // const { code } = req.query;
  // const userId = "";
  const { code, state } = req.query;

  const { userId } = JSON.parse(state as string);
  const userIdStr = String(userId);
  // console.log(code);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("hi");
    console.log(tokens);
    await prisma.googleCredentials.upsert({
      where: { userId: userIdStr },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        userId: userIdStr,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });
    console.log("✅ Credentials saved for user:", userId);
    res.redirect(`${process.env.REDIRECT_URI_TO_FRONTEND}/editor`);
    // res.send("OAuth complete. Webhook registered. Check console.");
    } catch (error) {
      console.log("❌ Error in OAuth callback:", error);
      res.status(500).send("Authentication failed.");
    }
});

export const oauth2callbackRouter = app;