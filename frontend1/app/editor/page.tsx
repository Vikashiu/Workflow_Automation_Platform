import { ReactFlowProvider } from '@xyflow/react';
import { Canvas }  from "@/component/editor/Canvas";
import { SideBar } from "@/component/editor/SideBar";
// import { TopBar } from "@/component/editor/Topbar";



export default function () {

    return <div className="h-screen">

        {/* top bar */}
        {/* <TopBar/> */}
        <div className="flex w-screen ">
        
          {/* side bar */}
          <SideBar/>
        <ReactFlowProvider>

          <Canvas/>
          
        </ReactFlowProvider>
          
        

        </div>
        
    </div>

}

