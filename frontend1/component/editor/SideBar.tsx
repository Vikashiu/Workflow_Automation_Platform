"use client";

import {useState} from "react";

import { BsLightningFill as ZapIcon } from "react-icons/bs";
import { FiSettings as SettingIcon } from "react-icons/fi";


export function SideBar() {
    const [activePanel, setActivePanel] = useState<string | null> (null);

    const togglePanel = (panelName: string) => {
        setActivePanel((prev) => (prev === panelName ? null : panelName));
    }

    return <div className="">

        {/* Sidebar */}
      <div className="w-13 h-169  bg-gray-900 text-white flex flex-col items-center space-y-6 py-3">
        
        <button onClick={() => togglePanel("zap")} className="hover:text-yellow-400">
          <ZapIcon size={24} />
        </button>
        <button onClick={() => togglePanel("settings")} className="hover:text-yellow-400">
          <SettingIcon size={24} />
        </button>
      </div>
    </div>
}