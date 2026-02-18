"use client"

import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BACKEND_URL, HOOKS_URL } from "../config";
import { Button } from "@/component/ui/Button";

// --- Delete Confirmation Modal ---

function DeleteConfirmModal({
    zapName,
    onConfirm,
    onCancel,
    deleting,
}: {
    zapName: string;
    onConfirm: () => void;
    onCancel: () => void;
    deleting: boolean;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">
                    Delete Workflow?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">
                    You're about to permanently delete
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center mb-4 truncate px-4">
                    &ldquo;{zapName}&rdquo;
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mb-6 leading-relaxed">
                    This will also delete all run history and cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {deleting ? (
                            <>
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Deleting…
                            </>
                        ) : (
                            "Delete Workflow"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Helper Functions & Icons ---

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
                            <Link href="/activity" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-1 py-5 transition-colors flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                Activity
                            </Link>
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

    const handleDelete = useCallback(async (zapId: string) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) throw new Error("Not authenticated");
        await axios.delete(`${BACKEND_URL}/api/v1/zap/${zapId}`, {
            headers: { authorization: token }
        });
        // Remove from local state after successful delete
        setZaps(prev => prev.filter(z => z.id !== zapId));
    }, [setZaps]);

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

                <ConnectionsWidget />

                <RecentActivityWidget />

                {loading ? <SkeletonLoader /> : <ZapGrid zaps={zaps} onDelete={handleDelete} />}
            </div>
        </div>
    );
}

// --- Connections Widget ---

type ConnectionStatus = {
    google: { connected: boolean; expiryDate: string | null };
    notion: { connected: boolean; workspaceName: string | null };
};

