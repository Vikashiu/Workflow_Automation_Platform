import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const { v4: uuidv4 } = require("uuid");
const app = Router();
import { authMiddleware } from "../authMiddleware";
const prisma = new PrismaClient();

require("dotenv").config();

app.get('/', authMiddleware, (req, res) => {
  // @ts-ignore
  const userId = req.id;
  const redirect_uri = process.env.NOTION_REDIRECT_URI;
  const client_id = process.env.NOTION_CLIENT_ID;
  const state = JSON.stringify({ userId }); // Pass userId in state
  const url = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&state=${state}`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // Retrieve userId from state
  const { userId } = JSON.parse(state as string);

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI
    })
  });

  const data = await response.json();

  const {
    access_token,
    workspace_id,
    workspace_name,
    bot_id,
  } = data;

  if (!userId) {
    res.status(400).send("User ID missing in state");
    return;
  }

  await prisma.notionCredential.upsert({
    where: { userId: userId.toString() },
    update: {
      accessToken: access_token,
      botId: bot_id,
      workspaceId: workspace_id,
      workspaceName: workspace_name,
    },
    create: {
      userId: userId.toString(),
      accessToken: access_token,
      botId: bot_id,
      workspaceId: workspace_id,
      workspaceName: workspace_name,
    },
  });

  console.log("✅ Notion token received for user:", userId);
  res.redirect('http://localhost:3001/dashboard'); // Redirect to frontend dashboard (adjust port if needed)
})

export const notionOauth = app;