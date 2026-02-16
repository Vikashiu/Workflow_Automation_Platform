
import { useState } from "react";

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export interface CustomDropdownProps {
    label: string;
    placeholder: string;
    options: string[];
    onSelect: (value: string) => void;
    selectedValue: string | null | undefined;
    isLoading: boolean;
}

export const CustomDropdown = ({ label, placeholder, options, onSelect, selectedValue, isLoading }: CustomDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const displayValue = selectedValue || placeholder;

    return (
        <div className="relative mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} <span className="text-red-500">*</span>
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading || !options.length}
                className={`w-full flex justify-between items-center bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-left text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${isOpen ? "ring-2 ring-purple-500/20 border-purple-500" : ""}`}
            >
                <span className={!selectedValue ? "text-gray-400" : ""}>{isLoading ? "Loading..." : displayValue}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 text-gray-500 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in origin-top">
                    <ul className="py-1">
                        {options.map((option: string) => (
                            <li
                                key={option}
                                onClick={() => { onSelect(option); setIsOpen(false); }}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-colors"
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
