
export const Input = ({ label, placeholder, onChange, type = "text" }: {
    label: string;
    placeholder: string;
    onChange: (e: any) => void;
    type?: string
}) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} <span className="text-red-500">*</span>
            </label>
            <input
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
                type={type}
                placeholder={placeholder}
                onChange={onChange}
            />
        </div>
    )
}
