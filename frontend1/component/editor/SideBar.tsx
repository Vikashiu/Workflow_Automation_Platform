"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BsLightningFill as ZapIcon } from "react-icons/bs";
import { FiSettings as SettingIcon, FiHome as HomeIcon } from "react-icons/fi";

const IconButton = ({
  icon: Icon,
  onClick,
  active,
  label
}: {
  icon: any,
  onClick: () => void,
  active?: boolean,
  label: string
}) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all duration-200 ${active
          ? "bg-orange-50 text-orange-600 shadow-sm"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
    >
      <Icon size={20} />
    </button>
    {/* Tooltip */}
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      {label}
    </div>
  </div>
);

export function SideBar() {
  const [activePanel, setActivePanel] = useState<string>("zap");
  const router = useRouter();

  return (
    <div className="w-20 h-full bg-gradient-to-b from-white via-white to-blue-50 border-r border-gray-200 flex flex-col items-center py-6 space-y-2 shadow-lg z-20">
      <IconButton
        icon={HomeIcon}
        onClick={() => router.push('/dashboard')}
        label="Dashboard"
      />

      <div className="w-10 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-3" />

      <IconButton
        icon={ZapIcon}
        active={activePanel === "zap"}
        onClick={() => setActivePanel("zap")}
        label="Flow"
      />

      <IconButton
        icon={SettingIcon}
        active={activePanel === "settings"}
        onClick={() => setActivePanel("settings")}
        label="Settings"
      />
    </div>
  );
}