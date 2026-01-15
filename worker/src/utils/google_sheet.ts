import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
const prismaClient = new PrismaClient();
export async function appendRow(userId : string,metadata: any) {
  console.log("hi");
  const creds = await prismaClient.googleCredentials.findFirst({ where: { userId } });
  console.log(creds);
  
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
  console.log("hi 1");
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });
  console.log(metadata);

  await sheets.spreadsheets.values.append({
    spreadsheetId: metadata.spreadsheetId, // Make sure this is in your .env
    range: metadata.sheetName,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [metadata.values],
    },
  });

  console.log("✅ Row appended");
}

