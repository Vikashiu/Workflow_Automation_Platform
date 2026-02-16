
import axios from "axios";

export async function sendDiscordMessage(webhookUrl: string, content: string) {
    if (!webhookUrl) throw new Error("Discord Webhook URL is required");

    try {
        await axios.post(webhookUrl, {
            content: content
        });
        console.log(`Sent Discord message to ${webhookUrl}`);
        return true;
    } catch (e: any) {
        console.error("Failed to send Discord message", e.message);
        throw e;
    }
}
