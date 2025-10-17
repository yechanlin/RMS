import React, { useState } from 'react';

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
  const [showAddChild, setShowAddChild] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');

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
      ySpacing = 180;
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
    
    const newNode = {
      id: Math.max(...nodes.map(n => n.id)) + 1,
      label: newNodeLabel,
      x: position.x,
      y: position.y,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      type: 'child',
      parentId: selectedNode
    };
    
    setNodes([...nodes, newNode]);
    setConnections([...connections, { from: selectedNode, to: newNode.id }]);
    setNewNodeLabel('');
    setShowAddChild(false);
  };

  const handleNodeClick = (id) => {
    setSelectedNode(id);
    setShowAddChild(true);
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
    setShowAddChild(false);
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

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Info Panel - Top Right */}
      <div className="absolute top-4 right-4 z-20 bg-gray-800 rounded-lg p-4 shadow-xl max-w-xs">
        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
          <span>📋</span> Instructions
        </h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Click the base node to add companies</li>
          <li>• Click a company to add roles</li>
          <li>• Use the control panel to manage nodes</li>
        </ul>
      </div>

      {/* Control Panel - Top Left */}
      <div className="absolute top-4 left-4 z-20 bg-gray-800 rounded-lg p-4 shadow-xl w-64">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>🎯</span> Controls
        </h3>
        
        {selectedNode ? (
          <div className="space-y-3">
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Selected Node</p>
              <p className="text-white font-semibold">
                {nodes.find(n => n.id === selectedNode)?.label}
              </p>
              <p className="text-xs text-blue-400 mt-1">
                {getNodeTypeLabel(nodes.find(n => n.id === selectedNode))}
              </p>
            </div>

            {showAddChild && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  Add {getNodeType(nodes.find(n => n.id === selectedNode)) === 'base' ? 'Company' : 'Role'}
                </label>
                <input
                  type="text"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  placeholder={getNodeType(nodes.find(n => n.id === selectedNode)) === 'base' ? 'e.g., Google' : 'e.g., SWE'}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addChildNode()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={addChildNode}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    ✓ Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddChild(false);
                      setNewNodeLabel('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedNode !== 1 && (
              <button
                onClick={() => deleteNode(selectedNode)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                🗑 Delete Node & Children
              </button>
            )}

            <button
              onClick={() => {
                setSelectedNode(null);
                setShowAddChild(false);
                setNewNodeLabel('');
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Deselect
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Click a node to get started</p>
        )}
      </div>

      {/* Scrollable Canvas */}
      <div className="absolute inset-0 overflow-auto">
        <div className="relative" style={{ minHeight: '100%', minWidth: '100%', width: '2000px', height: '1200px' }}>
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
            {connections.map((conn, idx) => (
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
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute ${node.color} rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-2xl hover:scale-105 ${
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
              <div className="text-white font-semibold text-center text-sm mb-2">
                {node.label}
              </div>
              {node.id === 1 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  START
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}