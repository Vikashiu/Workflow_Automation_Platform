import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

export function NotionSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [databaseId, setDatabaseId] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure Notion Page</h3>
            <div className="space-y-4">
                <Input label="Database ID" type="text" placeholder="e.g. 1a2b3c..." onChange={(e) => setDatabaseId(e.target.value)} />
                <Input label="Page Title" type="text" placeholder="New Page Title" onChange={(e) => setTitle(e.target.value)} />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content (Markdown)</label>
                    <textarea
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm h-32 resize-none"
                        placeholder="Page content in markdown..."
                        onChange={(e) => setContent(e.target.value)}
                        value={content}
                    />
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={() => {
                    setMetadata({
                        databaseId,
                        title,
                        content
                    })
                }}>Save Configuration</PrimaryButton>
            </div>
        </div>
    )
}
