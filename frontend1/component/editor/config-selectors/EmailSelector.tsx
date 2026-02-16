
import { useState } from "react";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";

export function EmailSelector({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const [email, setEmail] = useState("");
    const [body, setBody] = useState("");

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 mb-2">
                Send an automated email to a specific recipient.
            </div>
            <DataMapperInput
                label={"Recipient Email"}
                placeholder="recipient@example.com"
                value={email}
                onChange={setEmail}
                previousSteps={previousSteps}
            />
            <DataMapperInput
                label={"Email Body"}
                placeholder="Enter your message here..."
                value={body}
                onChange={setBody}
                previousSteps={previousSteps}
            />

            <div className="pt-4 flex justify-end">
                <div className="w-full sm:w-auto">
                    <PrimaryButton onClick={() => {
                        setMetadata({ email, body })
                    }}>Save Configuration</PrimaryButton>
                </div>
            </div>
        </div>
    );
}
