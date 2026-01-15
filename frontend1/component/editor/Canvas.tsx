"use client";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "flowbite-react";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { BACKEND_URL } from "@/app/config";
import React, { useState, useCallback, useRef, useEffect } from "react";
import canvasNavbar from "./canvasNavbar";
import { useRouter } from "next/navigation";
import { TopBar } from "./Topbar";
import type { Trigger, Action, TriggerResponse, ActionResponse } from "@/type/editorsType";
import {
  ReactFlow,
  addEdge,
  Background,
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
import axios from "axios";
import Topbar from "../dashboard/Topbar";


const nodeOrigin: [number, number] = [0.5, 0];


const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "1. Trigger Node", metadata: {} },
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
    axios
      .get<TriggerResponse>(`${BACKEND_URL}/api/v1/trigger/available`)
      .then((x) => setAvailableTriggers(x.data.availableTriggers));

    axios
      .get<ActionResponse>(`${BACKEND_URL}/api/v1/action/available`)
      .then((x) => setAvailableActions(x.data.availableActions));

    console.log(availableActions)
  }, []);

  return {
    availableActions,
    availableTriggers,
  };
}



export function Canvas() {
  const router = useRouter();
  const reactFlowWrapper = useRef(null);

  const { availableActions, availableTriggers } = useAvailableActionsAndTriggers();
  const { getNode } = useReactFlow();


  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const [openModal, setOpenModal] = useState(false);
  const [openSecondModal, setSecondModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);


  const [nodeId, setNodeId] = useState("");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onConnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      connectionState: FinalConnectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position
        // const id = getId();

        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;

        const sourceId = (connectionState.fromNode != null) ? connectionState.fromNode.id : "2";
        const targetId = parseInt(sourceId) + 1;
        const edgeId = `e${sourceId}-${targetId.toString()}`;
        // setNodes((nds) => nds.concat(newNode));
        setNodes((nds) => {
          const updatedNodes = nds.map((node) => ({
            ...node,
            connectable: false,
          }));
          const newNode = {
            id: targetId.toString(),
            position: screenToFlowPosition({
              x: clientX - 90,
              y: clientY,
            }),
            data: { label: `${targetId}. Action` },
            nodeOrigin: nodeOrigin,
            connectable: true

          };
          return [...updatedNodes, newNode]

        })



        setEdges((eds) =>
          eds.concat({
            id: edgeId,
            source: sourceId,
            target: targetId.toString(),
            type: 'straight',

          }),
        );
      }
    },
    [screenToFlowPosition, setEdges, setNodes],
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
    setOpenModal(true);
    setNodeId(node.id);
    console.log(node);
    // setSelectedModalIndex(1);
  }

  const updateNodeMetadata = (metadata: any) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              metadata,
            },
          }
          : node
      )
    );
    setSecondModal(false);
  };

  const handlePublish = async () => {
    const triggerNode = nodes.find((n) => n.id === "1");

    if (!triggerNode || !triggerNode.data?.label) {
      alert("Trigger not selected.");
      return;
    }

    // Extracting 'webhook' from '1. webhook'
    const availableTriggerId = (triggerNode.data.label as string).split('. ')[1];

    const actions = nodes
      .filter(n => n.id !== triggerNode.id)
      .map(n => {
        const availableActionId = (n.data.label as string)?.split(". ")[1] || "";

        return {
          availableActionId,
          sortingOrder: parseInt(n.id) - 1,
          actionMetadata: n.data.metadata || {},
        };
      });

    try {
      await axios.post(`${BACKEND_URL}/api/v1/zap/create`, {
        availableTriggerId: availableTriggerId,
        actions,
      },
        {
          headers: {
            Authorization: localStorage.getItem("token") || "", // no Bearer prefix
          },
        }

      );

      alert("Zap Created!");
      router.push("/dashboard");
    } catch (err) {
      alert("Failed to publish zap.");
    }
  };




  return (
    <div className="bg-gray-100" style={{ width: "100%" }}>

      <TopBar handlePublish={handlePublish} />


      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodesDelete={onNodesDelete}
        onNodeClick={onNodeClick}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background color="black" bgColor="" gap={10} className="h-11/12" />
      </ReactFlow>

      <Modal show={openModal} onClose={() => setOpenModal(false)}>

        <div className="bg-white p-5 rounded-2xl flex flex-col gap-5">
          <div className="flex justify-between">
            <h2 className="text-2xl font-semibold">Select</h2>
            <Button color="gray" onClick={() => setOpenModal(false)}>Close</Button>
          </div>

          <div>
            {(nodeId == "1") ? <div className="flex flex-col gap-3 m-2">
              {availableTriggers.map((trigger) => (
                <div onClick={() => {
                  const node = getNode(nodeId);
                  if (node != null) node.data.label = `${node.id}. ${trigger.name}`
                  setOpenModal(false)
                }} className="flex gap-5 cursor-pointer h-5">
                  <img className="w-5 h-5 object-contain" src={`${trigger.image}`} alt="" />
                  <span>{trigger.name}</span>
                </div>
              )

              )}

            </div> : <div className="flex flex-col gap-3 m-2">

              {availableActions.map((action) => (
                <div onClick={() => {
                  const node = getNode(nodeId);
                  if (node != null) node.data.label = `${node.id}. ${action.name}`

                  setOpenModal(false)
                  setSelectedAction(action);
                  setSecondModal(true);

                }} className="flex gap-5 cursor-pointer h-5">

                  <img className="w-5 h-5 object-contain" src={`${action.image}`} alt="" />
                  <span>{action.name}</span>

                </div>
              ))}


            </div>
            }
          </div>
        </div>

      </Modal>


      <Modal show={openSecondModal} onClose={() => setSecondModal(false)}>
        <div className="bg-white p-5 rounded-2xl flex flex-col gap-5">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Configure: {selectedAction?.name}</h2>
            <Button color="gray" onClick={() => setSecondModal(false)}>Close</Button>
          </div>

          {/* You can add inputs here for configuration */}
          <div>
            {selectedAction?.name === "email" && <EmailSelector setMetadata={updateNodeMetadata} />}
            {selectedAction?.name === "Solana" && <SolanaSelector setMetadata={updateNodeMetadata} />}
            {selectedAction?.name === "Google Calender" && <GoogleCalendarSelector setMetadata={updateNodeMetadata} />}
            {selectedAction?.name === "Google Sheet" && <GoogleSheetSelector setMetadata={updateNodeMetadata} />}
          </div>
        </div>
      </Modal>

    </div>
  );
}

