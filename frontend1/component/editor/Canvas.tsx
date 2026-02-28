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
  MarkerType,
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';

import { api } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/contexts/ToastContext";
import { TopBar } from "./Topbar";
import { SideBar } from "./SideBar";

import { ConfigurationSidebar } from "./ConfigurationSidebar";

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
    api.get<TriggerResponse>(API_ROUTES.TRIGGER.AVAILABLE)
      .then((data) => setAvailableTriggers(data.availableTriggers))
      .catch(console.error);

    api.get<ActionResponse>(API_ROUTES.ACTION.AVAILABLE)
      .then((data) => setAvailableActions(data.availableActions))
      .catch(console.error);
  }, []);

  return { availableActions, availableTriggers };
}

// --- Main Canvas Component ---

export function Canvas({ initialZapId }: { initialZapId?: string }) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { availableActions, availableTriggers } = useAvailableActionsAndTriggers();
  const { screenToFlowPosition } = useReactFlow();

  // Define custom node types
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [openSelectorModal, setOpenSelectorModal] = useState(false);
  const [triggerConfigOpen, setTriggerConfigOpen] = useState(false);
  const [actionConfigOpen, setActionConfigOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>("");
  const [zapName, setZapName] = useState("Untitled Zap");
  const [zapId, setZapId] = useState<string | null>(initialZapId ?? null);
  const [loadingZap, setLoadingZap] = useState(!!initialZapId);

  // Trigger sample fields — lifted here so they persist across sidebar open/close
  const [triggerSampleFields, setTriggerSampleFields] = useState<{ key: string; label: string; example: string }[]>([]);

  // --- LOAD EXISTING ZAP ---

  useEffect(() => {
    if (!initialZapId || availableTriggers.length === 0) return;

    let cancelled = false;
    setLoadingZap(true);

    api.get<{
      zap: {
        id: string;
        name?: string;
        trigger: { type: { id: string; name: string; image: string }; metadata: any };
        actions: { id: string; sortingOrder: number; type: { id: string; name: string; image: string }; metadata: any }[];
      }
    }>(API_ROUTES.ZAP.GET_BY_ID(initialZapId))
      .then(({ zap }) => {
        if (cancelled) return;

        // Set zap meta
        setZapId(zap.id);
        if (zap.name) setZapName(zap.name);

        // Hydrate trigger node
        const triggerType = zap.trigger?.type;
        const matchedTrigger = triggerType
          ? availableTriggers.find(t => t.id === triggerType.id) ?? null
          : null;
        if (matchedTrigger) setSelectedTrigger(matchedTrigger);

        const triggerNode: Node = {
          id: "1",
          type: "custom",
          data: {
            label: triggerType?.name ?? "Select Trigger",
            subtitle: "1. Trigger",
            icon: triggerType?.image ?? "",
            metadata: zap.trigger?.metadata ?? {},
          },
          position: { x: 250, y: 50 },
          deletable: false,
        };

        // Hydrate action nodes in order
        const sortedActions = [...(zap.actions ?? [])].sort(
          (a, b) => a.sortingOrder - b.sortingOrder
        );
        const actionNodes: Node[] = sortedActions.map((action, index) => ({
          id: `action-${action.id}`,
          type: "custom",
          data: {
            label: action.type?.name ?? "Select Action",
            subtitle: `${index + 2}. Action`,
            icon: action.type?.image ?? "",
            metadata: action.metadata ?? {},
          },
          position: { x: 250, y: 50 + (index + 1) * 200 },
        }));

        const allNodes: Node[] = [triggerNode, ...actionNodes];
        setNodes(allNodes);

        // Hydrate edges
        const newEdges: Edge[] = [];
        for (let i = 0; i < allNodes.length - 1; i++) {
          newEdges.push({
            id: `e${allNodes[i].id}-${allNodes[i + 1].id}`,
            source: allNodes[i].id,
            target: allNodes[i + 1].id,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          });
        }
        setEdges(newEdges);
      })
      .catch(err => {
        if (!cancelled) {
          console.error("Failed to load zap:", err);
          toastError("Could not load zap data. Starting fresh.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingZap(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialZapId, availableTriggers.length]);

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

  const refreshNodeLabels = useCallback((_: Node[], currentEdges: Edge[]) => {
    // We ignore currentNodes to ensure we never use a stale captured state 
    // and always use the atomic 'nds' from the setNodes dispatcher.
    setNodes(nds => {
      const sorted = getSortedNodes(nds, currentEdges);

      return nds.map((n) => {
        const index = sorted.findIndex(s => s.id === n.id);
        if (index === -1) return n; // Unconnected or orphan node

        const type = index === 0 ? "Trigger" : "Action";
        const isLast = index === sorted.length - 1;
        const newSubtitle = `${index + 1}. ${type}`;

        const hasChanges = n.data.subtitle !== newSubtitle || n.data.isLast !== isLast || !n.data.onAddNext;

        if (hasChanges) {
          return {
            ...n,
            data: {
              ...n.data, // preserve icon, label, etc. safely!
              subtitle: newSubtitle,
              isLast: isLast,
              onAddNext: (parentId: string) => {
                const newId = crypto.randomUUID();
                setNodes(currentNs => {
                  const parentNode = currentNs.find(pn => pn.id === parentId);
                  if (!parentNode) return currentNs;

                  const newNode: Node = {
                    id: newId,
                    position: { x: parentNode.position.x, y: parentNode.position.y + 200 },
                    type: 'custom',
                    data: {
                      label: "Select Action",
                      subtitle: "Action",
                      icon: "",
                      metadata: {}
                    },
                    origin: [0.5, 0], // nodeOrigin
                  };
                  return [...currentNs, newNode];
                });

                setEdges(currentEs => {
                  const newEdge: Edge = {
                    id: `e${parentId}-${newId}`,
                    source: parentId,
                    target: newId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#6366f1', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
                  };
                  return [...currentEs, newEdge];
                });
              }
            }
          };
        }
        return n;
      });
    });
  }, [getSortedNodes, setNodes, setEdges]);

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
        const trigger = availableTriggers.find(t => t.name === label);
        if (trigger) {
          setSelectedTrigger(trigger);
          setTriggerConfigOpen(true);
        } else {
          setOpenSelectorModal(true);
        }
      } else {
        const action = availableActions.find(a => a.name === label);
        if (action) {
          setSelectedAction(action);
          setActionConfigOpen(true);
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
    setTriggerConfigOpen(false);
    setActionConfigOpen(false);
  };

  const handleSelectComponent = async (item: Trigger | Action, type: 'trigger' | 'action') => {
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

    if (type === 'trigger') {
      setSelectedTrigger(item as Trigger);

      // Auto-save zap if it isn't saved yet
      if (!zapId) {
        try {
          const res = await api.post<{ zapId: string }>(API_ROUTES.ZAP.CREATE, {
            availableTriggerId: item.id,
            triggerMetadata: {},
            name: zapName,
            actions: []
          });
          const newZapId = res.zapId;
          if (newZapId) {
            setZapId(newZapId);
            window.history.replaceState(null, '', `/zap/${newZapId}`);
            toastSuccess("Zap saved automatically!");
          }
        } catch (e) {
          console.error(e);
          toastError("Could not auto-save Zap. You may need to publish manually.");
        }
      }
      setTriggerConfigOpen(true);
    }

    if (type === 'action') {
      setSelectedAction(item as Action);
      setActionConfigOpen(true);
    }
  };

  const handlePublish = async () => {
    // 1. Traverse strictly from Root
    const sortedNodes = getSortedNodes(nodes, edges);
    if (sortedNodes.length < 2) {
      toastWarning("Zap must have at least a trigger and one action.");
      return;
    }

    const triggerNode = sortedNodes[0];
    if ((triggerNode.data.label as string).startsWith("Select")) {
      toastWarning("Please configure the trigger.");
      return;
    }

    const triggerName = triggerNode.data.label as string;
    const trigger = availableTriggers.find(t => t.name === triggerName);
    if (!trigger) {
      toastError("Invalid trigger configuration.");
      return;
    }

    const actions = sortedNodes.slice(1).map((n, index) => {
      const name = n.data.label as string;
      if (name.startsWith("Select")) return null;
      const action = availableActions.find(a => a.name === name);
      if (!action) return null;

      return {
        availableActionId: action.id,
        sortingOrder: index,
        actionMetadata: n.data.metadata || {},
      };
    }).filter(Boolean);

    if (actions.length === 0) {
      toastWarning("Please add at least one valid action.");
      return;
    }

    try {
      if (zapId) {
        // Update existing zap with new actions
        await api.put<any>(API_ROUTES.ZAP.UPDATE(zapId), {
          availableTriggerId: trigger.id,
          triggerMetadata: {},
          name: zapName,
          actions,
        });
        toastSuccess("Zap updated successfully!");
      } else {
        // Create new zap from scratch
        await api.post<any>(API_ROUTES.ZAP.CREATE, {
          availableTriggerId: trigger.id,
          triggerMetadata: {},
          name: zapName,
          actions,
        });
        toastSuccess("Zap published successfully!");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toastError("Failed to publish zap. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <TopBar handlePublish={handlePublish} zapName={zapName} setZapName={setZapName} />

      {/* Loading overlay while fetching existing zap data */}
      {loadingZap && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <svg className="animate-spin w-10 h-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading zap…</p>
        </div>
      )}

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



      {/* Trigger Configuration Sidebar */}
      <ConfigurationSidebar
        isOpen={triggerConfigOpen}
        onClose={() => setTriggerConfigOpen(false)}
        selectedNodeId={activeNodeId}
        selectedAction={null}
        selectedTrigger={selectedTrigger}
        updateNodeMetadata={updateNodeMetadata}
        zapId={zapId || undefined}
        nodes={nodes}
        triggerSampleFields={triggerSampleFields}
        onTriggerSampleFields={setTriggerSampleFields}
      />

      {/* Action Configuration Sidebar */}
      <ConfigurationSidebar
        isOpen={actionConfigOpen}
        onClose={() => setActionConfigOpen(false)}
        selectedNodeId={activeNodeId}
        selectedAction={selectedAction}
        selectedTrigger={null}
        updateNodeMetadata={updateNodeMetadata}
        zapId={zapId || undefined}
        nodes={nodes}
        triggerSampleFields={triggerSampleFields}
        onChangeAction={() => {
          setActionConfigOpen(false);
          setOpenSelectorModal(true);
        }}
      />

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
