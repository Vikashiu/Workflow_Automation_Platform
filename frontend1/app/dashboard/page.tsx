"use client"

import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL, HOOKS_URL } from "../config";

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


// --- Type Definitions ---

type Zap = {
    id: string;
    name?: string; // Optional user-defined name
    TriggerId: string;
    userId: number;
    createdAt: string;
    actions: {
        id: string;
        zapId: string;
        ActionId: string;
        metadata: Record<string, any>;
        type: {
            id: string;
            name: string;
            image: string;
        };
    }[];
    trigger: {
        id: string;
        zapId: string;
        TriggerId: string;
        metadata: Record<string, any>;
        type: {
            id: string;
            name: string;
            image: string;
        };
    };
};

type GetAllZapResponse = {
    zaps: Zap[];
};

// --- Custom Hook for Data Fetching ---

function useZaps() {
    const [loading, setLoading] = useState(true);
    const [zaps, setZaps] = useState<Zap[]>([]);

    useEffect(() => {
        const fetchZaps = async () => {
            const res = await axios.get<GetAllZapResponse>(`${BACKEND_URL}/api/v1/zap/user`, {
                headers: {
                    "authorization": localStorage.getItem("token")
                }
            })
            console.log(res);
            setZaps(res.data.zaps);
            setLoading(false);
        }

        fetchZaps();
        // const res = axios.get<GetAllZapResponse>(`${BACKEND_URL}/api/v1/zap/user`, {
        //     headers: {
        //         "authorization": localStorage.getItem("token")
        //     }
        // })

        // console.log(res);
        // .then(res => {
        //     setZaps(res.data.zaps);
        //     setLoading(false);
        // })
        // .catch(err => {
        //     console.error("Failed to fetch zaps:", err);
        //     setLoading(false);
        // });
    }, []);

    return { loading, zaps, setZaps };
}

// --- Main Dashboard Component ---

export default function DashboardPage() {
    const { loading, zaps, setZaps } = useZaps();
    const router = useRouter();

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        My Zaps
                    </h1>
                    <button
                        onClick={() => router.push("/editor")}
                        className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                    >
                        Create Zap
                    </button>
                </div>

                {loading ? <SkeletonLoader /> : <ZapTable zaps={zaps} setZaps={setZaps} />}
            </div>
        </div>
    );
}

// --- Zap Table Component ---

function ZapTable({ zaps, setZaps }: { zaps: Zap[], setZaps: React.Dispatch<React.SetStateAction<Zap[]>> }) {
    if (zaps.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Webhook URL</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {zaps.map(zap => <ZapTableRow key={zap.id} zap={zap} setZaps={setZaps} />)}
                </tbody>
            </table>
        </div>
    );
}

// --- Single Zap Row Component ---

function ZapTableRow({ zap, setZaps }: { zap: Zap, setZaps: React.Dispatch<React.SetStateAction<Zap[]>> }) {
    const router = useRouter();
    const webhookUrl = `${HOOKS_URL}/hooks/catch/1/${zap.id}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <ZapNameDisplay zap={zap} setZaps={setZaps} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ms-3 text-sm font-medium text-gray-600">On</span>
                </label>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(zap.createdAt)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="font-mono bg-gray-100 p-1 rounded">{webhookUrl.substring(0, 35)}...</span>
                <span onClick={() => copyToClipboard(webhookUrl)}><CopyIcon /></span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => router.push("/zap/" + zap.id)} className="text-blue-600 hover:text-blue-900 font-semibold">
                    Go &rarr;
                </button>
            </td>
        </tr>
    );
}

// --- ✨ New Gemini-Powered Component ---

function ZapNameDisplay({ zap, setZaps }: { zap: Zap, setZaps: React.Dispatch<React.SetStateAction<Zap[]>> }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const defaultName = `${zap?.trigger?.type?.name ?? "Unknown Trigger"} → ${Array.isArray(zap?.actions)
        ? zap.actions.map(a => a?.type?.name ?? "Unknown Action").join(', ')
        : "No Actions"
        }`;

    const handleSuggestName = async () => {
        setIsGenerating(true);
        const prompt = `Generate a short, clear, and human-readable name for an automation workflow.
        The workflow is defined as:
        - Trigger: "${zap.trigger.type.name}"
        - Actions: "${zap.actions.map(a => a.type.name).join(', ')}"
        
        The name should be concise and descriptive. For example: "Log Gmail attachments to Sheets" or "Notify team of new sales leads".
        
        Generated Name:`;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = process.env.GEMINI_API;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                const newName = result.candidates[0].content.parts[0].text.trim().replace(/"/g, ''); // Clean up the name

                // --- Backend Integration Point ---
                // In a real app, you would now save this name to your database.
                // Example:
                // await axios.put(`${BACKEND_URL}/api/v1/zap/${zap.id}`, { name: newName });

                // For now, we update the local state to show the change instantly.
                setZaps(prevZaps => prevZaps.map(z => z.id === zap.id ? { ...z, name: newName } : z));
            } else {
                throw new Error("Invalid response structure from Gemini API");
            }

        } catch (error) {
            console.error("Failed to generate name:", error);
            alert("Sorry, we couldn't generate a name right now. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white" src={zap.trigger?.type?.image ?? ""} alt={zap.trigger?.type?.name ?? "Trigger"} />
                {Array.isArray(zap.actions) && zap.actions.map(action => (
                    <img
                        key={action.id}
                        src={action?.type?.image ?? ""}
                        alt={action?.type?.name ?? "Action"}
                        className="w-8 h-8 rounded-full border-2 border-white"
                    />
                ))}

            </div>
            <div className="ml-4 font-medium text-gray-900">
                {zap.name || defaultName}
            </div>
            <button
                onClick={handleSuggestName}
                disabled={isGenerating}
                className="ml-3 p-1 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Suggest a name with AI"
            >
                {isGenerating ?
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div> :
                    <MagicWandIcon />
                }
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

