
import { ReactNode } from "react"

export const PrimaryButton = ({ children, onClick, size = "small", disabled, className = "" }: {
    children: ReactNode,
    onClick: () => void,
    size?: "big" | "small",
    disabled?: boolean,
    className?: string
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${size === "small" ? "text-sm px-8 py-2" : "text-xl px-10 py-4"} 
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md"} 
                bg-amber-700 text-white rounded-full text-center flex justify-center flex-col transition-all ${className}`}
        >
            {children}
        </button>
    );
}
