import React, { useState } from 'react';
import InfoPanel from './InfoPanel';
import ControlPanel from './ControlPanel';

// icons
import { FaUpload } from "react-icons/fa";

export default function CareerFlowDiagram() {
  const [nodes, setNodes] = useState([
    { 
      id: 1, 
      label: 'Upload base cv here', 
      x: 100, 
      y: 400, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      type: 'base',
      parentId: null
    }
  ]);

  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uploadedCV, setUploadedCV] = useState(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const [continuousAdd, setContinuousAdd] = useState(false);

  const getNodeType = (node) => {
    if (node.type === 'base') return 'base';
    if (node.parentId === 1) return 'company';
    return 'role';
  };

  const getChildrenCount = (nodeId) => {
    return nodes.filter(n => n.parentId === nodeId).length;
  };

  const calculateChildPosition = (parentNode) => {
    const childCount = getChildrenCount(parentNode.id);
    const nodeType = getNodeType(parentNode);
    
    let xOffset, ySpacing, baseY;
    
    if (nodeType === 'base') {
      xOffset = 350;
      ySpacing = 80;
      baseY = 100;
    } else {
      xOffset = 350;
      ySpacing = 120;
      baseY = parentNode.y - 100;
    }

    return {
      x: parentNode.x + xOffset,
      y: baseY + (childCount * ySpacing)
    };
  };

  const addChildNode = () => {
    if (!newNodeLabel.trim() || !selectedNode) return;

    const parentNode = nodes.find(n => n.id === selectedNode);
    const position = calculateChildPosition(parentNode);

    const nodeType = getNodeType(parentNode);
    const newNode = {
      id: Math.max(...nodes.map(n => n.id)) + 1,
      label: newNodeLabel,
      x: position.x,
      y: position.y,
      color: nodeType === 'base' 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
        : nodeType === 'company'
        ? 'bg-gradient-to-r from-green-500 to-green-600'
        : 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600',
      type: 'child',
      parentId: selectedNode
    };

    setNodes([...nodes, newNode]);
    setConnections([...connections, { from: selectedNode, to: newNode.id }]);
    setNewNodeLabel('');
    // No need to hide textbox
  };

  const handleNodeClick = (id) => {
    setSelectedNode(id);
    const node = nodes.find(n => n.id === id);
    const nodeType = getNodeType(node);
    if (nodeType === 'company') {
      setExpandedCompanyId(id);
    } else if (nodeType === 'base') {
      setExpandedCompanyId(null);
    }
  };

  const deleteNode = (id) => {
    if (id === 1) return;
    
    const toDelete = new Set([id]);
    let hasMore = true;
    
    while (hasMore) {
      hasMore = false;
      nodes.forEach(node => {
        if (toDelete.has(node.parentId) && !toDelete.has(node.id)) {
          toDelete.add(node.id);
          hasMore = true;
        }
      });
    }
    
    setNodes(nodes.filter(n => !toDelete.has(n.id)));
    setConnections(connections.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)));
  setSelectedNode(null);
  };

  const generatePath = (from, to) => {
    const fromNode = nodes.find(n => n.id === from);
    const toNode = nodes.find(n => n.id === to);
    
    if (!fromNode || !toNode) return '';

    const x1 = fromNode.x + 90;
    const y1 = fromNode.y + 25;
    const x2 = toNode.x;
    const y2 = toNode.y + 25;

    const midX = (x1 + x2) / 2;

    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  };

  const getNodeTypeLabel = (node) => {
    const type = getNodeType(node);
    if (type === 'base') return 'Base';
    if (type === 'company') return 'Company';
    return 'Role';
  };

  const handlePanelMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanelPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateNodeLabel = (nodeId, newLabel) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, label: newLabel }
        : node
    ));
  };

  // Determine which nodes are visible
  const visibleNodes = nodes.filter(node => {
    const type = getNodeType(node);
    if (type === 'base') return true;
    if (type === 'company') return true;
    if (type === 'role' && expandedCompanyId && node.parentId === expandedCompanyId) return true;
    return false;
  });

  // Only show connections where both nodes are visible
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const visibleConnections = connections.filter(conn => visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to));

  return (
    <div 
      className="relative w-full h-screen bg-gray-900 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <InfoPanel />
      <ControlPanel 
        nodes={nodes}
        selectedNode={selectedNode}
        newNodeLabel={newNodeLabel}
        setNewNodeLabel={setNewNodeLabel}
        panelPosition={panelPosition}
        isDragging={isDragging}
        handlePanelMouseDown={handlePanelMouseDown}
        addChildNode={addChildNode}
        deleteNode={deleteNode}
        setSelectedNode={setSelectedNode}
        getNodeType={getNodeType}
        getNodeTypeLabel={getNodeTypeLabel}
        uploadedCV={uploadedCV}
        setUploadedCV={setUploadedCV}
        continuousAdd={continuousAdd}
        setContinuousAdd={setContinuousAdd}
        updateNodeLabel={updateNodeLabel}
      />

      {/* Scrollable Canvas */}
      <div className="absolute inset-0 overflow-auto py-16">
        <div className="relative" style={{ minHeight: '100%', minWidth: '100%', width: '2000px', height: 'auto' }}>
          {/* SVG for connections */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="white" />
              </marker>
            </defs>
            {visibleConnections.map((conn, idx) => (
              <path
                key={idx}
                d={generatePath(conn.from, conn.to)}
                stroke="white"
                strokeWidth="2.5"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </svg>

          {/* Nodes */}
          {visibleNodes.map((node) => {
            const nodeType = getNodeType(node);
            const color = nodeType === 'base'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : nodeType === 'company'
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-fuchsia-700 to-fuchsia-600';
            return (
              <div
                key={node.id}
                className={`absolute ${color} rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
                  selectedNode === node.id ? 'ring-4 ring-yellow-400' : ''
                }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '180px',
                padding: '12px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node.id);
              }}
            >
              <div className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                {node.id === 1 && <FaUpload />}
                {node.label}
              </div>
              {node.id === 1 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  START
                </div>
              )}
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}