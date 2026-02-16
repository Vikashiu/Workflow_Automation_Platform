import { DataMapperInput, PreviousStep } from "./DataMapperInput";
import { useEffect, useState } from "react";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { Input } from "./Input";

export const NotionSelector = ({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) => {
    const [databaseId, setDatabaseId] = useState("");
    const [pageContent, setPageContent] = useState("");

    useEffect(() => {
        // Here you could fetch available databases if you implemented that endpoint
    }, []);

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg flex items-center justify-between border border-purple-100">
                <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" className="w-8 h-8 object-contain" alt="Notion" />
                    <div>
                        <h3 className="font-medium text-gray-900">Connect Notion</h3>
                        <p className="text-xs text-gray-500">Grant access to your workspace</p>
                    </div>
                </div>
                <PrimaryButton onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        alert("You must be logged in first!");
                        return;
                    }
                    alert("Please implement Auth redirect in backend specific for frontend button");

                }} size="small">Connect</PrimaryButton>
            </div>

            <Input
                label="Database ID"
                placeholder="Ex. 668d6b... (From Notion URL)"
                onChange={(e) => setDatabaseId(e.target.value)}
                type="text"
            />

            <DataMapperInput
                label="Page Content (Title)"
                placeholder="New Task: {{trigger.body}}"
                value={pageContent}
                onChange={setPageContent}
                previousSteps={previousSteps}
            />

            <PrimaryButton onClick={() => {
                setMetadata({
                    databaseId,
                    content: pageContent
                });
            }}>Save Configuration</PrimaryButton>
        </div>
    );
}
