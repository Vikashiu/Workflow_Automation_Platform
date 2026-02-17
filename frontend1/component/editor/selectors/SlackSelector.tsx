import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

export function SlackSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [channel, setChannel] = useState("");
    const [message, setMessage] = useState("");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure Slack Message</h3>
            <div className="space-y-4">
                <Input label="Channel Name / ID" type="text" placeholder="e.g. #general or C12345" onChange={(e) => setChannel(e.target.value)} />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message Text</label>
                    <textarea
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm h-24 resize-none"
                        placeholder="Hello Team!..."
                        onChange={(e) => setMessage(e.target.value)}
                        value={message}
                    />
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={() => {
                    setMetadata({
                        channel,
                        message
                    })
                }}>Save Configuration</PrimaryButton>
            </div>
        </div>
    )
}
