export default function Topbar() {
  return (
    <header className="bg-white px-6 py-4 flex justify-between items-center border-b">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search Zaps..."
          className="px-3 py-1 border rounded"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Create Zap</button>
      </div>
    </header>
  );
}
