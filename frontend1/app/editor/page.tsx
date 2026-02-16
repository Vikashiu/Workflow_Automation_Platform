import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from "@/component/editor/Canvas";
import { SideBar } from "@/component/editor/SideBar";
// import { TopBar } from "@/component/editor/Topbar";



export default function () {

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      <SideBar />
      <div className="flex-1 h-full relative flex flex-col min-w-0">
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </div>
    </div>
  )

}

