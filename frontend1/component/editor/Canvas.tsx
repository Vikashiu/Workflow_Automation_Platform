"use client";
import { Modal } from "flowbite-react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { BACKEND_URL } from "@/app/config";
import React, { useState, useCallback, useRef, useEffect } from "react";
import canvasNavbar from "./canvasNavbar";
import { useRouter, useParams } from "next/navigation";
import { TopBar } from "./Topbar";
import type { Trigger, Action, TriggerResponse, ActionResponse } from "@/type/editorsType";
import { EmailSelector } from "./config-selectors/EmailSelector";
import { SolanaSelector } from "./config-selectors/SolanaSelector";
import { GoogleCalendarSelector } from "./config-selectors/GoogleCalendarSelector";
import { GoogleSheetSelector } from "./config-selectors/GoogleSheetSelector";
import { NotionSelector } from "./config-selectors/NotionSelector";
import { GeminiSelector } from "./config-selectors/GeminiSelector";
import ZapNode from "./ZapNode";
import AddButtonEdge from "./AddButtonEdge";
import { ConfigurationSidebar } from "./ConfigurationSidebar";

import {
  ReactFlow,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Edge,

  Node,
  MiniMap,
  useEdgesState,
  useNodesState,
  MarkerType,
  Connection,
  FinalConnectionState,
  getIncomers,
  getOutgoers,
  getConnectedEdges,

} from "@xyflow/react";
import '@xyflow/react/dist/style.css';

import { useReactFlow } from "@xyflow/react";
import { api } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { API_ROUTES } from "@/lib/constants";
import Topbar from "../dashboard/Topbar";


const nodeOrigin: [number, number] = [0.5, 0];

const nodeTypes = {
  zapNode: ZapNode,
};

const edgeTypes = {
  addButton: AddButtonEdge,
};


const initialNodes: Node[] = [
  {
    id: "1",
    type: "zapNode",
    data: { label: "Trigger", isTrigger: true, subtitle: "1. Start" },
    position: { x: 250, y: 50 },
    deletable: false,
  },

];

const initialEdges: Edge[] = [

];


