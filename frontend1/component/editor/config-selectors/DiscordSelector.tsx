
import React, { useState } from "react";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { useToast } from "@/contexts/ToastContext";

export function DiscordSelector({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success } = useToast();
    const [webhookUrl, setWebhookUrl] = useState("");
    const [content, setContent] = useState("");

    const handleSave = () => {
        setMetadata({
            webhookUrl,
            content
        });
        success("Discord configuration saved!");
    };

    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg flex items-center justify-between border border-indigo-100">
                <div className="flex items-center gap-3">
                    <img src="https://assets-global.website-files.com/6257adef93867e56f84d3092/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" className="w-8 h-8 object-contain" alt="Discord" />
                    <div>
                        <h3 className="font-medium text-gray-900">Discord Webhook</h3>
                        <p className="text-xs text-gray-500">Send messages to Discord Channel</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Webhook URL <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Server Settings &gt; Integrations &gt; Webhooks</p>
                </div>

                <DataMapperInput
                    label="Message Content"
                    placeholder="User signed up: {{trigger.email}}"
                    value={content}
                    onChange={setContent}
                    previousSteps={previousSteps}
                />
            </div>

            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={handleSave}>Save Configuration</PrimaryButton>
            </div>
        </div>
    );
}
