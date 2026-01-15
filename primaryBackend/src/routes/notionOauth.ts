import { Router } from "express";
import { PrismaClient } from "@prisma/client";
const { v4: uuidv4 } = require("uuid");
const app = Router();
const prisma = new PrismaClient();

require("dotenv").config();

app.get('/', (req, res) => {

  const redirect_uri = process.env.NOTION_REDIRECT_URI;
  const client_id = process.env.NOTION_CLIENT_ID;
  const state = uuidv4();
  const url = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&state=${state}`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;

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

  const data = await response.json(); // Contains access_token, workspace_id, bot_id, etc.

  const {
    access_token,
    workspace_id,
    workspace_name,
    bot_id,
    duplicated_template_id, // optional
    owner
} = data;

    const currentUserId =  "1"; // replace this!

    await prisma.notionCredential.upsert({
    where: { userId: currentUserId },
    update: {
        accessToken: access_token,
        botId: bot_id,
        workspaceId: workspace_id,
        workspaceName: workspace_name,
    },
    create: {
        userId: currentUserId,
        accessToken: access_token,
        botId: bot_id,
        workspaceId: workspace_id,
        workspaceName: workspace_name,
    },
    });

  // Save the token to DB per user
  console.log("✅ Notion token received:", data);

  // Redirect user to dashboard
  res.redirect('/dashboard');
})

export const notionOauth = app;