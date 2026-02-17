"use client"

import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BACKEND_URL, HOOKS_URL } from "../config";
import { Button } from "@/component/ui/Button";

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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-primary-600 transition-colors">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ZapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
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
    const [error, setError] = useState<string | null>(null);

    const fetchZaps = useCallback(async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            setLoading(false);
            setError("auth");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const res = await axios.get<GetAllZapResponse>(`${BACKEND_URL}/api/v1/zap/user`, {
                headers: { authorization: token }
            });
            setZaps(Array.isArray(res.data?.zaps) ? res.data.zaps : []);
        } catch (err: unknown) {
            const res = err && typeof err === "object" && "response" in err ? (err as { response?: { status?: number } }).response : undefined;
            const status = res?.status ?? null;
            if (status === 401 || status === 403) {
                if (typeof window !== "undefined") localStorage.removeItem("token");
                setError("auth");
            } else {
                setError("Failed to load zaps. Please try again.");
            }
            setZaps([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchZaps();
    }, [fetchZaps]);

    return { loading, zaps, setZaps, error, retry: fetchZaps };
}

// --- Dashboard Navbar (authenticated) ---

function DashboardNavbar() {
    const router = useRouter();
    const handleLogout = () => {
        localStorage.removeItem("token");
        router.replace("/signin");
    };
    return (
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg group-hover:bg-primary-200 transition-colors">
                                <ZapIcon />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                                ZapClone
                            </span>
                        </Link>
                        <div className="hidden md:flex gap-6">
                            <span className="text-sm font-medium text-slate-900 dark:text-white border-b-2 border-primary-600 px-1 py-5">
                                Dashboard
                            </span>
                            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-1 py-5 transition-colors">
                                Marketplace
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                            Log out
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

// --- Main Dashboard Component ---

export default function DashboardPage() {
    const { loading, zaps, setZaps, error, retry } = useZaps();
    const router = useRouter();

    useEffect(() => {
        if (error === "auth") router.replace("/signin");
    }, [error, router]);

    if (error === "auth") {
        return (
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-200">
            <DashboardNavbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            My Zaps
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Manage and monitor your automated workflows.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/editor")}
                        variant="primary"
                        className="shadow-md hover:shadow-lg transition-all"
                        leftIcon={<span className="text-xl leading-none font-bold">+</span>}
                    >
                        Create Zap
                    </Button>
                </div>

                {error && error !== "auth" && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">{error}</span>
                        <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
                    </div>
                )}

                <DeploymentInfoBar />

                {loading ? <SkeletonLoader /> : <ZapGrid zaps={zaps} />}
            </div>
        </div>
    );
}

// --- Deployment Info Bar ---

function DeploymentInfoBar() {
    return (
        <div className="mb-8 p-5 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" /></svg>
            </div>

            <div className="bg-blue-600 dark:bg-blue-500 p-3 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>

            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Workflow Execution Guide</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    We're currently finalizing the cloud deployment. To run your workflows now, ensure your <span className="font-semibold text-blue-600 dark:text-blue-400">Worker</span> and <span className="font-semibold text-blue-600 dark:text-blue-400">Processor</span> services are running locally. Once active, they will automatically pick up and execute any data sent to your Zap's Webhook URL.
                </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/80 rounded-xl border border-blue-100 dark:border-blue-900/50 shadow-sm">
                <div className="w-2h-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Local Mode Active</span>
            </div>
        </div>
    );
}

// --- Zap Grid Component ---

function ZapGrid({ zaps }: { zaps: Zap[] }) {
    const router = useRouter();

    if (zaps.length === 0) {
        return <EmptyState onCreateZap={() => router.push("/editor")} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zaps.map(zap => <ZapCard key={zap.id} zap={zap} />)}
        </div>
    );
}

// --- Single Zap Card Component ---

function ZapCard({ zap }: { zap: Zap }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const webhookUrl = `${HOOKS_URL}/hooks/catch/1/${zap.id}`;
    const defaultName = "Untitled Zap";

    const copyToClipboard = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(webhookUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div
            onClick={() => router.push("/zap/" + zap.id)}
            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
        >
            {/* Header: Name and Date */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                        {zap.name || defaultName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Created on {formatDate(zap.createdAt)}
                    </p>
                </div>
            </div>

            {/* Icon Flow Visualization */}
            <div className="flex items-center gap-2 mb-6 overflow-hidden">
                <div className="relative shrink-0" title={zap.trigger.type.name}>
                    <img
                        src={zap.trigger.type.image}
                        alt="Trigger"
                        className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 object-contain p-1.5"
                    />
                </div>

                {Array.isArray(zap.actions) && zap.actions.map((action, idx) => (
                    <div key={action.id} className="flex items-center gap-2 shrink-0">
                        <ArrowRightIcon />
                        <div className="relative" title={action.type.name}>
                            <img
                                src={action.type.image}
                                alt="Action"
                                className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 object-contain p-1.5"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer: Webhook & Action */}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 truncate min-w-0"
                    title={webhookUrl}
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span className="truncate">{copied ? "Copied Link" : "Copy Webhook URL"}</span>
                </button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                    Open
                </Button>
            </div>
        </div>
    );
}

// --- Placeholder Components ---

const SkeletonLoader = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-[200px] animate-pulse flex flex-col">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="flex gap-3 mb-auto">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4"></div>
            </div>
        ))}
    </div>
);

function EmptyState({ onCreateZap }: { onCreateZap: () => void }) {
    return (
        <div className="text-center py-24 px-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center col-span-full">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Zaps found</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                You haven't created any automated workflows yet. Start by creating your first Zap to save time.
            </p>
            <div className="mt-8">
                <Button onClick={onCreateZap} variant="primary" size="lg" className="shadow-lg">
                    Create your first Zap
                </Button>
            </div>
        </div>
    );
}
