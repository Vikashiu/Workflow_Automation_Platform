"use client";

import { PrimaryButton } from "@/component/buttons/PrimaryButton";
import { useState } from "react";
import { Input } from "../Input";

type CalendarEventMetadata = {
    title: string;
    description: string;
    location: string;
    start: string;
    end: string;
};

export function GoogleCalendarSelector({
    setMetadata,
}: {
    setMetadata: (params: CalendarEventMetadata) => void;
}) {
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");

    const getOffset = () => {
        const offset = new Date().getTimezoneOffset(); // in minutes
        const absOffset = Math.abs(offset);
        const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        const minutes = String(absOffset % 60).padStart(2, "0");
        const sign = offset <= 0 ? "+" : "-";
        return `${sign}${hours}:${minutes}`;
    };

    const handleSubmit = () => {
        if (!start || !end || !title) {
            alert("Please fill in the title, start time, and end time.");
            return;
        }

        const offset = getOffset(); // e.g., "+05:30"
        const startWithOffset = `${start}${offset}`;
        const endWithOffset = `${end}${offset}`;

        const metadata: CalendarEventMetadata = {
            title,
            location,
            description,
            start: startWithOffset,
            end: endWithOffset,
        };

        setMetadata(metadata);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Configure Event</h3>

            <div className="space-y-4">
                <Input label="Event Title" placeholder="e.g., Weekly Sync" onChange={(e) => setTitle(e.target.value)} value={title} />
                <Input label="Location" placeholder="e.g., Google Meet" onChange={(e) => setLocation(e.target.value)} value={location} />

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder="Event details..."
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time *</label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <PrimaryButton onClick={handleSubmit}>Save Configuration</PrimaryButton>
            </div>
        </div>
    );
}
