import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

export function GeminiSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [prompt, setPrompt] = useState("");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure AI Generation</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prompt</label>
                    <textarea
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm h-32 resize-none"
                        placeholder="Describe what you want the AI to generate..."
                        onChange={(e) => setPrompt(e.target.value)}
                        value={prompt}
                    />
                    <p className="text-xs text-slate-500 mt-1">You can use data from previous steps by typing their variables.</p>
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={() => {
                    setMetadata({
                        prompt
                    })
                }}>Save Configuration</PrimaryButton>
            </div>
        </div>
    )
}
