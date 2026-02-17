"use client"

import { useState } from "react";

const TABS = [
    "AI Workflows",
    "AI Agents",
    "AiChatbots",
    "Tables",
    "Interfaces",
    "Canvas",
    "Enterprise",
    "Function"
];

const VIDEO_SOURCES: { [key: string]: string } = {
    "AI Workflows": "/videos/ai_workflow.webm",
    "AI Agents": "/videos/ai_agents.webm",
    "AiChatbots": "/videos/ai_chatbot.webm",
    "Tables": "/videos/Tables.webm",
    "Interfaces": "/videos/interfaces.webm",
    "Canvas": "/videos/canvas.webm",
    "Enterprise": "/videos/enterprise.webm",
    "Function": "/videos/functions.webm",
};

export function HeroVideo() {
    const [activeTab, setActiveTab] = useState("AI Workflows");
    const [videoError, setVideoError] = useState(false);

    const videoSrc = VIDEO_SOURCES[activeTab];

    return (
        <div className="flex flex-col mt-8 w-full">
            {/* Tab Navigation */}
            <div className="w-full border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-start md:justify-center overflow-x-auto whitespace-nowrap scrollbar-hide pb-0.5">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setVideoError(false); }}
                            className={`py-3 px-5 text-sm font-medium flex-shrink-0 transition-all duration-200 border-b-2 ${activeTab === tab
                                    ? "border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 bg-primary-50/50 dark:bg-primary-900/10"
                                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Video Player Section */}
            <div className="relative mt-12 w-full max-w-6xl mx-auto">
                <div className="relative rounded-xl overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="aspect-video w-full bg-slate-900 relative">
                        {!videoError && videoSrc ? (
                            <video
                                key={activeTab}
                                src={videoSrc}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-contain"
                                onError={() => setVideoError(true)}
                            />
                        ) : null}
                        {(videoError || !videoSrc) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                                <div className="w-16 h-16 rounded-full bg-slate-700/50 dark:bg-slate-800 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium">{activeTab}</span>
                                <span className="text-xs mt-1">Add videos to <code className="bg-slate-800 px-1 rounded">public/videos/</code> to preview</span>
                            </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                    </div>
                </div>
                <div className="absolute -inset-4 bg-primary-500/20 blur-3xl -z-10 rounded-full opacity-50" />
            </div>
        </div>
    );
}