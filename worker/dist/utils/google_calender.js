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
exports.createCalendarEvent = createCalendarEvent;
const googleapis_1 = require("googleapis");
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
function createCalendarEvent(userId, metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const creds = yield prismaClient.googleCredentials.findFirst({ where: { userId } });
        if (!creds) {
            throw new Error("No Google credentials found for user.");
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
        oauth2Client.setCredentials({
            access_token: creds.accessToken,
            refresh_token: creds.refreshToken,
        });
        const calendar = googleapis_1.google.calendar({ version: "v3", auth: oauth2Client });
        // Add fallback duration of +30 mins if end == start
        const startTime = new Date(metadata.start);
        let endTime = new Date(metadata.end);
        if (startTime.getTime() === endTime.getTime()) {
            endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 mins
        }
        yield calendar.events.insert({
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
    });
}
