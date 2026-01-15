"use client"

import { useState } from "react";

// Define constants for tabs and video sources for better organization
const TABS = [
    "AI Workflows", 
    "AI Agents", 
    "AiChatbots", 
    "Tables", 
    "Interfaces", 
    "Canvas", 
    "Enterprice", 
    "Function"
];

const VIDEO_SOURCES: { [key: string]: string } = {
  "AI Workflows": "./videos/ai_workflow.webm",
  "AI Agents": "./videos/ai_agents.webm",
  "AiChatbots": "./videos/ai_chatbot.webm",
  "Tables": "./videos/Tables.webm",
  "Interfaces": "./videos/interfaces.webm",
  "Canvas": "./videos/canvas.webm",
  "Enterprice": "./videos/enterprice.webm",
  "Function": "./videos/functions.webm",
};

export function HeroVideo() {
    const [activeTab, setActiveTab] = useState("AI Workflows");

    return (
        <div className="flex flex-col mt-4 w-full">
            {/* Tab Navigation */}
            <div className="w-full border-y border-gray-300">
                {/* On small screens, this container will allow horizontal scrolling */}
                <div className="flex justify-start md:justify-center overflow-x-auto whitespace-nowrap">
                    {TABS.map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-4 text-sm md:text-base flex-shrink-0 transition-colors duration-200 ${
                                activeTab === tab 
                                ? "border-b-4 border-orange-600 font-semibold text-black" 
                                : "text-gray-600 hover:border-b-2 hover:border-gray-700"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Video Player Section */}
            <div className="relative mt-8 w-full max-w-6xl mx-auto">
                {/* The frame image will scale with the container */}
                <img src="./images/frame.jpg" alt="Frame" className="w-full h-auto" />

                {/* The video is positioned absolutely within the frame */}
                <div className="absolute inset-0 flex items-center justify-center p-[4%] md:p-[5%]">
                    <video
                        // Using a key forces React to re-mount the video element on tab change,
                        // which helps ensure autoplay works reliably.
                        key={activeTab}
                        src={VIDEO_SOURCES[activeTab]}
                        autoPlay
                        loop
                        muted
                        playsInline // Important for autoplay on iOS
                        className="w-full h-full object-contain rounded-lg"
                    />
                </div>
            </div>
        </div>
    );
}