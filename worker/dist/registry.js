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
exports.ActionRegistry = void 0;
const email_1 = require("./utils/email");
const google_sheet_1 = require("./utils/google_sheet");
const google_calender_1 = require("./utils/google_calender");
const notion_1 = require("./utils/notion");
const gemini_1 = require("./utils/gemini");
const slack_1 = require("./utils/slack");
const discord_1 = require("./utils/discord");
const google_drive_1 = require("./utils/google_drive");
exports.ActionRegistry = new Map();
function registerPlugin(plugin) {
    exports.ActionRegistry.set(plugin.id, plugin);
}
// 1. Slack
registerPlugin({
    id: "Slack",
    execute: (metadata, _userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("💬 Sending Slack message");
        const { webhookUrl, message } = metadata;
        yield (0, slack_1.sendSlackMessage)(webhookUrl, message);
    })
});
// 2. Discord
registerPlugin({
    id: "Discord",
    execute: (metadata, _userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("🎮 Sending Discord message");
        const { webhookUrl, content } = metadata;
        yield (0, discord_1.sendDiscordMessage)(webhookUrl, content);
    })
});
// 3. Email
registerPlugin({
    id: "email",
    execute: (metadata, _userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("📧 Sending email");
        const { email, subject, body } = metadata;
        yield (0, email_1.sendEmail)({ email, body, subject });
    })
});
// 4. Google Sheet
registerPlugin({
    id: "Google Sheet",
    execute: (metadata, userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("📊 Appending to Google Sheet");
        yield (0, google_sheet_1.appendRow)(userId, metadata);
    })
});
// 5. Google Calendar
registerPlugin({
    id: "Google_Calendar",
    execute: (metadata, userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("📅 Creating Google Calendar event");
        yield (0, google_calender_1.createCalendarEvent)(userId, metadata);
    })
});
// 6. Notion
registerPlugin({
    id: "Notion",
    execute: (metadata, userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("📝 Creating Notion page");
        yield (0, notion_1.appendNotionRow)(userId, metadata);
    })
});
// 7. Gemini
registerPlugin({
    id: "Gemini",
    execute: (metadata, _userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("🤖 Generating Gemini content");
        return yield (0, gemini_1.generateGeminiContent)(metadata.prompt);
    })
});
// 8. Google Drive
registerPlugin({
    id: "Google Drive",
    execute: (metadata, userId) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("☁️  Uploading file to Google Drive");
        return yield (0, google_drive_1.uploadFileToDrive)(userId, metadata);
    })
});
