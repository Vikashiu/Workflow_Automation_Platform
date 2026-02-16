
import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Action, Trigger } from "@/type/editorsType";
import { NotionSelector } from "./config-selectors/NotionSelector";
import { GeminiSelector } from "./config-selectors/GeminiSelector";
import { GoogleSheetSelector } from "./config-selectors/GoogleSheetSelector";
import { EmailSelector } from "./config-selectors/EmailSelector";
import { GoogleCalendarSelector } from "./config-selectors/GoogleCalendarSelector";
import { SlackSelector } from "./config-selectors/SlackSelector";
import { DiscordSelector } from "./config-selectors/DiscordSelector";
import { api } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import { PrimaryButton } from "../buttons/PrimaryButton";

interface ConfigurationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedNodeId: string | null;
    selectedAction: Action | null;
    selectedTrigger: Trigger | null;
    updateNodeMetadata: (metadata: any) => void;
    zapId?: string;
    nodes?: Node[];
    onChangeAction?: () => void;
}

// Apps that require authentication
const APPS_REQUIRING_AUTH = [
    "Google Sheet",
    "Notion",
    "Google Calender",
    "Slack",
    "Discord",
    "Gemini"
];

const flattenObject = (obj: any, prefix = ''): { key: string, value: any }[] => {
    return Object.keys(obj).reduce((acc: any[], k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            acc.push(...flattenObject(obj[k], pre + k));
        } else {
            acc.push({ key: pre + k, value: obj[k] });
        }
        return acc;
    }, []);
};

type Tab = 'setup' | 'configure' | 'test';

