import { Handle, Position, useReactFlow } from '@xyflow/react';

const CustomNode = ({ id, data, selected }: { id: string, data: any, selected: boolean }) => {
    const { deleteElements } = useReactFlow();

    return (
        <div className={`relative px-3 py-2 shadow-md rounded-lg bg-white dark:bg-slate-800 border-2 transition-colors min-w-[140px] max-w-[200px] group ${selected ? 'border-primary-500 shadow-lg' : 'border-slate-200 dark:border-slate-700'}`}>

            {/* Delete Button (Visible on hover or selected, but not for Node 1) */}
            {id !== "1" && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent node selection
                        deleteElements({ nodes: [{ id }] });
                    }}
                    className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 ${selected ? 'opacity-100' : ''}`}
                    title="Delete Step"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            )}

            <div className="flex items-center gap-3">
                {/* Icon Area */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                    {data.icon ? (
                        <img src={data.icon} alt="icon" className="w-4 h-4 object-contain" />
                    ) : (
                        <span className="text-sm font-bold text-slate-400">?</span>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{data.subtitle}</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate w-full" title={data.label}>{data.label}</span>
                </div>
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Top} className="w-8 !bg-slate-300 dark:!bg-slate-600 hover:!bg-primary-500 transition-colors rounded-full h-1.5" />
            <Handle type="source" position={Position.Bottom} className="w-8 !bg-slate-300 dark:!bg-slate-600 hover:!bg-primary-500 transition-colors rounded-full h-1.5" />

            {/* Add Button - Only if isLast */}
            {data.isLast && (
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-50">
                    {/* Vertical Line */}
                    <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-600"></div>
                    {/* Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (data.onAddNext) data.onAddNext(id);
                        }}
                        className="bg-slate-100 hover:bg-primary-100 dark:bg-slate-700 dark:hover:bg-primary-900/50 text-slate-500 hover:text-primary-600 border border-slate-300 dark:border-slate-600 rounded-full w-6 h-6 flex items-center justify-center transition-all shadow-sm transform hover:scale-110 active:scale-95"
                        title="Add Next Step"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomNode;
