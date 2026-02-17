"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { useState } from "react";

export function TopBar({ handlePublish, zapName, setZapName }: {
  handlePublish: () => void;
  zapName: string;
  setZapName: (val: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConnectApp = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ url: string }>(`${BACKEND_URL}/auth`, {
        headers: { 'Authorization': token }
      });
      window.location.href = res.data.url;
    } catch (e) {
      console.error(e);
      alert("Failed to connect app. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center bg-white dark:bg-slate-900 w-full px-4 py-3 border-b border-slate-200 dark:border-slate-800 shadow-sm z-30">
      {/* Left: Back */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          }
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          Back
        </Button>
      </div>

      {/* Center: Zap Name */}
      <div className="flex items-center justify-center flex-1 max-w-lg mx-auto">
        <input
          type="text"
          value={zapName}
          onChange={(e) => setZapName(e.target.value)}
          placeholder="Name your Zap..."
          className="text-center font-semibold text-lg text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none transition-all px-2 py-1 w-full max-w-[300px]"
        />
        <button className="ml-2 text-slate-400 hover:text-primary-500 transition-colors" title="Edit Name">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnectApp}
          isLoading={loading}
          className="hidden sm:flex"
          leftIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>}
        >
          Connect App
        </Button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        <Button
          onClick={handlePublish}
          size="md"
          variant="primary"
          className="px-6 shadow-md hover:shadow-lg transition-all"
        >
          Publish
        </Button>
      </div>
    </div>
  );
}