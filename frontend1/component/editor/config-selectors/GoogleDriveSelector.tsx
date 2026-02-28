"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import { CustomDropdown } from "./CustomDropdown";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";
import { PrimaryButton } from "../../buttons/PrimaryButton";

interface DriveFolder {
    id: string;
    name: string;
}

const MIME_TYPES = [
    { label: "Plain Text (.txt)", value: "text/plain" },
    { label: "CSV (.csv)", value: "text/csv" },
    { label: "HTML (.html)", value: "text/html" },
    { label: "JSON (.json)", value: "application/json" },
    { label: "Markdown (.md)", value: "text/markdown" },
];

export function GoogleDriveSelector({
    setMetadata,
    previousSteps,
}: {
    setMetadata: (metadata: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success, error } = useToast();

    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
    const [loadingFolders, setLoadingFolders] = useState(false);

    const [fileName, setFileName] = useState("");
    const [fileContent, setFileContent] = useState("");
    const [mimeType, setMimeType] = useState("text/plain");

    // Fetch user's Drive folders on mount
    useEffect(() => {
        setLoadingFolders(true);
        api.get<{ folders: DriveFolder[] }>(API_ROUTES.GOOGLE.DRIVE_FOLDERS)
            .then((res) => setFolders(res.folders))
            .catch((err) => {
                console.error("Failed to fetch Drive folders:", err);
                error("Failed to fetch Google Drive folders. Make sure you have connected your Google account.");
            })
            .finally(() => setLoadingFolders(false));
    }, []);

    const handleSave = () => {
        if (!fileName.trim()) {
            error("Please enter a file name.");
            return;
        }
        if (!fileContent.trim()) {
            error("Please enter the file content or use a dynamic field from a previous step.");
            return;
        }

        setMetadata({
            folderId: selectedFolder?.id || "root",
            folderName: selectedFolder?.name || "My Drive (root)",
            fileName: fileName.trim(),
            fileContent: fileContent.trim(),
            mimeType,
        });

        success("Google Drive configuration saved!");
    };

    const selectedMimeLabel = MIME_TYPES.find((m) => m.value === mimeType)?.label;

    return (
        <div className="space-y-5">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <span className="text-lg mt-0.5">☁️</span>
                <span>
                    Upload a file to <strong>Google Drive</strong>. Use dynamic fields from previous
                    steps (e.g., <code className="bg-blue-100 px-1 rounded">{"{{subject}}"}</code>)
                    to set the file name or content.
                </span>
            </div>

            {/* Step 1: Select Folder */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        1
                    </span>
                    <span className="font-medium text-gray-800 text-sm">Destination Folder</span>
                </div>
                <CustomDropdown
                    label="Select Folder"
                    placeholder="Choose a Google Drive folder..."
                    options={folders.map((f) => f.name)}
                    selectedValue={selectedFolder?.name}
                    onSelect={(name: string) =>
                        setSelectedFolder(folders.find((f) => f.name === name) || null)
                    }
                    isLoading={loadingFolders}
                />
            </div>

            {/* Step 2: File Name */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        2
                    </span>
                    <span className="font-medium text-gray-800 text-sm">File Name</span>
                </div>
                <DataMapperInput
                    label="File Name"
                    placeholder="e.g. invoice_{{sender}}.txt"
                    value={fileName}
                    onChange={setFileName}
                    previousSteps={previousSteps}
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">
                    Tip: You can use dynamic fields like{" "}
                    <code className="bg-gray-100 px-1 rounded">{"{{subject}}"}</code> to name files
                    automatically.
                </p>
            </div>

            {/* Step 3: File Type */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        3
                    </span>
                    <span className="font-medium text-gray-800 text-sm">File Type</span>
                </div>
                <CustomDropdown
                    label="Select File Type"
                    placeholder="Choose file type..."
                    options={MIME_TYPES.map((m) => m.label)}
                    selectedValue={selectedMimeLabel}
                    onSelect={(label: string) => {
                        const found = MIME_TYPES.find((m) => m.label === label);
                        if (found) setMimeType(found.value);
                    }}
                    isLoading={false}
                />
            </div>

            {/* Step 4: File Content */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        4
                    </span>
                    <span className="font-medium text-gray-800 text-sm">File Content</span>
                </div>
                <DataMapperInput
                    label="File Content"
                    placeholder="Enter content or use {{variables}} from previous steps"
                    value={fileContent}
                    onChange={setFileContent}
                    previousSteps={previousSteps}
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">
                    Example:{" "}
                    <code className="bg-gray-100 px-1 rounded">
                        {"From: {{from}}\\nSubject: {{subject}}\\n\\n{{body}}"}
                    </code>
                </p>
            </div>

            {/* Save */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <div className="w-full sm:w-auto">
                    <PrimaryButton onClick={handleSave}>Save Configuration</PrimaryButton>
                </div>
            </div>
        </div>
    );
}