const Input = ({ label, placeholder, onChange, type = "text" }: {
  label: string;
  placeholder: string;
  onChange: (e: any) => void;
  type?: "text" | "password"
}) => {
  return <div>
    <div className="text-sm pb-1 pt-2">
      * <label>{label}</label>
    </div>
    <input className="border rounded px-4 py-2 w-full border-black" type={type} placeholder={placeholder} onChange={onChange} />
  </div>
}

function EmailSelector({ setMetadata }: {
  setMetadata: (params: any) => void;
}) {
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");

  return <div>
    <Input label={"To"} type={"text"} placeholder="To" onChange={(e) => setEmail(e.target.value)}></Input>
    <Input label={"Body"} type={"text"} placeholder="Body" onChange={(e) => setBody(e.target.value)}></Input>
    <div className="pt-2">
      <PrimaryButton onClick={() => {
        setMetadata({
          email,
          body
        })
      }}>Submit</PrimaryButton>
    </div>
  </div>
}

function SolanaSelector({ setMetadata }: {
  setMetadata: (params: any) => void;
}) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  return <div>
    <Input label={"To"} type={"text"} placeholder="To" onChange={(e) => setAddress(e.target.value)}></Input>
    <Input label={"Amount"} type={"text"} placeholder="To" onChange={(e) => setAmount(e.target.value)}></Input>
    <div className="pt-4">
      <PrimaryButton onClick={() => {
        setMetadata({
          amount,
          address
        })
      }}>Submit</PrimaryButton>
    </div>
  </div>
}


type CalendarEventMetadata = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
};

