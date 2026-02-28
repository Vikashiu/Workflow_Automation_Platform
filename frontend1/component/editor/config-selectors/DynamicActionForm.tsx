import React, { useState } from "react";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { useToast } from "@/contexts/ToastContext";
import type { FieldSchema } from "@/lib/types";
import type { Action } from "@/type/editorsType";

export function DynamicActionForm({
    action,
    setMetadata,
    previousSteps = []
}: {
    action: Action;
    setMetadata: (params: any) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success } = useToast();

    // Initialize state with an empty object mapping field keys to their values
    const [values, setValues] = useState<Record<string, string>>({});

    const handleChange = (key: string, val: string) => {
        setValues(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        setMetadata(values);
        success(`${action.name} configuration saved!`);
    };

    if (!action.inputSchema || action.inputSchema.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500">
                No configuration needed for this action.
                <div className="mt-4">
                    <button onClick={() => setMetadata({})} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Save & Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg flex items-center justify-between border border-emerald-100 mb-6">
                <div className="flex items-center gap-3">
                    <img src={action.image} className="w-8 h-8 object-contain" alt={action.name} />
                    <div>
                        <h3 className="font-medium text-gray-900">{action.name}</h3>
                        <p className="text-xs text-gray-500">Automatically configured via ZapClone Schema</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {action.inputSchema.map((field: FieldSchema) => (
                    <div key={field.key}>
                        {field.type === "textarea" ? (
                            <DataMapperInput
                                label={field.label + (field.required ? " *" : "")}
                                placeholder={field.placeholder || ""}
                                value={values[field.key] || ""}
                                onChange={(val) => handleChange(field.key, val)}
                                previousSteps={previousSteps}
                            />
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type={field.type}
                                    value={values[field.key] || ""}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder || ""}
                                    className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                />
                                {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-6 flex justify-end border-t border-gray-100 mt-4">
                <PrimaryButton onClick={handleSave}>Save Configuration</PrimaryButton>
            </div>
        </div>
    );
}
