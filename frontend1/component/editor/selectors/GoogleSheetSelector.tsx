"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { PrimaryButton } from "@/component/buttons/PrimaryButton";

// Simple UI Components
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;

interface CustomDropdownProps {
    label: string;
    placeholder: string;
    options: string[];
    onSelect: (value: string) => void;
    selectedValue: string | null | undefined;
    isLoading: boolean;
}

const CustomDropdown = ({ label, placeholder, options, onSelect, selectedValue, isLoading }: CustomDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const displayValue = selectedValue || placeholder;

    return (
        <div className="relative mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading || !options.length}
                className="w-full flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-left text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
                <span className="truncate">{isLoading ? "Loading..." : displayValue}</span>
                <ChevronDownIcon />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        <ul className="py-1">
                            {options.map((option: string) => (
                                <li
                                    key={option}
                                    onClick={() => { onSelect(option); setIsOpen(false); }}
                                    className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 cursor-pointer transition-colors"
                                >
                                    {option}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

interface Sheet { id: string; name: string; }

export function GoogleSheetSelector({ setMetadata }: {
    setMetadata: (params: any) => void;
}) {
    const [spreadsheets, setSpreadsheets] = useState<Sheet[]>([]);
    const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Sheet | null>(null);

    const [worksheets, setWorksheets] = useState<string[]>([]);
    const [selectedWorksheet, setSelectedWorksheet] = useState<string | null>(null);

    const [columns, setColumns] = useState<string[]>([]);
    const [columnValues, setColumnValues] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState({ spreadsheets: false, worksheets: false, columns: false });

    useEffect(() => {
        setLoading(prev => ({ ...prev, spreadsheets: true }));
        axios.get<any>(`${BACKEND_URL}/api/v1/google/sheets`, { headers: { "authorization": localStorage.getItem("token") } })
            .then(res => setSpreadsheets(res.data.sheets || []))
            .catch(err => console.error("Failed to fetch spreadsheets:", err))
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
            axios.get<any>(`${BACKEND_URL}/api/v1/google/sheets/${selectedSpreadsheet.id}/worksheets`, { headers: { "authorization": localStorage.getItem("token") } })
                .then(res => setWorksheets(res.data.worksheets || []))
                .catch(err => console.error("Failed to fetch worksheets:", err))
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
            axios.get<any>(`${BACKEND_URL}/api/v1/google/sheets/${selectedSpreadsheet.id}/worksheets/${encodeURIComponent(selectedWorksheet)}/columns`, { headers: { "authorization": localStorage.getItem("token") } })
                .then(res => setColumns(res.data.columns || []))
                .catch(err => console.error("Failed to fetch columns:", err))
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
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Configure Spreadsheet</h3>

            <CustomDropdown
                label="Spreadsheet"
                placeholder="Select a spreadsheet"
                options={spreadsheets.map(s => s.name)}
                selectedValue={selectedSpreadsheet?.name}
                onSelect={(name: string) => setSelectedSpreadsheet(spreadsheets.find(s => s.name === name) || null)}
                isLoading={loading.spreadsheets}
            />

            {selectedSpreadsheet && (
                <CustomDropdown
                    label="Worksheet"
                    placeholder="Select a worksheet"
                    options={worksheets}
                    selectedValue={selectedWorksheet}
                    onSelect={setSelectedWorksheet}
                    isLoading={loading.worksheets}
                />
            )}

            {selectedWorksheet && loading.columns && <div className="flex items-center gap-2 text-sm text-primary-600"><span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span> Loading columns...</div>}

            {columns.length > 0 && (
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="font-medium text-slate-800 dark:text-white mb-3 text-sm uppercase tracking-wide">Map Columns</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {columns.map(col => (
                            <div key={col}>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">{col}</label>
                                <input
                                    type="text"
                                    placeholder={`Value for ${col}`}
                                    onChange={(e) => handleColumnChange(col, e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <PrimaryButton
                    onClick={handleSave}
                    disabled={!selectedWorksheet || columns.length === 0}
                >
                    Save Configuration
                </PrimaryButton>
            </div>
        </div>
    );
}
