
import React, { useState } from 'react';
import { DataMapperInput, PreviousStep } from './DataMapperInput';
import { PrimaryButton } from "../../buttons/PrimaryButton";

export const GeminiSelector = ({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) => {
    const [prompt, setPrompt] = useState("");

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" className="w-8 h-8 object-contain" alt="Gemini" />
                    <div>
                        <h3 className="font-medium text-gray-900">Google Gemini</h3>
                        <p className="text-xs text-gray-500">Generate content with AI</p>
                    </div>
                </div>
            </div>

            <DataMapperInput
                label="Prompt"
                placeholder="Ex. Summarize this text: {{trigger.body}}"
                value={prompt}
                onChange={setPrompt}
                previousSteps={previousSteps}
            />

            <PrimaryButton onClick={() => {
                setMetadata({
                    prompt
                });
            }}>Save Configuration</PrimaryButton>
        </div>
    );
}
