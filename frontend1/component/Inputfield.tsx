type InputFieldProps = {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
};

export function InputField({
  label,
  required = false,
  type = "text",
  value,
  onChange,
}: InputFieldProps) {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-700">
        {required && "* "} {label}
      </label>
      <input
        type={type}
        required={required}
        className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
