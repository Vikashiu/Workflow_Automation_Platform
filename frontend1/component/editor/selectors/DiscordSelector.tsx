import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

export function DiscordSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [webhookUrl, setWebhookUrl] = useState("");
    const [content, setContent] = useState("");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure Discord Message</h3>
            <div className="space-y-4">
                <Input label="Webhook URL" type="text" placeholder="https://discord.com/api/webhooks/..." onChange={(e) => setWebhookUrl(e.target.value)} />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
                    <textarea
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm h-24 resize-none"
                        placeholder="Message to send to Discord..."
                        onChange={(e) => setContent(e.target.value)}
                        value={content}
                    />
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={() => {
                    setMetadata({
                        webhookUrl,
                        content
                    })
                }}>Save Configuration</PrimaryButton>
            </div>
        </div>
    )
}
