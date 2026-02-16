
import React, { useState } from "react";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { useToast } from "@/contexts/ToastContext";

export function SlackSelector({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success } = useToast();
    const [webhookUrl, setWebhookUrl] = useState("");
    const [message, setMessage] = useState("");

    const handleSave = () => {
        setMetadata({
            webhookUrl,
            message
        });
        success("Slack configuration saved!");
    };

    return (
        <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg flex items-center justify-between border border-emerald-100">
                <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" className="w-8 h-8 object-contain" alt="Slack" />
                    <div>
                        <h3 className="font-medium text-gray-900">Slack Webhook</h3>
                        <p className="text-xs text-gray-500">Send messages to Slack via Webhook</p>
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
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Go to Slack App Settings &gt; Incoming Webhooks to get this URL.</p>
                </div>

                <DataMapperInput
                    label="Message Text"
                    placeholder="Hello Team! New lead: {{trigger.email}}"
                    value={message}
                    onChange={setMessage}
                    previousSteps={previousSteps}
                />
            </div>

            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={handleSave}>Save Configuration</PrimaryButton>
            </div>
        </div>
    );
}
