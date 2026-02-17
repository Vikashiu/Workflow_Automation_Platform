import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', containerClassName = '', label, error, ...props }, ref) => {
        return (
            <div className={`w-full ${containerClassName}`}>
                {label && (
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={`
                            w-full px-4 py-2.5
                            bg-slate-50 dark:bg-slate-900/50
                            border border-slate-200 dark:border-slate-700 
                            rounded-lg 
                            text-slate-900 dark:text-slate-100
                            placeholder-slate-400 
                            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                            disabled:opacity-60 disabled:cursor-not-allowed
                            transition-all duration-200
                            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
