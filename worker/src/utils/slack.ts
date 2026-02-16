
import axios from "axios";

export async function sendSlackMessage(webhookUrl: string, message: string) {
    if (!webhookUrl) throw new Error("Slack Webhook URL is required");

    try {
        await axios.post(webhookUrl, {
            text: message
        });
        console.log(`Sent Slack message to ${webhookUrl}`);
        return true;
    } catch (e: any) {
        console.error("Failed to send Slack message", e.message);
        throw e;
    }
}
