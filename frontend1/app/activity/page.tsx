"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { API_ROUTES } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = { name: string; image: string };

type ZapRunEntry = {
    id: string;
    zapId: string;
    zapName: string;
    status: "pending" | "running" | "completed" | "failed";
    payload: Record<string, unknown>;
    createdAt: string;
    trigger: ActionType | null;
    actions: ActionType[];
};

type RunsResponse = {
    runs: ZapRunEntry[];
    total: number;
    page: number;
    limit: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ZapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={spinning ? "animate-spin" : ""}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
    </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 shrink-0">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
);

const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ZapRunEntry["status"] }) {
    if (status === "pending") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Pending
            </span>
        );
    }
    if (status === "running") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Running
            </span>
        );
    }
    if (status === "failed") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Failed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
        </span>
    );
}

// ─── Payload Viewer ───────────────────────────────────────────────────────────

function PayloadViewer({ payload }: { payload: Record<string, unknown> }) {
    const [open, setOpen] = useState(false);
    const isEmpty = !payload || Object.keys(payload).length === 0;

    return (
        <div className="mt-3">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
                <ChevronIcon open={open} />
                {open ? "Hide" : "Show"} payload
            </button>
            {open && (
                <div className="mt-2 rounded-lg bg-slate-950 dark:bg-black border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800">
                        <span className="text-xs text-slate-500 font-mono">webhook payload</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500/60" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                        </div>
                    </div>
                    <pre className="p-3 text-xs text-emerald-400 font-mono overflow-auto max-h-48 leading-relaxed">
                        {isEmpty ? "{ }" : JSON.stringify(payload, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Run Row ──────────────────────────────────────────────────────────────────

function RunRow({ run, index }: { run: ZapRunEntry; index: number }) {
    return (
        <div
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200"
            style={{ animationDelay: `${index * 30}ms` }}
        >
            <div className="flex items-start gap-4">
                {/* Timeline dot */}
                <div className="relative mt-1 shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 ${run.status === "completed" ? "bg-emerald-500 border-emerald-400" :
                            run.status === "running" ? "bg-blue-500 border-blue-400 animate-pulse" :
                                run.status === "failed" ? "bg-red-500 border-red-400" :
                                    "bg-slate-300 border-slate-200"
                        }`} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={run.status} />
                        <Link
                            href={`/zap/${run.zapId}`}
                            onClick={e => e.stopPropagation()}
                            className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[200px]"
                            title={run.zapName}
                        >
                            {run.zapName}
                        </Link>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            #{run.id.slice(0, 8)}
                        </span>
                    </div>

                    {/* Icon flow */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {run.trigger ? (
                            <div className="flex items-center gap-1" title={run.trigger.name}>
                                <img
                                    src={run.trigger.image}
                                    alt={run.trigger.name}
                                    className="w-6 h-6 rounded object-contain bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-0.5"
                                />
                                <span className="text-xs text-slate-500 dark:text-slate-400">{run.trigger.name}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Webhook</span>
                        )}
                        {run.actions.map((action, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <ArrowIcon />
                                <div className="flex items-center gap-1" title={action.name}>
                                    <img
                                        src={action.image}
                                        alt={action.name}
                                        className="w-6 h-6 rounded object-contain bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-0.5"
                                    />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{action.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <PayloadViewer payload={run.payload} />
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-right">
                    <span
                        className="text-xs text-slate-400 dark:text-slate-500 font-mono cursor-default"
                        title={formatFullDate(run.createdAt)}
                    >
                        {timeAgo(run.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RunSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        </div>
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ runs, total }: { runs: ZapRunEntry[]; total: number }) {
    const completed = runs.filter(r => r.status === "completed").length;
    const failed = runs.filter(r => r.status === "failed").length;
    const running = runs.filter(r => r.status === "running" || r.status === "pending").length;

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {[
                { label: "Total Received", value: total, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-100 dark:border-indigo-900/50" },
                { label: "Completed", value: completed, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-900/50" },
                { label: "In Progress", value: running, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-900/50" },
                { label: "Failed", value: failed, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-900/50" },
            ].map(stat => (
                <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-4`}>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityPage() {
    const router = useRouter();
    const [runs, setRuns] = useState<ZapRunEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const LIMIT = 20;

    const fetchRuns = useCallback(async (currentPage: number, silent = false) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) { router.replace("/signin"); return; }

        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError(null);

        try {
            const url = `${BACKEND_URL}/api/v1/zap/runs/all?page=${currentPage}&limit=${LIMIT}`;
            const res = await axios.get<RunsResponse>(url, {
                headers: { authorization: token }
            });
            setRuns(res.data.runs ?? []);
            setTotal(res.data.total ?? 0);
            setLastRefreshed(new Date());
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem("token");
                router.replace("/signin");
            } else {
                setError("Failed to load activity. Please try again.");
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router]);

    // Initial load
    useEffect(() => {
        fetchRuns(page);
    }, [fetchRuns, page]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            fetchRuns(page, true);
        }, 10000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [fetchRuns, page]);

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
            {/* Navbar */}
            <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <ZapIcon />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                    ZapClone
                                </span>
                            </Link>
                            <div className="hidden md:flex gap-6">
                                <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-1 py-5 transition-colors">
                                    Dashboard
                                </Link>
                                <span className="text-sm font-medium text-slate-900 dark:text-white border-b-2 border-indigo-600 px-1 py-5 flex items-center gap-1.5">
                                    <ActivityIcon /> Activity
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem("token"); router.replace("/signin"); }}
                            className="text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <ActivityIcon />
                            </span>
                            Activity Monitor
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                            Live feed of all workflow runs — auto-refreshes every 10 seconds
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                            Updated {timeAgo(lastRefreshed.toISOString())}
                        </span>
                        <button
                            onClick={() => fetchRuns(page, true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshIcon spinning={refreshing} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {!loading && <StatsBar runs={runs} total={total} />}

                {/* Live indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">LIVE</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                        Showing {runs.length} of {total} runs
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center justify-between gap-4">
                        <span className="text-sm font-medium">{error}</span>
                        <button
                            onClick={() => fetchRuns(page)}
                            className="text-sm font-medium underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <RunSkeleton />
                ) : runs.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ActivityIcon />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No activity yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                            Trigger a webhook to see runs appear here in real time.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block mt-6 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {runs.map((run, i) => (
                            <RunRow key={run.id} run={run} index={i} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Prev
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${p === page
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
