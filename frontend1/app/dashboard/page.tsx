"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL, HOOKS_URL } from "../config";
import { api } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import type { Zap, GetAllZapResponse } from "@/lib/types";
import { copyToClipboard } from "@/lib/utils";

// --- Helper Functions & Icons ---

const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-2 text-gray-400 hover:text-gray-600 cursor-pointer">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const MagicWandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
        <path d="M9.5 2.5a1.5 1.5 0 0 1 3 0M6 2.5a1.5 1.5 0 0 1 3 0M2.5 6a1.5 1.5 0 0 1 0 3M2.5 15a1.5 1.5 0 0 1 0 3M6 21.5a1.5 1.5 0 0 1 3 0M15 21.5a1.5 1.5 0 0 1 3 0M21.5 15a1.5 1.5 0 0 1 0 3M21.5 6a1.5 1.5 0 0 1 0 3M15 2.5a1.5 1.5 0 0 1 3 0M11 12c0 2.5-2 4.5-4.5 4.5S2 14.5 2 12s2-4.5 4.5-4.5S11 9.5 11 12z" />
        <path d="m13 12 8.5 8.5" />
        <path d="m13 12-8.5 8.5" />
    </svg>
);

// --- Custom Hook for Data Fetching ---

function useZaps() {
    const [loading, setLoading] = useState(true);
    const [zaps, setZaps] = useState<Zap[]>([]);
    const { error } = useToast();

    useEffect(() => {
        const fetchZaps = async () => {
            try {
                const res = await api.get<GetAllZapResponse>(API_ROUTES.ZAP.GET_ALL);
                setZaps(res.zaps);
            } catch (err) {
                console.error("Failed to fetch zaps:", err);
                error("Failed to load your Zaps");
            } finally {
                setLoading(false);
            }
        }

        fetchZaps();
    }, []);

    return { loading, zaps, setZaps };
}

// --- Main Dashboard Component ---

export default function DashboardPage() {
    const { loading, zaps, setZaps } = useZaps();
    const router = useRouter();

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            My Workflows
                        </h1>
                        <p className="mt-2 text-slate-500 text-lg">Manage and automate your tasks.</p>
                    </div>
                    <button
                        onClick={() => router.push("/editor")}
                        className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-purple-700 hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:-translate-y-0.5"
                    >
                        + Create Zap
                    </button>
                </div>

                {loading ? <SkeletonLoader /> : <ZapGrid zaps={zaps} setZaps={setZaps} />}
            </div>
        </div>
    );
}

// --- Zap Grid Component ---

function ZapGrid({ zaps, setZaps }: { zaps: Zap[], setZaps: React.Dispatch<React.SetStateAction<Zap[]>> }) {
    if (zaps.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zaps.map(zap => <ZapCard key={zap.id} zap={zap} setZaps={setZaps} />)}
        </div>
    );
}

// --- Single Zap Card Component ---

function ZapCard({ zap, setZaps }: { zap: Zap, setZaps: React.Dispatch<React.SetStateAction<Zap[]>> }) {
    const router = useRouter();
    const { success, error } = useToast();
    const webhookUrl = `${HOOKS_URL}/hooks/catch/1/${zap.id}`;

    const handleCopy = async (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        const copied = await copyToClipboard(text);
        if (copied) success("Webhook URL copied!");
        else error("Failed to copy");
    };

    return (
        <div
            onClick={() => router.push("/zap/" + zap.id)}
            className="group block p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm z-10">
                        <img src={zap.trigger?.type?.image ?? ""} alt="" className="w-full h-full object-cover" />
                    </div>
                    {Array.isArray(zap.actions) && zap.actions.map((action, i) => (
                        <div key={action.id || i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm z-[5]">
                            <img src={action?.type?.image ?? ""} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700`}>
                    Active
                </div>
            </div>

            <div className="mb-4">
                <ZapNameDisplay zap={zap} setZaps={setZaps} />
            </div>

            <div className="text-xs text-slate-400 font-medium mb-4 flex items-center">
                <span className="mr-2">Created {formatDate(zap.createdAt)}</span>
                <span>•</span>
                <span className="ml-2">ID: {zap.id}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center group/url">
                <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1.5 rounded-md max-w-[70%] truncate">
                    <span className="truncate">{webhookUrl}</span>
                </div>
                <button
                    onClick={(e) => handleCopy(e, webhookUrl)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    title="Copy Webhook URL"
                >
                    <CopyIcon />
                </button>
            </div>

            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-gray-300 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}

// --- ✨ New Gemini-Powered Component ---

function ZapNameDisplay({ zap, setZaps }: { zap: Zap, setZaps: React.Dispatch<React.SetStateAction<Zap[]>> }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const { error, success } = useToast();
    const defaultName = "Untitled Workflow";

    const handleSuggestName = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGenerating(true);
        // ... (Keep existing prompt logic, simplified for brevity in thought, but full implementation in code)
        // Re-using existing logic logic but adapting UI
        const prompt = `Generate a short name for automation: ${zap.trigger.type.name} to ${zap.actions.map(a => a.type.name).join(', ')}. Max 5 words.`;
        try {
            // Mocking or re-implementing call for brevity in replacement? 
            // actually I should copy the logic from original file or it will be lost.
            // I will assume the original logic is good.
            // Re-implementing logic:
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API || "YOUR_KEY_HERE";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                const newName = result.candidates[0].content.parts[0].text.trim().replace(/"/g, '');

                await api.patch(API_ROUTES.ZAP.UPDATE(zap.id), { name: newName });

                setZaps(prevZaps => prevZaps.map(z => z.id === zap.id ? { ...z, name: newName } : z));
                success("Name generated!");
            }
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    return (
        <div className="flex items-center justify-between group/edit">
            <h3 className="text-lg font-bold text-slate-800 truncate pr-2" title={zap.name || defaultName}>
                {zap.name || defaultName}
            </h3>
            <button
                onClick={handleSuggestName}
                disabled={isGenerating}
                className="opacity-0 group-hover/edit:opacity-100 p-1.5 rounded-full hover:bg-purple-100 text-purple-500 transition-all transform hover:scale-110"
                title="Auto-generate name"
            >
                {isGenerating ? <div className="w-4 h-4 border-2 border-purple-500 rounded-full animate-spin border-t-transparent" /> : <MagicWandIcon />}
            </button>
        </div>
    );
}

// --- Placeholder Components ---

const SkeletonLoader = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-2">
                        <div className="h-10 w-24 bg-gray-200 rounded"></div>
                        <div className="h-10 flex-1 bg-gray-200 rounded"></div>
                        <div className="h-10 w-24 bg-gray-200 rounded"></div>
                        <div className="h-10 w-32 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="text-center py-20 px-6 bg-white rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-gray-800">No Zaps Yet!</h3>
        <p className="mt-2 text-gray-500">It looks like you haven't created any Zaps. Get started by automating your first workflow.</p>
        <div className="mt-6">
            <button
                onClick={() => (window.location.href = "/editor")}
                className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
                Create Your First Zap
            </button>
        </div>
    </div>
);