export const ConfigurationSidebar = ({
    isOpen,
    onClose,
    selectedNodeId,
    selectedAction,
    selectedTrigger,
    updateNodeMetadata,
    zapId,
    nodes = [],
    onChangeAction = () => { }
}: ConfigurationSidebarProps) => {
    const { success, error } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('setup');

    // Test Data State
    const [fetchedFields, setFetchedFields] = useState<any[]>([]);
    const [isLoadingRun, setIsLoadingRun] = useState(false);
    const [testRunFound, setTestRunFound] = useState(false);
    const [isLoadingTest, setIsLoadingTest] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [hasTestedAction, setHasTestedAction] = useState(false);

    // Authentication State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Configuration State
    const [childKey, setChildKey] = useState("");

    // Calculate step number dynamically
    const getStepNumber = () => {
        if (!selectedAction) return 1;
        const nodeNum = parseInt(selectedNodeId || "1");
        return nodeNum;
    };

    const stepNumber = getStepNumber();
    const requiresAuth = APPS_REQUIRING_AUTH.includes(selectedAction?.name || selectedTrigger?.name || "");

    useEffect(() => {
        if (isOpen) {
            setActiveTab('setup');
            setTestResult(null);
            setHasTestedAction(false);
            setIsAuthenticated(false);
        }
    }, [isOpen, selectedTrigger?.id, selectedAction?.id]);

    const handleAuthenticate = async () => {
        setIsAuthenticating(true);
        try {
            // Simulate authentication process
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsAuthenticated(true);
            success(`${selectedAction?.name || selectedTrigger?.name} authenticated successfully!`);
        } catch (e) {
            error("Authentication failed. Please try again.");
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleTestTrigger = async () => {
        if (!zapId) {
            error("Save Zap first to test trigger");
            return;
        }
        setIsLoadingRun(true);
        try {
            const res = await api.get<any>(API_ROUTES.ZAP.GET_LATEST_RUN(zapId));
            // Check for payload, fall back to metadata if needed, though payload is preferred for triggers
            const dataToFlatten = res.run?.payload || res.run?.metadata;

            if (res.run && dataToFlatten) {
                // We flatten the payload with 'trigger' prefix so users see "trigger.body.email" etc.
                const flat = flattenObject(dataToFlatten, 'trigger');

                const fields = flat.map(f => ({
                    key: f.key,
                    label: f.key,
                    example: String(f.value).substring(0, 50)
                }));

                setFetchedFields(fields);
                setTestRunFound(true);
                success("We found a request!");
            } else {
                setTestRunFound(false);
                error("No request found. Try sending one to the webhook URL.");
            }
        } catch (e) {
            console.error(e);
            error("Failed to search for requests");
        } finally {
            setIsLoadingRun(false);
        }
    };

    const handleTestAction = async () => {
        if (!zapId) {
            error("Save Zap first to test action");
            return;
        }
        setIsLoadingTest(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setTestResult({
                status: 'success',
                message: `${selectedAction?.name} executed successfully!`,
                data: {
                    "id": "evt_12345",
                    "status": "completed",
                    "timestamp": new Date().toISOString(),
                }
            });
            setHasTestedAction(true);
            success("Test run successful!");
        } catch (e) {
            console.error(e);
            setTestResult({
                status: 'error',
                message: 'Test failed. Please check your configuration.',
            });
            error("Test run failed");
        } finally {
            setIsLoadingTest(false);
        }
    };

    if (!isOpen) return null;

    const currentItem = selectedAction || selectedTrigger;
    const isTrigger = !!selectedTrigger;

    // Previous steps data setup
    const previousStepsData = [
        {
            stepId: "trigger",
            stepName: "1. Webhook Trigger",
            fields: [
                ...fetchedFields.length > 0 ? fetchedFields : [
                    { key: "trigger.body", label: "Body (Sample)", example: "{...}" },
                    { key: "trigger.headers", label: "Headers" },
                    { key: "trigger.query", label: "Query Params" }
                ]
            ]
        }
    ];

    const copyUrl = () => {
        if (!zapId) return;
        const url = `${API_ROUTES.HOOKS.CATCH("1", zapId)}`;
        navigator.clipboard.writeText(url);
        success("Copied to clipboard!");
    };

    return (
        <div className="fixed right-0 top-16 bottom-0 w-[420px] bg-gradient-to-b from-white to-blue-50 border-l border-gray-300 shadow-2xl z-40 flex flex-col font-sans">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-white to-blue-50/50 relative">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg p-2 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 shadow-md">
                        <img
                            src={currentItem?.image}
                            alt={currentItem?.name}
                            className="w-7 h-7 object-contain"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {isTrigger ? '1. Catch Hook' : `${stepNumber}. ${currentItem?.name}`}
                            </h2>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-all hover:scale-110"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white">
                {isTrigger ? (
                    // Simplified Trigger View
                    <div className="p-6 space-y-6 h-full flex flex-col">
                        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-2">
                            <p className="text-sm text-blue-800">
                                ℹ️ &nbsp; Use the URL below to configure your external application.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Your webhook URL</h3>
                            <div className="flex gap-2 mb-2">
                                <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded overflow-hidden">
                                    <div className="px-3 py-2 border-r border-gray-300 bg-gray-100">
                                        <img src="https://assets.zapier.com/zapier/assets/app-icons/webhook/webhook-16.png" className="w-4 h-4 opacity-50 grayscale" alt="" />
                                    </div>
                                    <code className="px-3 py-2 text-xs text-gray-600 truncate flex-1 font-mono">
                                        {zapId ? `${API_ROUTES.HOOKS.CATCH("1", zapId)}` : "Save Zap to generate URL"}
                                    </code>
                                </div>
                                <button
                                    onClick={copyUrl}
                                    className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                We've generated a custom webhook URL for this Zap.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 py-4">
                            <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-orange-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="h-px flex-1 bg-gray-200"></div>
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                <div className="w-4 h-4 bg-gray-300 rounded-sm"></div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">We're listening!</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                To confirm your trigger is set up correctly, we'll find recent requests.
                            </p>
                        </div>

                        {fetchedFields.length > 0 && (
                            <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">✓</div>
                                    <span className="font-bold text-green-800 text-sm">Request found!</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto text-xs font-mono bg-white p-2 rounded border border-green-100">
                                    {fetchedFields.map(f => (
                                        <div key={f.key} className="flex justify-between border-b border-gray-50 py-1 last:border-0">
                                            <span className="font-semibold text-gray-600">{f.key}</span>
                                            <span className="text-gray-400 truncate ml-2 max-w-[150px]">{f.example}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto">
                            <PrimaryButton
                                onClick={handleTestTrigger}
                                disabled={isLoadingRun}
                                size="big"
                            >
                                {isLoadingRun ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Finding request...
                                    </span>
                                ) : (
                                    testRunFound ? "Retest trigger" : "Test trigger"
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                ) : (
                    // Standard Action View (with tabs)
                    <>
                        {/* Stepper Tabs */}
                        <div className="flex items-center px-6 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50/50">
                            {(['setup', 'configure', 'test'] as Tab[]).map((tab) => {
                                const isActive = activeTab === tab;
                                const labels = { setup: "Setup", configure: "Configure", test: "Test" };
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-1.5 py-3 px-1 mr-4 text-sm font-semibold border-b-3 transition-all ${isActive
                                            ? 'border-purple-600 text-purple-700 bg-purple-50/30'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/30'
                                            }`}
                                    >
                                        <span>{labels[tab]}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Setup Tab */}
                            {activeTab === 'setup' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 flex items-start gap-2">
                                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                            <span>Select your app and configure the basic settings</span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3">App Selection</label>
                                        <div className="flex items-center justify-between p-4 border-2 border-gray-200 hover:border-purple-300 rounded-lg bg-gradient-to-r from-white to-gray-50 cursor-pointer transition-all hover:shadow-md">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center border border-purple-100">
                                                    <img src={currentItem?.image} className="w-6 h-6 object-contain" alt={currentItem?.name} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{currentItem?.name}</p>
                                                    <p className="text-xs text-gray-500">Selected</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onChangeAction()}
                                                className="px-3 py-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-all"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-xs font-medium text-gray-700">Status:</p>
                                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Ready to configure
                                        </p>
                                    </div>

                                    {requiresAuth && (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-amber-900">Authentication Required</p>
                                                    <p className="text-xs text-amber-800 mt-1">{currentItem?.name} requires authentication to access your account.</p>
                                                    {!isAuthenticated && (
                                                        <button
                                                            onClick={handleAuthenticate}
                                                            disabled={isAuthenticating}
                                                            className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 rounded-md transition-all flex items-center gap-2"
                                                        >
                                                            {isAuthenticating ? (
                                                                <>
                                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                                    Signing in...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 000 2h.01a1 1 0 000-2H9z" clipRule="evenodd" /><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a1 1 0 001 1h12a1 1 0 001-1V6a2 2 0 00-2-2H4zm12.95 7H4.05a2.5 2.5 0 00-.95 4.95V16a2 2 0 002 2h8a2 2 0 002-2v-2.05a2.5 2.5 0 00-.95-4.95z" clipRule="evenodd" /></svg>
                                                                    Sign in with {currentItem?.name}
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {isAuthenticated && (
                                                        <div className="mt-3 flex items-center gap-2 text-green-700 text-sm font-semibold">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                            Connected successfully
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 space-y-3">
                                        <PrimaryButton
                                            onClick={() => setActiveTab('configure')}
                                        >
                                            Next: Configure
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )}

                            {/* Configure Tab */}
                            {activeTab === 'configure' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 flex items-start gap-2">
                                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 17v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" /></svg>
                                            <span>Configure how {currentItem?.name} should work with your data</span>
                                        </p>
                                    </div>

                                    <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                                        {/* Action Configuration Selectors */}
                                        {selectedAction?.name === "Google Sheet" && <GoogleSheetSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                        {selectedAction?.name === "Notion" && <NotionSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                        {selectedAction?.name === "Gemini" && <GeminiSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                        {selectedAction?.name === "email" && <EmailSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                        {selectedAction?.name === "Google Calender" && <GoogleCalendarSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                        {selectedAction?.name === "Slack" && <SlackSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                        {selectedAction?.name === "Discord" && <DiscordSelector setMetadata={updateNodeMetadata} previousSteps={previousStepsData} />}
                                    </div>

                                    <div className="pt-2 space-y-3 flex gap-3">
                                        <button
                                            onClick={() => setActiveTab('setup')}
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all"
                                        >
                                            Back
                                        </button>
                                        <div className="flex-1">
                                            <PrimaryButton
                                                onClick={() => setActiveTab('test')}
                                            >
                                                Next: Test
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Test Tab */}
                            {activeTab === 'test' && (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 flex items-start gap-2">
                                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            <span>Test your configuration before saving</span>
                                        </p>
                                    </div>

                                    {!hasTestedAction ? (
                                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                                            <div className="mb-4">
                                                <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Test</h3>
                                            <p className="text-sm text-gray-600 mb-6">Click below to run a test with your current configuration</p>
                                            <PrimaryButton
                                                onClick={handleTestAction}
                                                disabled={isLoadingTest}
                                            >
                                                {isLoadingTest ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Testing...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                        Run Test
                                                    </span>
                                                )}
                                            </PrimaryButton>
                                        </div>
                                    ) : testResult?.status === 'success' ? (
                                        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                                            <div className="mb-4 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-green-900 mb-2 text-center">Test Successful!</h3>
                                            <p className="text-sm text-green-800 mb-4 text-center">{testResult.message}</p>
                                            <div className="bg-green-50 rounded p-3 mb-4 text-xs font-mono text-green-900 max-h-32 overflow-y-auto">
                                                <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                                            </div>
                                            <div className="space-y-2">
                                                <PrimaryButton
                                                    className="w-full justify-center"
                                                    onClick={onClose}
                                                >
                                                    Save & Close
                                                </PrimaryButton>
                                                <button
                                                    onClick={handleTestAction}
                                                    className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all"
                                                    disabled={isLoadingTest}
                                                >
                                                    Test Again
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border-2 border-red-200 rounded-lg p-6">
                                            <div className="mb-4 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-red-900 mb-2 text-center">Test Failed</h3>
                                            <p className="text-sm text-red-800 mb-4 text-center">{testResult?.message || 'Something went wrong'}</p>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => setActiveTab('configure')}
                                                    className="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all"
                                                >
                                                    Back to Configure
                                                </button>
                                                <button
                                                    onClick={handleTestAction}
                                                    className="w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-all"
                                                    disabled={isLoadingTest}
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
