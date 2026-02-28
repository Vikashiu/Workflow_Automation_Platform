
"use client";
import { useState } from "react";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";
import { useToast } from "@/contexts/ToastContext";

export function EmailSelector({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success, error } = useToast();
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const handleSave = () => {
        if (!email.trim()) {
            error("Please enter a recipient email address.");
            return;
        }
        if (!subject.trim()) {
            error("Please enter an email subject.");
            return;
        }
        setMetadata({ email, subject, body });
        success("Email configuration saved!");
    };

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-sm text-purple-800 flex items-start gap-2">
                <span className="text-lg mt-0.5">📧</span>
                <span>Send an automated email. Use <code className="bg-purple-100 px-1 rounded">{"{{variables}}"}</code> from previous steps to personalise the message.</span>
            </div>

            <DataMapperInput
                label="Recipient Email"
                placeholder="recipient@example.com or {{trigger.email}}"
                value={email}
                onChange={setEmail}
                previousSteps={previousSteps}
            />

            <DataMapperInput
                label="Subject"
                placeholder="e.g. New lead: {{trigger.name}}"
                value={subject}
                onChange={setSubject}
                previousSteps={previousSteps}
            />

            <DataMapperInput
                label="Email Body"
                placeholder="Hi {{trigger.name}}, thanks for signing up!"
                value={body}
                onChange={setBody}
                previousSteps={previousSteps}
            />

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <div className="w-full sm:w-auto">
                    <PrimaryButton onClick={handleSave}>
                        Save Configuration
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