function GoogleCalendarSelector({
  setMetadata,
}: {
  setMetadata: (params: CalendarEventMetadata) => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const getOffset = () => {
    const offset = new Date().getTimezoneOffset(); // in minutes
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
    const minutes = String(absOffset % 60).padStart(2, "0");
    const sign = offset <= 0 ? "+" : "-";
    return `${sign}${hours}:${minutes}`;
  };

  const handleSubmit = () => {
    if (!start || !end || !title) {
      alert("Please fill in the title, start time, and end time.");
      return;
    }

    const offset = getOffset(); // e.g., "+05:30"
    const startWithOffset = `${start}${offset}`;
    const endWithOffset = `${end}${offset}`;

    const metadata: CalendarEventMetadata = {
      title,
      location,
      description,
      start: startWithOffset,
      end: endWithOffset,
    };

    console.log("✅ Metadata to save:", metadata);
    setMetadata(metadata);
    alert("Configuration saved!");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md border border-gray-200">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Configure Google Calendar Event
        </h3>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            placeholder="Meeting with the team"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            type="text"
            placeholder="e.g., Google Meet"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            placeholder="Discussing Q3 roadmap..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              id="start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              id="end"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}



const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const RefreshCwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;

interface Sheet { id: string; name: string; }
// interface SelectorProps { onSave: (metadata: any) => {} }

interface CustomDropdownProps {
  label: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  selectedValue: string | null | undefined;
  isLoading: boolean;
}

const CustomDropdown = ({ label, placeholder, options, onSelect, selectedValue, isLoading }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = selectedValue || placeholder;

  return (
    <div className="relative mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
      <button onClick={() => setIsOpen(!isOpen)} disabled={isLoading || !options.length} className="w-full flex justify-between items-center bg-white border border-gray-300 rounded-md px-3 py-2 text-left text-gray-800 disabled:bg-gray-100">
        <span>{isLoading ? "Loading..." : displayValue}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl">
          <ul className="py-1 max-h-60 overflow-y-auto">
            {options.map((option: string) => (
              <li key={option} onClick={() => { onSelect(option); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer">{option}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


function GoogleSheetSelector({ setMetadata }: {
  setMetadata: (params: any) => void;
}) {
  const [spreadsheets, setSpreadsheets] = useState<Sheet[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<Sheet | null>(null);

  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string | null>(null);

  const [columns, setColumns] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState({ spreadsheets: false, worksheets: false, columns: false });

  useEffect(() => {
    setLoading(prev => ({ ...prev, spreadsheets: true }));
    axios.get<any>(`${BACKEND_URL}/api/v1/google/sheets`, { headers: { "authorization": localStorage.getItem("token") } })
      .then(res => setSpreadsheets(res.data.sheets))
      .catch(err => console.error("Failed to fetch spreadsheets:", err))
      .then(() => {
        setLoading(prev => ({ ...prev, spreadsheets: false }));
      });
  }, []);

  useEffect(() => {
    if (selectedSpreadsheet) {
      setWorksheets([]);
      setSelectedWorksheet(null);
      setColumns([]);
      setColumnValues({});
      setLoading(prev => ({ ...prev, worksheets: true }));
      axios.get<any>(`${BACKEND_URL}/api/v1/google/sheets/${selectedSpreadsheet.id}/worksheets`, { headers: { "authorization": localStorage.getItem("token") } })
        .then(res => setWorksheets(res.data.worksheets))
        .catch(err => console.error("Failed to fetch worksheets:", err))
        .then(() => {
          setLoading(prev => ({ ...prev, worksheets: false }));
        });
    }
  }, [selectedSpreadsheet]);

  useEffect(() => {
    if (selectedSpreadsheet && selectedWorksheet) {
      setColumns([]);
      setColumnValues({});
      setLoading(prev => ({ ...prev, columns: true }));
      axios.get<any>(`${BACKEND_URL}/api/v1/google/sheets/${selectedSpreadsheet.id}/worksheets/${encodeURIComponent(selectedWorksheet)}/columns`, { headers: { "authorization": localStorage.getItem("token") } })
        .then(res => setColumns(res.data.columns))
        .catch(err => console.error("Failed to fetch columns:", err))
        .then(() => {
          setLoading(prev => ({ ...prev, columns: false }));
        });
    }
  }, [selectedSpreadsheet, selectedWorksheet]);

  const handleColumnChange = (column: string, value: string) => {
    setColumnValues(prev => ({ ...prev, [column]: value }));
  };

  const handleSave = () => {
    // const metadata = {
    //     spreadsheetId: selectedSpreadsheet?.id,
    //     sheetName: selectedWorksheet,
    //     values: columns.map(col => columnValues[col] || "")
    // };
    setMetadata({
      spreadsheetId: selectedSpreadsheet?.id,
      sheetName: selectedWorksheet,
      values: columns.map(col => columnValues[col] || "")
    })
    alert("Configuration saved!");
  };

  return (
    <div className="p-4">
      <CustomDropdown
        label="Spreadsheet"
        placeholder="Select a spreadsheet"
        options={spreadsheets.map(s => s.name)}
        selectedValue={selectedSpreadsheet?.name}
        onSelect={(name: string) => setSelectedSpreadsheet(spreadsheets.find(s => s.name === name) || null)}
        isLoading={loading.spreadsheets}
      />

      {selectedSpreadsheet && (
        <CustomDropdown
          label="Worksheet"
          placeholder="Select a worksheet"
          options={worksheets}
          selectedValue={selectedWorksheet}
          onSelect={setSelectedWorksheet}
          isLoading={loading.worksheets}
        />
      )}

      {selectedWorksheet && loading.columns && <p className="text-sm text-gray-500">Loading columns...</p>}
      {columns.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="font-semibold mb-2 text-gray-800">Map Columns</h4>
          <div className="space-y-3">
            {columns.map(col => (
              <div key={col}>
                <label className="block text-sm font-medium text-gray-700">{col}</label>
                <input
                  type="text"
                  placeholder={`Value for ${col}`}
                  onChange={(e) => handleColumnChange(col, e.target.value)}
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 mt-4 border-t">
        <button
          onClick={handleSave}
          disabled={!selectedWorksheet || columns.length === 0}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

