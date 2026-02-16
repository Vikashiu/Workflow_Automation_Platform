"use client";
import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { PrimaryButton } from "../../buttons/PrimaryButton";
import { Input } from "./Input";
import { DataMapperInput, PreviousStep } from "./DataMapperInput";

type CalendarEventMetadata = {
    title: string;
    description: string;
    location: string;
    start: string;
    end: string;
};

export function GoogleCalendarSelector({
    setMetadata,
    previousSteps
}: {
    setMetadata: (params: CalendarEventMetadata) => void;
    previousSteps?: PreviousStep[];
}) {
    const { success, error } = useToast();

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
            error("Please fill in the title, start time, and end time.");
            return;
        }

        const offset = getOffset();
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
        success("Configuration saved!");
    };

    return (
        <div className="space-y-5">
            <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 mb-2">
                Create a new event in your Google Calendar.
            </div>

            <div className="grid grid-cols-1 gap-4">
                <DataMapperInput
                    label="Event Title"
                    placeholder="Meeting with the team"
                    value={title}
                    onChange={setTitle}
                    previousSteps={previousSteps}
                />
                <DataMapperInput
                    label="Location"
                    placeholder="Google Meet / Office"
                    value={location}
                    onChange={setLocation}
                    previousSteps={previousSteps}
                />
            </div>

            <div>
                <DataMapperInput
                    label="Description"
                    placeholder="Agenda, notes, etc."
                    value={description}
                    onChange={setDescription}
                    previousSteps={previousSteps}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input label="Start Time" type="datetime-local" placeholder="" onChange={(e) => setStart(e.target.value)} />
                <Input label="End Time" type="datetime-local" placeholder="" onChange={(e) => setEnd(e.target.value)} />
            </div>

            <div className="pt-4 flex justify-end">
                <div className="w-full sm:w-auto">
                    <PrimaryButton onClick={handleSubmit}>Save Event</PrimaryButton>
                </div>
            </div>
        </div>
    );
}
