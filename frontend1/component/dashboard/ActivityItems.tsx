type ActivityProps = {
  type: "created" | "completed" | "paused" | "error";
  message: string;
  time: string;
};

const colors = {
  created: "text-green-600",
  completed: "text-blue-600",
  paused: "text-yellow-600",
  error: "text-red-600",
};

export default function ActivityItem({ type, message, time }: ActivityProps) {
  return (
    <div className="flex justify-between items-start bg-white p-3 rounded shadow-sm">
      <div>
        <p className={`font-medium ${colors[type]}`}>{message}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
  );
}
