"use strict";
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
exports.appendRow = appendRow;
const googleapis_1 = require("googleapis");
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
function appendRow(userId, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("hi");
        const creds = yield prismaClient.googleCredentials.findFirst({ where: { userId } });
        console.log(creds);
        if (!creds) {
            throw new Error("No Google credentials found for user.");
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
        oauth2Client.setCredentials({
            access_token: creds.accessToken,
            refresh_token: creds.refreshToken,
        });
        console.log("hi 1");
        const sheets = googleapis_1.google.sheets({ version: "v4", auth: oauth2Client });
        console.log(metadata);
        yield sheets.spreadsheets.values.append({
            spreadsheetId: metadata.spreadsheetId, // Make sure this is in your .env
            range: metadata.sheetName,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [metadata.values],
            },
        });
        console.log("✅ Row appended");
    });
}
