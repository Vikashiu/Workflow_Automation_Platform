import { ReactNode } from "react"

export const PrimaryButton = ({ children, onClick, size = "small", className = "", disabled = false }: {
    children: ReactNode,
    onClick: () => void,
    size?: "big" | "small",
    className?: string,
    disabled?: boolean
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${className} ${size === "small" ? "text-sm px-6 py-2.5" : "text-lg px-8 py-3"} w-full rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-purple-600`}
        >
            {children}
        </button>
    )
}
