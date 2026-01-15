type AuthProviderButtonProps = {
  icon: React.ReactNode;
  text: string;
  bgColor: string;
  textColor?: string;
  border?: string;
};

export default function AuthProviderButton({
  icon,
  text,
  bgColor,
  textColor = "text-white",
  border = "",
}: AuthProviderButtonProps) {
  return (
    <button
      className={`flex items-center gap-3 w-full px-4 py-2 rounded-md font-medium ${bgColor} ${textColor} ${border}`}
    >
      {icon}
      <span className="flex-1 text-center">{text}</span>
    </button>
  );
}
