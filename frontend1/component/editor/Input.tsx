
export const Input = ({ label, placeholder, onChange, type = "text", value }: {
    label: string;
    placeholder?: string;
    onChange: (e: any) => void;
    type?: "text" | "password" | "email" | "number";
    value?: string;
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {label}
            </label>
            <input
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm placeholder:text-slate-400 text-slate-900 dark:text-white transition-all"
                type={type}
                placeholder={placeholder}
                onChange={onChange}
                value={value}
            />
        </div>
    );
}
