"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  Edge,
  Node,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  FinalConnectionState,
  useReactFlow,
  getIncomers,
  getOutgoers,
  MarkerType,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import axios from "axios";

import { BACKEND_URL } from "@/app/config";
import { TopBar } from "./Topbar";
import { SideBar } from "./SideBar";
import { EmailSelector } from "./selectors/EmailSelector";
import { SolanaSelector } from "./selectors/SolanaSelector";
import { GoogleCalendarSelector } from "./selectors/GoogleCalendarSelector";
import { GoogleSheetSelector } from "./selectors/GoogleSheetSelector";
import { GeminiSelector } from "./selectors/GeminiSelector";
import { NotionSelector } from "./selectors/NotionSelector";
import { SlackSelector } from "./selectors/SlackSelector";
import { DiscordSelector } from "./selectors/DiscordSelector";

import CustomNode from "./CustomNode";
import type { Trigger, Action, TriggerResponse, ActionResponse } from "@/type/editorsType";

const nodeOrigin: [number, number] = [0.5, 0];

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      label: "Select Trigger",
      subtitle: "1. Trigger",
      icon: "",
      metadata: {}
    },
    position: { x: 250, y: 50 },
    deletable: false, // Prevents backspace deletion for root
  },
];

const initialEdges: Edge[] = [];

// --- Custom Hook for Data ---

function useAvailableActionsAndTriggers() {
  const [availableActions, setAvailableActions] = useState<Action[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState<Trigger[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { authorization: token } : {};

    axios
      .get<TriggerResponse>(`${BACKEND_URL}/api/v1/trigger/available`, { headers })
      .then((x) => setAvailableTriggers(x.data.availableTriggers))
      .catch(console.error);

    axios
      .get<ActionResponse>(`${BACKEND_URL}/api/v1/action/available`, { headers })
      .then((x) => setAvailableActions(x.data.availableActions))
      .catch(console.error);
  }, []);

  return { availableActions, availableTriggers };
}

// --- Main Canvas Component ---

