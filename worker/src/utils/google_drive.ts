import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import * as stream from "stream";

const prismaClient = new PrismaClient();

/**
 * Uploads a file to a specific Google Drive folder.
 *
 * @param userId  The platform user ID (used to look up stored Google credentials).
 * @param metadata  Action metadata from the workflow definition:
 *   - fileName:     Name to give the uploaded file.
 *   - fileContent:  The actual text/string content to upload (e.g., email body, data).
 *   - mimeType:     MIME type of the file (default: "text/plain").
 *   - folderId:     The Google Drive folder ID to upload into.
 *   - folderName:   (optional) Human-readable folder name for logging.
 */
export async function uploadFileToDrive(userId: string, metadata: any) {
    const creds = await prismaClient.googleCredentials.findFirst({ where: { userId } });

    if (!creds || !creds.accessToken || !creds.refreshToken) {
        throw new Error("No valid Google credentials found for user.");
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

    // Auto-refresh token and persist new access token
    oauth2Client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
            console.log("🔄 Google access token refreshed for Drive upload.");
            await prismaClient.googleCredentials.update({
                where: { userId },
                data: { accessToken: tokens.access_token },
            });
        }
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const fileName = metadata.fileName || `zapclone_file_${Date.now()}.txt`;
    const fileContent = metadata.fileContent || "";
    const mimeType = metadata.mimeType || "text/plain";
    const folderId = metadata.folderId || undefined; // Upload to root if no folder

    // Convert the string content into a readable stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(fileContent, "utf-8"));

    const fileMetadata: any = {
        name: fileName,
    };

    // If a specific folder is selected, parent it there
    if (folderId) {
        fileMetadata.parents = [folderId];
    }

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: {
            mimeType,
            body: bufferStream,
        },
        fields: "id, name, webViewLink",
    });

    const file = response.data;
    console.log(`✅ File uploaded to Drive: "${file.name}" (id: ${file.id})`);
    console.log(`   📎 View at: ${file.webViewLink}`);

    return {
        fileId: file.id,
        fileName: file.name,
        webViewLink: file.webViewLink,
    };
}
