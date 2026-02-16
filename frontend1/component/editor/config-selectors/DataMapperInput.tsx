
import React, { useState, useRef, useEffect } from 'react';

// Structure of available data from previous steps
export interface AvailableField {
    key: string;
    label: string;
    example?: string;
}

export interface PreviousStep {
    stepId: string;
    stepName: string;
    icon?: string;
    fields: AvailableField[];
}

interface DataMapperInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    previousSteps?: PreviousStep[]; // Data from previous steps
}

export const DataMapperInput = ({ label, value, onChange, placeholder, previousSteps = [] }: DataMapperInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowPopover(false);
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const insertVariable = (variableKey: string) => {
        // Simple insertion at end for now, can be improved to insert at cursor
        const newValue = value + ` {{${variableKey}}}`;
        onChange(newValue);
        // Keep popover open for multiple insertions? Or close? Zapier keeps it open usually if you might add more.
        // Let's close for simplicity or keep if user wants to build a string.
        inputRef.current?.focus();
    };

    return (
        <div className="mb-4 relative" ref={containerRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {label}
            </label>

            <div className={`relative flex items-center border rounded-lg bg-white transition-all ${isFocused || showPopover ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-300'}`}>
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full px-3 py-2.5 text-sm text-gray-900 bg-transparent border-none focus:ring-0 placeholder:text-gray-400 rounded-lg"
                    placeholder={placeholder || "Enter text or insert data..."}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => {
                        setIsFocused(true);
                        // Optional: Open popover on focus like Zapier does sometimes
                        setShowPopover(true);
                    }}
                />

                {/* The "Insert Data" Button */}
                <button
                    onClick={() => setShowPopover(!showPopover)}
                    className="p-2 mr-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    title="Insert Data"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                </button>
            </div>

            {/* The "Insert Data" Popover */}
            {showPopover && previousSteps.length > 0 && (
                <div className="absolute z-50 right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Insert Data</span>
                        <button onClick={() => setShowPopover(false)} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        <div className="p-2 space-y-1">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full px-3 py-1.5 text-sm mb-2 border border-gray-200 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                            />

                            {previousSteps.map((step) => (
                                <div key={step.stepId} className="mb-2">
                                    <div className="px-2 py-1.5 flex items-center gap-2 text-sm font-semibold text-gray-800 bg-gray-50/50 rounded-md mb-1">
                                        {/* Icon placehoder */}
                                        <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[10px]">#</div>
                                        {step.stepName}
                                    </div>
                                    <div className="pl-4 space-y-0.5">
                                        {step.fields.map(field => (
                                            <button
                                                key={field.key}
                                                onClick={() => insertVariable(field.key)}
                                                className="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-md flex justify-between items-center group transition-colors"
                                            >
                                                <span>{field.label}</span>
                                                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">{field.example || "No data"}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