export function Canvas() {
  const router = useRouter();
  const { availableActions, availableTriggers } = useAvailableActionsAndTriggers();
  const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  // Define custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [openSelectorModal, setOpenSelectorModal] = useState(false);
  const [openConfigModal, setConfigModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>("");
  const [zapName, setZapName] = useState("Untitled Zap");

  // --- TRAVERSAL & RENUMBERING ---

  // Helper: Sort nodes by flow order starting from root "1"
  const getSortedNodes = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const sorted: Node[] = [];
    const nodeMap = new Map(currentNodes.map(n => [n.id, n]));

    let currentId: string | undefined = "1";
    while (currentId && nodeMap.has(currentId)) {
      sorted.push(nodeMap.get(currentId)!);
      const edge = currentEdges.find(e => e.source === currentId);
      currentId = edge ? edge.target : undefined;
    }
    return sorted;
  }, []);

  const refreshNodeLabels = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const sorted = getSortedNodes(currentNodes, currentEdges);

    // Update subtitles with sequence numbers for all nodes in the path
    const updates = sorted.map((node, index) => {
      const type = index === 0 ? "Trigger" : "Action";
      const isLast = index === sorted.length - 1;
      return {
        id: node.id,
        data: {
          ...node.data,
          subtitle: `${index + 1}. ${type}`,
          isLast: isLast,
          onAddNext: (parentId: string) => {
            // Logic to add next node
            const parentNode = sorted.find(n => n.id === parentId);
            if (!parentNode) return;

            const newId = crypto.randomUUID();
            const newNode: Node = {
              id: newId,
              position: { x: parentNode.position.x, y: parentNode.position.y + 200 }, // Offset Y
              type: 'custom',
              data: {
                label: "Select Action",
                subtitle: "Action",
                icon: "",
                metadata: {}
              },
              origin: nodeOrigin,
            };

            const newEdge: Edge = {
              id: `e${parentId}-${newId}`,
              source: parentId,
              target: newId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#6366f1', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            };

            setNodes((nds) => [...nds, newNode]);
            setEdges((eds) => {
              const updated = [...eds, newEdge];
              setTimeout(() => refreshNodeLabels([...nodes, newNode], updated), 0);
              return updated;
            });
          }
        }
      };
    });

    // Apply updates if changed
    setNodes(nds => nds.map(n => {
      const update = updates.find(u => u.id === n.id);
      if (update) {
        const hasChanges = update.data.subtitle !== n.data.subtitle || update.data.isLast !== n.data.isLast;
        const hasFunction = !!n.data.onAddNext;

        if (hasChanges || !hasFunction) {
          return { ...n, data: { ...n.data, ...update.data } };
        }
      }
      return n;
    }));
  }, [getSortedNodes, setNodes]);

  // --- EVENT HANDLERS ---

  const onConnect = useCallback(
    (params: Connection) => {
      // Strict Sequential: Ensure source has no other outgoing, target has no other incoming
      // But allow replacing? ReactFlow 'addEdge' doesn't replace by default.
      // Let's block multi-path.

      const sourceEdges = edges.filter(e => e.source === params.source);
      if (sourceEdges.length > 0) return; // Block branching

      const targetEdges = edges.filter(e => e.target === params.target);
      if (targetEdges.length > 0) return; // Block merge

      setEdges((eds) => {
        const newEdges = addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        }, eds);

        // Trigger label refresh after visible update (useLayoutEffect might be better but this works)
        setTimeout(() => refreshNodeLabels(nodes, newEdges), 0);
        return newEdges;
      });
    },
    [edges, nodes, refreshNodeLabels, setEdges]
  );

  const onConnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      connectionState: FinalConnectionState
    ) => {
      if (!connectionState.isValid && connectionState.fromNode) {
        // Only allow adding if this node is the LAST one (or has no output)
        // Check if fromNode has outgoing edges
        const sourceEdges = edges.filter(e => e.source === connectionState.fromNode!.id);
        if (sourceEdges.length > 0) {
          // Already connected, don't branch.
          return;
        }

        const id = (parseInt(nodes[nodes.length - 1].id) + 1).toString(); // Simple ID gen, can be uuid
        // Better unique ID generation
        const newId = crypto.randomUUID();

        const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

        const newNode: Node = {
          id: newId,
          position: screenToFlowPosition({ x: clientX, y: clientY }),
          type: 'custom',
          data: {
            label: "Select Action",
            subtitle: "Action", // Will be updated by refresh
            icon: "",
            metadata: {}
          },
          origin: nodeOrigin,
        };

        const newEdge: Edge = {
          id: `e${connectionState.fromNode!.id}-${newId}`,
          source: connectionState.fromNode!.id,
          target: newId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => {
          const updated = [...eds, newEdge];
          setTimeout(() => refreshNodeLabels([...nodes, newNode], updated), 0);
          return updated;
        });
      }
    },
    [screenToFlowPosition, nodes, edges, setNodes, setEdges, refreshNodeLabels]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      // For each deleted node, reconnect its Incomer to its Outgoer
      // We process one by one

      let currentNodes = [...nodes];
      let currentEdges = [...edges];

      deleted.forEach((node) => {
        const incomerEdge = currentEdges.find(e => e.target === node.id);
        const outgoerEdge = currentEdges.find(e => e.source === node.id);

        if (incomerEdge && outgoerEdge) {
          // Creating a bridge
          const newEdge: Edge = {
            id: `e${incomerEdge.source}-${outgoerEdge.target}`,
            source: incomerEdge.source,
            target: outgoerEdge.target,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          };
          currentEdges.push(newEdge);
        }

        // Edges connected to deleted node are automatically removed by ReactFlow logic usually,
        // but we manual manage for state consistency if needed. 
        // ReactFlow's onNodesDelete fires AFTER deletion? No, usually accompanying.
        // Note: standard useNodesState handles 'onNodesChange' which does deletion. 
        // 'onNodesDelete' is a callback side effect.

        // Actually, we must manually update edges if we want to add the bridge. 
        // The 'edges' state will be filtered by 'onEdgesChange' automatically for the deleted node, 
        // but NOT strictly adding new ones.
      });

      // We need to apply the bridge edges to the state.
      // Since 'onNodesDelete' passes the nodes being deleted, we assume edges are cleaning up via onEdgesChange.
      // We just need to ADD the new bridge edges.

      const bridges: Edge[] = [];
      deleted.forEach(node => {
        const incomer = edges.find(e => e.target === node.id);
        const outgoer = edges.find(e => e.source === node.id);
        if (incomer && outgoer) {
          bridges.push({
            id: `e${incomer.source}-${outgoer.target}`,
            source: incomer.source,
            target: outgoer.target,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          });
        }
      });

      setEdges(eds => [...eds, ...bridges]);

      // Delay label refresh to next tick to allow deletion to settle
      setTimeout(() => {
        // We can't use 'nodes' directly because it might be stale?
        // We should fetch fresh from store if possible, or assume deletion happened.
        // Since we setNodes via onNodesChange, we trust visual state updates.
        // But to be safe, let's force a refresh based on the remaining graph.

        // It's tricky to get "next state" inside this callback effectively for logic.
        // But visually, the user will see keys updating.
        // We just need to trigger the hook.
        // Actually, 'refreshNodeLabels' inside a useEffect on 'edges' might be cleaner.
      }, 50);
    },
    [nodes, edges, setEdges]
  );

  // Auto-refresh labels when edges change structure (simple approach)
  useEffect(() => {
    // Use efficient check to avoid infinite loop
    // We only care if order changed. 
    const tId = setTimeout(() => {
      refreshNodeLabels(nodes, edges);
    }, 100);
    return () => clearTimeout(tId);
  }, [edges.length, nodes.length]); // Depend on counts change for now (add/delete)


  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setActiveNodeId(node.id);
    const label = node.data.label as string;
    const isGeneric = label.startsWith("Select");

    if (isGeneric) {
      setOpenSelectorModal(true);
    } else {
      if (node.id === "1") {
        setOpenSelectorModal(true);
      } else {
        const action = availableActions.find(a => a.name === label);
        if (action) {
          setSelectedAction(action);
          setConfigModal(true);
        } else {
          setOpenSelectorModal(true);
        }
      }
    }
  };

  const updateNodeMetadata = (metadata: any) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === activeNodeId) {
        return { ...node, data: { ...node.data, metadata } };
      }
      return node;
    }));
    setConfigModal(false);
  };

  const handleSelectComponent = (item: Trigger | Action, type: 'trigger' | 'action') => {
    setNodes(nds => nds.map(n => {
      if (n.id === activeNodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            label: item.name,
            subtitle: n.data.subtitle, // Keep existing subtitle ("1. Trigger")
            icon: item.image
          }
        };
      }
      return n;
    }));
    setOpenSelectorModal(false);

    if (type === 'action') {
      setSelectedAction(item as Action);
      setConfigModal(true);
    }
  };

  const handlePublish = async () => {
    // 1. Traverse strictly from Root
    const sortedNodes = getSortedNodes(nodes, edges);
    if (sortedNodes.length < 2) {
      alert("Zap must have at least a trigger and one action.");
      return;
    }

    const triggerNode = sortedNodes[0];
    if ((triggerNode.data.label as string).startsWith("Select")) {
      alert("Please configure the trigger.");
      return;
    }

    const triggerName = triggerNode.data.label as string;
    const trigger = availableTriggers.find(t => t.name === triggerName);
    if (!trigger) {
      alert("Invalid trigger configuration.");
      return;
    }

    const actions = sortedNodes.slice(1).map((n, index) => {
      const name = n.data.label as string;
      if (name.startsWith("Select")) return null;
      const action = availableActions.find(a => a.name === name);
      if (!action) return null;

      return {
        availableActionId: action.id,
        sortingOrder: index, // 0-based index for actions
        actionMetadata: n.data.metadata || {},
      };
    }).filter(Boolean);

    if (actions.length === 0) {
      alert("Please add at least one valid action.");
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/v1/zap/create`, {
        availableTriggerId: trigger.id,
        triggerMetadata: {},
        name: zapName,
        actions,
      }, {
        headers: { Authorization: localStorage.getItem("token") || "" },
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to publish zap.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <TopBar handlePublish={handlePublish} zapName={zapName} setZapName={setZapName} />

      <div className="flex flex-1 h-full relative">
        <SideBar />
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            onNodesDelete={onNodesDelete}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap className="bg-white dark:bg-slate-800 border dark:border-slate-700" maskColor="rgba(0,0,0,0.1)" />
            <Controls className="bg-white dark:bg-slate-800 border dark:border-slate-700 fill-slate-500" />
            <Background gap={16} size={1} color="#cbd5e1" />
          </ReactFlow>
        </div>
      </div>

      {/* --- MODALS (Selector & Config) --- */}
      {openSelectorModal && (
        <Modal onClose={() => setOpenSelectorModal(false)} title="Select Component">
          <div className="space-y-4">
            {activeNodeId === "1" ? (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Available Triggers</h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableTriggers.map((t) => (
                    <button key={t.id} onClick={() => handleSelectComponent(t, 'trigger')} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all text-left">
                      <img src={t.image} alt={t.name} className="w-8 h-8 object-contain" />
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Available Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableActions.map((a) => (
                    <button key={a.id} onClick={() => handleSelectComponent(a, 'action')} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all text-left">
                      <img src={a.image} alt={a.name} className="w-8 h-8 object-contain" />
                      <span className="font-medium text-slate-700 dark:text-slate-200">{a.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {openConfigModal && selectedAction && (
        <Modal onClose={() => setConfigModal(false)} title={`Configure ${selectedAction.name}`}>
          {selectedAction.name === "email" && <EmailSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Solana" && <SolanaSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Google Calender" && <GoogleCalendarSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Google Sheet" && <GoogleSheetSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Gemini" && <GeminiSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Notion" && <NotionSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Slack" && <SlackSelector setMetadata={updateNodeMetadata} />}
          {selectedAction.name === "Discord" && <DiscordSelector setMetadata={updateNodeMetadata} />}

          {!["email", "Solana", "Google Calender", "Google Sheet", "Gemini", "Notion", "Slack", "Discord"].includes(selectedAction.name) && (
            <div className="text-center py-8 text-slate-500">
              No configuration needed for this action.
              <div className="mt-4">
                <button onClick={() => updateNodeMetadata({})} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Save & Close</button>
              </div>
            </div>
          )}
        </Modal>
      )}

    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