function useAvailableActionsAndTriggers() {
  const [availableActions, setAvailableActions] = useState<Action[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState<Trigger[]>([]);

  useEffect(() => {
    api
      .get<TriggerResponse>(API_ROUTES.TRIGGER.AVAILABLE)
      .then((x) => setAvailableTriggers(x.availableTriggers));

    api
      .get<ActionResponse>(API_ROUTES.ACTION.AVAILABLE)
      .then((x) => setAvailableActions(x.availableActions));

    console.log(availableActions)
  }, []);

  return {
    availableActions,
    availableTriggers,
  };
}



export function Canvas() {
  const router = useRouter();
  const params = useParams(); // { zapId: '...' }
  const reactFlowWrapper = useRef(null);
  const { success, error } = useToast();

  const { availableActions, availableTriggers } = useAvailableActionsAndTriggers();
  const { getNode } = useReactFlow();


  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const [openModal, setOpenModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [zapName, setZapName] = useState("Untitled Zap");

  const filteredTriggers = availableTriggers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredActions = availableActions.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));


  const [nodeId, setNodeId] = useState("");

  // Load existing Zap data if we are in Edit mode
  useEffect(() => {
    if (params.zapId) {
      const fetchZap = async () => {
        try {
          const res = await api.get<any>(`${API_ROUTES.ZAP.GET_ALL}/${params.zapId}`);
          const zap = res.zap;

          if (!zap) return;

          setZapName(zap.name);

          const triggerNode: Node = {
            id: "1",
            type: "zapNode",
            data: {
              label: zap.trigger?.type?.name || "Trigger",
              isTrigger: true,
              subtitle: "1. Start",
              triggerId: zap.trigger?.type?.id,
              icon: zap.trigger?.type?.image || "",
              metadata: zap.trigger?.metadata || {}
            },
            position: { x: 250, y: 50 },
            deletable: false,
            origin: nodeOrigin
          };

          const sortedActions = (zap.actions || []).sort((a: any, b: any) => a.sortingOrder - b.sortingOrder);

          const actionNodes: Node[] = sortedActions.map((action: any, index: number) => {
            const nodeId = (index + 2).toString();
            return {
              id: nodeId,
              type: "zapNode",
              data: {
                label: action.type.name,
                isTrigger: false,
                subtitle: `${index + 2}. Action`,
                actionId: action.type.id,
                icon: action.type.image,
                metadata: action.metadata || {}
              },
              position: { x: 250, y: 150 + (index + 1) * 100 },
              origin: nodeOrigin
            };
          });

          const allNodes = [triggerNode, ...actionNodes];
          setNodes(allNodes);

          // Reconstruct Edges
          const newEdges: Edge[] = [];
          // Link Trigger to First Action
          if (actionNodes.length > 0) {
            newEdges.push({
              id: `e1-2`,
              source: "1",
              target: "2",
              type: 'addButton',
              animated: true,
              data: { onEdgeClick: () => { } }
            });
          }
          // Link Actions
          for (let i = 0; i < actionNodes.length - 1; i++) {
            const source = actionNodes[i].id;
            const target = actionNodes[i + 1].id;
            newEdges.push({
              id: `e${source}-${target}`,
              source,
              target,
              type: 'addButton',
              animated: true,
              data: { onEdgeClick: () => { } }
            });
          }
          setEdges(newEdges);

        } catch (err) {
          console.error("Failed to load zap", err);
          error("Failed to load zap details");
        }
      };

      fetchZap();
    }
  }, [params.zapId, setNodes, setEdges, setZapName, error]);


  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent branching: excessive outgoers
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode) {
        const outgoers = getOutgoers(sourceNode, nodes, edges);
        if (outgoers.length > 0) return; // Already has an output
      }

      const edge = { ...params, type: 'addButton', animated: false, data: { onEdgeClick: (id: string) => console.log("Add node on edge", id) } };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, nodes, edges],
  );

  const onConnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      connectionState: FinalConnectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid && connectionState.fromNode) {

        const sourceNode = nodes.find(n => n.id === connectionState.fromNode?.id);
        if (sourceNode) {
          const outgoers = getOutgoers(sourceNode, nodes, edges);
          if (outgoers.length > 0) return; // Prevent branching
        }

        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;

        const sourceId = connectionState.fromNode.id;
        const newNodeId = (Math.floor(Math.random() * 1000000)).toString();
        const nextStepIndex = nodes.length + 1;

        const newNode = {
          id: newNodeId,
          type: "zapNode",
          position: screenToFlowPosition({
            x: clientX - 90,
            y: clientY,
          }),
          data: { label: "Action", isTrigger: false, subtitle: `${nextStepIndex}. Action` },
          nodeOrigin: nodeOrigin,
        };

        const newEdge = {
          id: `e${sourceId}-${newNodeId}`,
          source: sourceId,
          target: newNodeId,
          type: 'addButton',
          animated: false,
          data: { onEdgeClick: (id: string) => console.log("Add node on edge", id) }
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [screenToFlowPosition, nodes, edges, setNodes, setEdges],
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const idsToDelete = new Set<string>();
      const updatedNodesMap = new Map<string, Node>();

      // Helper: recursively collect all outgoer node ids
      const collectOutgoerChain = (node: Node) => {
        if (idsToDelete.has(node.id)) return;

        idsToDelete.add(node.id);

        const outgoers = getOutgoers(node, nodes, edges);
        outgoers.forEach(collectOutgoerChain);
      };

      // Start from every deleted node
      deleted.forEach((node) => {
        // collect full downstream chain
        collectOutgoerChain(node);

        // Update incomers of the initially deleted node
        const incomers = getIncomers(node, nodes, edges);
        incomers.forEach((inNode) => {
          updatedNodesMap.set(inNode.id, {
            ...inNode,
            connectable: true,
          });
        });
      });

      // Delete nodes
      setNodes((prevNodes) => {
        const kept = prevNodes.filter((n) => !idsToDelete.has(n.id));
        const updated = Array.from(updatedNodesMap.values());

        const filteredKept = kept.filter(
          (n) => !updatedNodesMap.has(n.id)
        );

        return [...filteredKept, ...updated];
      });

      // Delete all connected edges
      setEdges((prevEdges) =>
        prevEdges.filter(
          (e) =>
            !idsToDelete.has(e.source) &&
            !idsToDelete.has(e.target)
        )
      );
    },
    [nodes, edges, setNodes, setEdges]
  );

  function onNodeClick(event: React.MouseEvent, node: Node) {
    // If clicking an Action Node that is already configured
    if (node.id !== "1" && node.data?.actionId) {
      const action = availableActions.find(a => a.id === node.data.actionId);
      if (action) {
        setSelectedAction(action);
        setNodeId(node.id);
        setOpenModal(false);
        return;
      }
    }

    // Default behavior (App Chooser)
    setOpenModal(true);
    setNodeId(node.id);
  }

  const updateNodeMetadata = (metadata: any) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          const newData: any = { ...node.data, metadata };
          // If saving an action, update its label/icon/ID here
          if (nodeId !== "1" && selectedAction) {
            newData.label = selectedAction.name;
            newData.icon = selectedAction.image;
            newData.actionId = selectedAction.id;
          }
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  const handlePublish = async () => {
    const triggerNode = nodes.find((n) => n.id === "1");

    if (!triggerNode || !triggerNode.data?.triggerId) {
      alert("Trigger not selected.");
      return;
    }

    const availableTriggerId = triggerNode.data.triggerId;

    const actions = nodes
      .filter(n => n.id !== triggerNode.id)
      .map(n => {
        return {
          availableActionId: n.data.actionId || "", // Use stored ID
          sortingOrder: parseInt(n.id) - 1,
          actionMetadata: n.data.metadata || {},
        };
      });

    try {
      await api.post(API_ROUTES.ZAP.CREATE, {
        availableTriggerId: availableTriggerId,
        actions,
        name: zapName
      });

      success("Zap Created!");
      router.push("/dashboard");
    } catch (err) {
      error("Failed to publish zap.");
    }
  };




  // Strict validation to prevent branching (1->Many) and merging (Many->1)
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // Check if source already has an outgoing connection
      const outgoers = getOutgoers(sourceNode, nodes, edges);
      if (outgoers.length > 0) return false;

      // Check if target already has an incoming connection
      const incomers = getIncomers(targetNode, nodes, edges);
      if (incomers.length > 0) return false;

      return true;
    },
    [nodes, edges]
  );

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 relative flex flex-col">
      <TopBar handlePublish={handlePublish} zapName={zapName} setZapName={setZapName} />
      <div className="flex-1 w-full relative">
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
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'addButton', animated: true, style: { stroke: '#a78bfa', strokeWidth: 2 } }}
          isValidConnection={isValidConnection}
          fitView
          className="bg-transparent"
        >
          <MiniMap className="!bg-white border border-gray-200 rounded-lg shadow-lg" />
          <Controls className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 shadow-lg rounded-lg overflow-hidden text-gray-700" />
          <Background
            color="#cbd5e1"
            gap={16}
            size={1}
            variant={BackgroundVariant.Dots}
          />
        </ReactFlow>
      </div>

      <Modal show={openModal} onClose={() => { setOpenModal(false); setSearchTerm(""); }} size="4xl" popup>
        <div className="bg-gradient-to-b from-white via-blue-50 to-purple-50 ease-out duration-300 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col p-8 border-b border-gray-200 bg-gradient-to-r from-white via-blue-50 to-purple-50">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-8 rounded-full bg-gradient-to-b from-purple-600 to-blue-600"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Choose Your {nodeId === "1" ? "Trigger" : "Action"}
                  </h2>
                </div>
                <p className="text-gray-600 font-medium ml-5">
                  {nodeId === "1"
                    ? "Select what should start this workflow"
                    : "Pick what happens next in your automation"}
                </p>
              </div>
              <button
                onClick={() => { setOpenModal(false); setSearchTerm(""); }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 hover:border-purple-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium focus:outline-none"
                placeholder="Search by app name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="p-8 bg-gradient-to-b from-slate-50/50 to-blue-50/30 min-h-[450px]">
            {nodeId === "1" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    onClick={() => {
                      const node = getNode(nodeId);
                      if (node != null) {
                        node.data.label = trigger.name;
                        node.data.icon = trigger.image;
                        node.data.triggerId = trigger.id;
                      }
                      setOpenModal(false);
                      setSearchTerm("");
                    }}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 flex items-center justify-center transition-all duration-300 border-2 border-blue-200 shadow-md">
                      <img className="w-10 h-10 object-contain" src={trigger.image} alt={trigger.name} />
                    </div>
                    <h3 className="font-bold text-slate-700 group-hover:text-blue-700 text-center transition-colors text-sm">{trigger.name}</h3>
                    <div className="mt-2 px-2 py-1 rounded-full text-xs font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      Trigger
                    </div>
                  </div>
                ))}
                {filteredTriggers.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="font-medium text-center">No triggers found</p>
                    <p className="text-sm mt-1">Try searching for "{searchTerm}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredActions.map((action) => (
                  <div
                    key={action.id}
                    onClick={() => {
                      setOpenModal(false);
                      setSearchTerm("");
                      setSelectedAction(action);
                      setNodes((nds) => nds.map(n => {
                        if (n.id === nodeId) {
                          return {
                            ...n,
                            data: {
                              ...n.data,
                              label: action.name,
                              icon: action.image,
                              actionId: action.id,
                            }
                          }
                        }
                        return n;
                      }));
                    }}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 flex items-center justify-center transition-all duration-300 border-2 border-purple-200 shadow-md">
                      <img className="w-10 h-10 object-contain" src={action.image} alt={action.name} />
                    </div>
                    <h3 className="font-bold text-slate-700 group-hover:text-purple-700 text-center transition-colors text-sm">{action.name}</h3>
                    <div className="mt-2 px-2 py-1 rounded-full text-xs font-semibold text-purple-600 bg-purple-50 group-hover:bg-purple-100 transition-colors">
                      Action
                    </div>
                  </div>
                ))}
                {filteredActions.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="font-medium text-center">No actions found</p>
                    <p className="text-sm mt-1">Try searching for "{searchTerm}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfigurationSidebar
        isOpen={!!selectedAction || (nodeId === "1" && !openModal)}
        onClose={() => {
          setSelectedAction(null);
          setNodeId("");
        }}
        selectedNodeId={nodeId}
        selectedAction={selectedAction}
        selectedTrigger={nodeId === "1" ? availableTriggers.find(t => t.id === nodes.find(n => n.id === "1")?.data?.triggerId) || null : null}
        updateNodeMetadata={updateNodeMetadata}
        zapId={params.zapId as string}
        nodes={nodes}
        onChangeAction={() => setOpenModal(true)}
      />

    </div>
  );
}
