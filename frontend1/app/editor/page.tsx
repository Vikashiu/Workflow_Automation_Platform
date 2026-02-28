"use client";

import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from "@/component/editor/Canvas";
import { withAuth } from "@/contexts/AuthContext";

function EditorPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}

// Wrap with withAuth — unauthenticated users are redirected to /signin
export default withAuth(EditorPage);
