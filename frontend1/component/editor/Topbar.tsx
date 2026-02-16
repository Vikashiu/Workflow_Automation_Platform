
import { useRouter } from "next/navigation";

import { BACKEND_URL } from "@/app/config";
import axios from "axios";

// Fallback Icon if lucide not working
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export function TopBar({ handlePublish, zapName, setZapName }: {
  handlePublish: () => void;
  zapName: string;
  setZapName: (name: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="h-16 bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 w-full shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-110 active:scale-95"
          title="Go back"
        >
          <ChevronLeftIcon />
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <input
          value={zapName}
          onChange={(e) => setZapName(e.target.value)}
          className="font-bold text-lg text-gray-900 border-2 border-transparent focus:border-purple-400 bg-transparent px-2 py-1 rounded-lg hover:bg-gray-50 focus:bg-white transition-all outline-none w-80 placeholder-gray-400"
          placeholder="Untitled Zap"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={async () => {
            try {
              const res = await axios.get<any>(`${BACKEND_URL}/auth`, {
                headers: {
                  'Authorization': localStorage.getItem('token'),
                }
              });
              window.location.href = res.data.url;
            } catch (e) {
              console.error(e);
            }
          }}
          className="text-sm px-4 py-2.5 text-gray-700 hover:text-gray-900 font-semibold bg-white hover:bg-gray-50 rounded-lg transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md active:scale-95"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Connect Apps
          </span>
        </button>

        <button
          onClick={handlePublish}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-lg transition-all hover:shadow-purple-400/50 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Publish
        </button>
      </div>
    </div>
  );
}
