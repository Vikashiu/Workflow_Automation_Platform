export type FieldType = "text" | "textarea" | "number" | "password";

export interface FieldSchema {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
}

export const ActionInputSchemas: Record<string, FieldSchema[]> = {
    Slack: [
        { key: "webhookUrl", label: "Slack Webhook URL", type: "text", required: true, placeholder: "https://hooks.slack.com/services/..." },
        { key: "message", label: "Message", type: "textarea", required: true, placeholder: "Hello world" },
    ],
    Discord: [
        { key: "webhookUrl", label: "Discord Webhook URL", type: "text", required: true, placeholder: "https://discord.com/api/webhooks/..." },
        { key: "content", label: "Message Content", type: "textarea", required: true },
    ],
    email: [
        { key: "email", label: "Send To (Email)", type: "text", required: true, placeholder: "user@example.com" },
        { key: "subject", label: "Subject", type: "text", required: true },
        { key: "body", label: "Email Body", type: "textarea", required: true },
    ],
    Gemini: [
        { key: "prompt", label: "Prompt / Instructions", type: "textarea", required: true, helpText: "You can use {{variables}} from previous steps." },
    ],
    // Note: Integrations like Google Calendar / Sheets or Notion that require dynamic OAuth-based dropdowns
    // can either use advanced schemas (e.g., dynamic "select" field type mapped to backend endpoints)
    // or fall back to custom frontend selectors. For now, we will use this loosely-coupled schema for standard ones.
};
