"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToDrive = uploadFileToDrive;
const googleapis_1 = require("googleapis");
const client_1 = require("@prisma/client");
const stream = __importStar(require("stream"));
const prismaClient = new client_1.PrismaClient();
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
function uploadFileToDrive(userId, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const creds = yield prismaClient.googleCredentials.findFirst({ where: { userId } });
        if (!creds || !creds.accessToken || !creds.refreshToken) {
            throw new Error("No valid Google credentials found for user.");
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
        oauth2Client.setCredentials({
            access_token: creds.accessToken,
            refresh_token: creds.refreshToken,
        });
        // Auto-refresh token and persist new access token
        oauth2Client.on("tokens", (tokens) => __awaiter(this, void 0, void 0, function* () {
            if (tokens.access_token) {
                console.log("🔄 Google access token refreshed for Drive upload.");
                yield prismaClient.googleCredentials.update({
                    where: { userId },
                    data: { accessToken: tokens.access_token },
                });
            }
        }));
        const drive = googleapis_1.google.drive({ version: "v3", auth: oauth2Client });
        const fileName = metadata.fileName || `zapclone_file_${Date.now()}.txt`;
        const fileContent = metadata.fileContent || "";
        const mimeType = metadata.mimeType || "text/plain";
        const folderId = metadata.folderId || undefined; // Upload to root if no folder
        // Convert the string content into a readable stream
        const bufferStream = new stream.PassThrough();
        bufferStream.end(Buffer.from(fileContent, "utf-8"));
        const fileMetadata = {
            name: fileName,
        };
        // If a specific folder is selected, parent it there
        if (folderId) {
            fileMetadata.parents = [folderId];
        }
        const response = yield drive.files.create({
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
    });
}
