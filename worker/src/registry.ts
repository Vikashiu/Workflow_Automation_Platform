import { sendEmail } from "./utils/email";
import { appendRow } from "./utils/google_sheet";
import { createCalendarEvent } from "./utils/google_calender";
import { appendNotionRow } from "./utils/notion";
import { generateGeminiContent } from "./utils/gemini";
import { sendSlackMessage } from "./utils/slack";
import { sendDiscordMessage } from "./utils/discord";
import { uploadFileToDrive } from "./utils/google_drive";

export interface ActionPlugin {
    id: string; // The actionTypeId from the database
    execute: (metadata: any, userId: string) => Promise<any>;
}

export const ActionRegistry = new Map<string, ActionPlugin>();

function registerPlugin(plugin: ActionPlugin) {
    ActionRegistry.set(plugin.id, plugin);
}

// 1. Slack
registerPlugin({
    id: "Slack",
    execute: async (metadata, _userId) => {
        console.log("💬 Sending Slack message");
        const { webhookUrl, message } = metadata;
        await sendSlackMessage(webhookUrl as string, message as string);
    }
});

// 2. Discord
registerPlugin({
    id: "Discord",
    execute: async (metadata, _userId) => {
        console.log("🎮 Sending Discord message");
        const { webhookUrl, content } = metadata;
        await sendDiscordMessage(webhookUrl as string, content as string);
    }
});

// 3. Email
registerPlugin({
    id: "email",
    execute: async (metadata, _userId) => {
        console.log("📧 Sending email");
        const { email, subject, body } = metadata;
        await sendEmail({ email, body, subject } as any);
    }
});

// 4. Google Sheet
registerPlugin({
    id: "Google Sheet",
    execute: async (metadata, userId) => {
        console.log("📊 Appending to Google Sheet");
        await appendRow(userId, metadata);
    }
});

// 5. Google Calendar
registerPlugin({
    id: "Google_Calendar",
    execute: async (metadata, userId) => {
        console.log("📅 Creating Google Calendar event");
        await createCalendarEvent(userId, metadata as any);
    }
});

// 6. Notion
registerPlugin({
    id: "Notion",
    execute: async (metadata, userId) => {
        console.log("📝 Creating Notion page");
        await appendNotionRow(userId, metadata);
    }
});

// 7. Gemini
registerPlugin({
    id: "Gemini",
    execute: async (metadata, _userId) => {
        console.log("🤖 Generating Gemini content");
        return await generateGeminiContent(metadata.prompt);
    }
});

// 8. Google Drive
registerPlugin({
    id: "Google Drive",
    execute: async (metadata, userId) => {
        console.log("☁️  Uploading file to Google Drive");
        return await uploadFileToDrive(userId, metadata);
    }
});
