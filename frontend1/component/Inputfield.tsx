import { Input } from "./ui/Input";

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
    <Input
      label={label}
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      containerClassName="mb-4"
    />
  );
}
