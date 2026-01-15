type ZapItemProps = {
  title: string;
  apps: string[];
  tasks: string;
  status: "active" | "paused" | "error";
  time: string;
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

export default function ZapItem({ title, apps, tasks, status, time }: ZapItemProps) {
  return (
    <div className="p-4 bg-white shadow-sm rounded-lg flex justify-between items-center">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{apps.join(" → ")}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">{tasks} tasks</p>
        <p className="text-sm text-gray-400">{time}</p>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