function ConnectionsWidget() {
    const [status, setStatus] = useState<ConnectionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchConnections = async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        try {
            const res = await axios.get<ConnectionStatus>(
                `${BACKEND_URL}/api/v1/user/connections`,
                { headers: { authorization: token } }
            );
            setStatus(res.data);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchConnections(); }, []);

    const connectGoogle = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await axios.get<{ url: string }>(`${BACKEND_URL}/auth`, {
                headers: { authorization: token }
            });
            window.location.href = res.data.url;
        } catch { /* ignore */ }
    };

    const connectNotion = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        // Notion OAuth redirect is handled server-side
        window.location.href = `${BACKEND_URL}/api/oauth/notion?authorization=${token}`;
    };

    const integrations = [
        {
            key: "google",
            name: "Google",
            description: "Sheets & Calendar",
            connected: status?.google.connected ?? false,
            detail: status?.google.expiryDate
                ? `Expires ${new Date(status.google.expiryDate).toLocaleDateString()}`
                : null,
            onConnect: connectGoogle,
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
            ),
        },
        {
            key: "notion",
            name: "Notion",
            description: status?.notion.workspaceName ?? "Workspace",
            connected: status?.notion.connected ?? false,
            detail: status?.notion.workspaceName ?? null,
            onConnect: connectNotion,
            icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900 dark:text-white" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-50 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Connected Integrations</h2>
                </div>
                <button
                    onClick={fetchConnections}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Refresh connection status"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M8 16H3v5" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                {loading ? (
                    [...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                            </div>
                            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                        </div>
                    ))
                ) : (
                    integrations.map(integration => (
                        <div key={integration.key} className="flex items-center gap-4 px-5 py-4">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${integration.connected
                                ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50"
                                }`}>
                                {integration.icon}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{integration.name}</span>
                                    {integration.connected && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Connected
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {integration.connected
                                        ? (integration.detail ?? integration.description)
                                        : integration.description}
                                </p>
                            </div>

                            {/* Action */}
                            {integration.connected ? (
                                <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    Active
                                </span>
                            ) : (
                                <button
                                    onClick={integration.onConnect}
                                    className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Connect
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// --- Recent Activity Widget ---

type RunEntry = {
    id: string;
    zapId: string;
    zapName: string;
    status: "pending" | "running" | "completed" | "failed";
    createdAt: string;
    trigger: { name: string; image: string } | null;
    actions: { name: string; image: string }[];
};

function RecentActivityWidget() {
    const [runs, setRuns] = useState<RunEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        (async () => {
            try {
                const res = await axios.get<{ runs: RunEntry[]; total: number }>(
                    `${BACKEND_URL}/api/v1/zap/runs/all?page=1&limit=3`,
                    { headers: { authorization: token } }
                );
                setRuns(res.data.runs ?? []);
                setTotal(res.data.total ?? 0);
            } catch {
                // silently fail — widget is non-critical
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                    {total > 0 && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {total} total
                        </span>
                    )}
                    <div className="flex items-center gap-1 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
                    </div>
                </div>
                <Link
                    href="/activity"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                    View all
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </Link>
            </div>

            {loading ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                            <div className="flex-1 space-y-1">
                                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                            </div>
                            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : runs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No runs yet. Trigger a webhook to see activity here.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {runs.map(run => (
                        <div key={run.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${run.status === "completed" ? "bg-emerald-500" :
                                    run.status === "running" ? "bg-blue-500 animate-pulse" :
                                        run.status === "failed" ? "bg-red-500" :
                                            "bg-slate-300 animate-pulse"
                                }`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {run.trigger && (
                                        <img src={run.trigger.image} alt={run.trigger.name} className="w-4 h-4 rounded object-contain" />
                                    )}
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{run.zapName}</span>
                                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">#{run.id.slice(0, 6)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {run.status === "completed" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                        Done
                                    </span>
                                ) : run.status === "failed" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                        <span className="w-1 h-1 rounded-full bg-red-500" />
                                        Failed
                                    </span>
                                ) : run.status === "running" ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                        Running
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                                        Pending
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono w-12 text-right">{timeAgo(run.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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

function ZapGrid({ zaps, onDelete }: { zaps: Zap[]; onDelete: (id: string) => Promise<void> }) {
    const router = useRouter();

    if (zaps.length === 0) {
        return <EmptyState onCreateZap={() => router.push("/editor")} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zaps.map(zap => <ZapCard key={zap.id} zap={zap} onDelete={onDelete} />)}
        </div>
    );
}

// --- Single Zap Card Component ---

function ZapCard({ zap, onDelete }: { zap: Zap; onDelete: (id: string) => Promise<void> }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    // Rename state
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(zap.name || "");
    const [renaming, setRenaming] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);
    const webhookUrl = `${HOOKS_URL}/hooks/catch/1/${zap.id}`;
    const defaultName = "Untitled Zap";

    const copyToClipboard = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(webhookUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const startRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRenameValue(zap.name || "");
        setIsRenaming(true);
        setTimeout(() => renameInputRef.current?.select(), 10);
    };

    const saveRename = async () => {
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === zap.name) { setIsRenaming(false); return; }
        setRenaming(true);
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${BACKEND_URL}/api/v1/zap/${zap.id}`, { name: trimmed }, {
                headers: { authorization: token }
            });
            zap.name = trimmed; // optimistic local update
        } catch { /* silently revert */ }
        setRenaming(false);
        setIsRenaming(false);
    };

    const handleRenameKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveRename();
        if (e.key === "Escape") { setIsRenaming(false); setRenameValue(zap.name || ""); }
    };

    const handleDeleteConfirm = async () => {
        // 1. Close modal immediately so it doesn't get stuck
        setShowDeleteModal(false);
        // 2. Show inline deleting state on the card
        setDeleting(true);
        setDeleteError(null);
        try {
            await onDelete(zap.id);
            // onDelete removes the card from parent state — component unmounts here
        } catch {
            // Card is still mounted (delete failed), show error
            setDeleting(false);
            setDeleteError("Delete failed. Please try again.");
        }
    };

    return (
        <>
            {showDeleteModal && (
                <DeleteConfirmModal
                    zapName={zap.name || defaultName}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => { setShowDeleteModal(false); setDeleteError(null); }}
                    deleting={false}
                />
            )}

            <div
                onClick={() => !deleting && router.push("/zap/" + zap.id)}
                className={`group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative ${deleting ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
            >
                {/* Inline deleting overlay */}
                {deleting && (
                    <div className="absolute inset-0 rounded-xl bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10 gap-2">
                        <svg className="animate-spin w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span className="text-sm font-semibold text-red-500">Deleting…</span>
                    </div>
                )}

                {/* Header: Name, Date, Delete */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                        {isRenaming ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <input
                                    ref={renameInputRef}
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    onKeyDown={handleRenameKey}
                                    onBlur={saveRename}
                                    disabled={renaming}
                                    className="flex-1 text-base font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-indigo-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
                                    placeholder="Zap name"
                                    maxLength={80}
                                />
                                {renaming && (
                                    <svg className="animate-spin w-4 h-4 text-indigo-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 group/name">
                                <h3
                                    onDoubleClick={startRename}
                                    title="Double-click to rename"
                                    className="text-lg font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors cursor-text"
                                >
                                    {zap.name || defaultName}
                                </h3>
                                <button
                                    onClick={startRename}
                                    title="Rename"
                                    className="shrink-0 p-1 rounded text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover/name:opacity-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Created on {formatDate(zap.createdAt)}
                        </p>
                    </div>
                    {/* Delete button */}
                    <button
                        onClick={e => { e.stopPropagation(); if (!deleting) setShowDeleteModal(true); }}
                        title="Delete workflow"
                        disabled={deleting}
                        className="shrink-0 p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 disabled:pointer-events-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </button>
                </div>

                {deleteError && (
                    <p className="text-xs text-red-500 mb-2 font-medium">{deleteError}</p>
                )}

                {/* Icon Flow Visualization */}
                <div className="flex items-center gap-2 mb-6 overflow-hidden">
                    <div className="relative shrink-0" title={zap.trigger.type.name}>
                        <img
                            src={zap.trigger.type.image}
                            alt="Trigger"
                            className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 object-contain p-1.5"
                        />
                    </div>

                    {Array.isArray(zap.actions) && zap.actions.map((action) => (
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
        </>
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
