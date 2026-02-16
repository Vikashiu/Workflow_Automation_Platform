
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import { CustomDropdown } from "./CustomDropdown";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";

interface Sheet {
    id: string;
    name: string;
}

export function GoogleSheetSelector({ setMetadata, previousSteps }: {
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success, error } = useToast();
    const [spreadsheets, setSpreadsheets] = useState<Sheet[]>([]);
    const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Sheet | null>(null);

    const [worksheets, setWorksheets] = useState<string[]>([]);
    const [selectedWorksheet, setSelectedWorksheet] = useState<string | null>(null);

    const [columns, setColumns] = useState<string[]>([]);
    const [columnValues, setColumnValues] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState({ spreadsheets: false, worksheets: false, columns: false });

    useEffect(() => {
        setLoading(prev => ({ ...prev, spreadsheets: true }));
        api.get<{ sheets: Sheet[] }>(API_ROUTES.GOOGLE.SHEETS)
            .then(res => setSpreadsheets(res.sheets))
            .catch(err => {
                console.error("Failed to fetch spreadsheets:", err);
                error("Failed to fetch spreadsheets");
            })
            .then(() => {
                setLoading(prev => ({ ...prev, spreadsheets: false }));
            });
    }, []);

    useEffect(() => {
        if (selectedSpreadsheet) {
            setWorksheets([]);
            setSelectedWorksheet(null);
            setColumns([]);
            setColumnValues({});
            setLoading(prev => ({ ...prev, worksheets: true }));
            api.get<{ worksheets: string[] }>(`${API_ROUTES.GOOGLE.SHEETS}/${selectedSpreadsheet.id}/worksheets`)
                .then(res => setWorksheets(res.worksheets))
                .catch(err => {
                    console.error("Failed to fetch worksheets:", err);
                    error("Failed to fetch worksheets");
                })
                .then(() => {
                    setLoading(prev => ({ ...prev, worksheets: false }));
                });
        }
    }, [selectedSpreadsheet]);

    useEffect(() => {
        if (selectedSpreadsheet && selectedWorksheet) {
            setColumns([]);
            setColumnValues({});
            setLoading(prev => ({ ...prev, columns: true }));
            api.get<{ columns: string[] }>(`${API_ROUTES.GOOGLE.SHEETS}/${selectedSpreadsheet.id}/worksheets/${encodeURIComponent(selectedWorksheet)}/columns`)
                .then(res => setColumns(res.columns))
                .catch(err => {
                    console.error("Failed to fetch columns:", err);
                    error("Failed to fetch columns");
                })
                .then(() => {
                    setLoading(prev => ({ ...prev, columns: false }));
                });
        }
    }, [selectedSpreadsheet, selectedWorksheet]);

    const handleColumnChange = (column: string, value: string) => {
        setColumnValues(prev => ({ ...prev, [column]: value }));
    };

    const handleSave = () => {
        setMetadata({
            spreadsheetId: selectedSpreadsheet?.id,
            sheetName: selectedWorksheet,
            values: columns.map(col => columnValues[col] || "")
        })
        success("Configuration saved!");
    };

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 mb-2">
                Add a new row to a Google Sheet.
            </div>

            <CustomDropdown
                label="Select Spreadsheet"
                placeholder="Choose spreadsheet..."
                options={spreadsheets.map(s => s.name)}
                selectedValue={selectedSpreadsheet?.name}
                onSelect={(name: string) => setSelectedSpreadsheet(spreadsheets.find(s => s.name === name) || null)}
                isLoading={loading.spreadsheets}
            />

            {selectedSpreadsheet && (
                <CustomDropdown
                    label="Select Worksheet"
                    placeholder="Choose worksheet..."
                    options={worksheets}
                    selectedValue={selectedWorksheet}
                    onSelect={setSelectedWorksheet}
                    isLoading={loading.worksheets}
                />
            )}

            {selectedWorksheet && loading.columns && (
                <div className="flex items-center space-x-2 text-sm text-purple-600 py-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading columns...</span>
                </div>
            )}

            {columns.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                    <h4 className="font-semibold mb-4 text-gray-800 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs mr-2">3</span>
                        Map Columns
                    </h4>
                    <div className="space-y-4">
                        {columns.map(col => (
                            <div key={col}>
                                <DataMapperInput
                                    label={col}
                                    placeholder={`Enter value for ${col}`}
                                    value={columnValues[col] || ""}
                                    onChange={(val) => handleColumnChange(col, val)}
                                    previousSteps={previousSteps}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <div className="w-full sm:w-auto">
                    <PrimaryButton
                        onClick={handleSave}
                    >
                        Save Configuration
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}
