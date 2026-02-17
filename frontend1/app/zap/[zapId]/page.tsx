import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from "@/component/editor/Canvas";

export default function ZapEditorPage() {
    return (
        <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
            <div className="flex-1 h-full relative flex flex-col min-w-0">
                <ReactFlowProvider>
                    <Canvas />
                </ReactFlowProvider>
            </div>
        </div>
    )
}
