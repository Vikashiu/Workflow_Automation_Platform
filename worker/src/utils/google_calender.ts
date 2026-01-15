import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export async function createCalendarEvent(userId: string, metadata: any) {
  const creds = await prismaClient.googleCredentials.findFirst({ where: { userId } });

  if (!creds) {
    throw new Error("No Google credentials found for user.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Add fallback duration of +30 mins if end == start
const startTime = new Date(metadata.start);
let endTime = new Date(metadata.end);

if (startTime.getTime() === endTime.getTime()) {
  endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 mins
}

await calendar.events.insert({
  calendarId: "primary",
  requestBody: {
    summary: metadata.title,
    description: metadata.description || "",
    location: metadata.location || "",
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "Asia/Kolkata",
    },
  },
});

  console.log("📅 Calendar event created!");
}

