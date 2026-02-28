import React from "react";
import { EmailSelector } from "./EmailSelector";
import { GoogleCalendarSelector } from "./GoogleCalendarSelector";
import { GoogleSheetSelector } from "./GoogleSheetSelector";
import { GeminiSelector } from "./GeminiSelector";
import { NotionSelector } from "./NotionSelector";
import { SlackSelector } from "./SlackSelector";
import { DiscordSelector } from "./DiscordSelector";
import { GoogleDriveSelector } from "./GoogleDriveSelector";

export const IntegrationSelectors: Record<string, React.FC<{ setMetadata: (metadata: any) => void }>> = {
    "email": EmailSelector,
    "Google Calender": GoogleCalendarSelector,
    "Google Sheet": GoogleSheetSelector,
    "Gemini": GeminiSelector,
    "Notion": NotionSelector,
    "Slack": SlackSelector,
    "Discord": DiscordSelector,
    "Google Drive": GoogleDriveSelector,
};
