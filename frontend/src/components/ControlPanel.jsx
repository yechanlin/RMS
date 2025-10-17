import React from 'react';
import { FiTarget } from "react-icons/fi";

export default function ControlPanel({ 
  nodes,
  selectedNode,
  newNodeLabel,
  setNewNodeLabel,
  panelPosition,
  isDragging,
  handlePanelMouseDown,
  addChildNode,
  deleteNode,
  setSelectedNode,
  getNodeType,
  getNodeTypeLabel,
  uploadedCV,
  setUploadedCV,
  continuousAdd,
  setContinuousAdd
}) {
  return (
    <div 
      className="absolute z-20 bg-gray-800 rounded-lg p-4 shadow-xl w-64 cursor-move"
      style={{ 
        left: `${panelPosition.x}px`, 
        top: `${panelPosition.y}px`,
        userSelect: 'none'
      }}
      onMouseDown={handlePanelMouseDown}
    >
      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
        <span><FiTarget /></span> Controls
        <span className="text-xs text-gray-400 ml-auto">↔ Drag</span>
      </h3>
      
      {selectedNode ? (
        <div className="space-y-3">
          {/* File upload for base node */}
          {selectedNode === 1 && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Upload CV</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setUploadedCV(file);
                  }
                }}
                className="w-full text-sm text-gray-300 bg-gray-700 p-2 rounded cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {uploadedCV && (
                <p className="text-xs text-green-400 mt-1">
                  Uploaded: {uploadedCV.name}
                </p>
              )}
              {uploadedCV && (
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(uploadedCV);
                    window.open(url);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  📄 View CV
                </button>
              )}
            </div>
          )}

          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Selected Node:</p>
            <p className="text-white font-semibold text-center">
              {nodes.find(n => n.id === selectedNode)?.label}
            </p>
            <p className="text-xs text-blue-400 mt-1">
              {'>'} {getNodeTypeLabel(nodes.find(n => n.id === selectedNode))}
            </p>
          </div>

          {/* Always show add child textbox when a node is selected */}
          {selectedNode && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                {(() => {
                  const nodeType = getNodeType(nodes.find(n => n.id === selectedNode));
                  if (nodeType === 'base') return 'Add Company';
                  if (nodeType === 'company') return 'Add Role';
                  return 'Job description';
                })()}
              </label>
              {getNodeType(nodes.find(n => n.id === selectedNode)) === 'role' ? (
                <textarea
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="Paste the job description here"
                    className="w-full px-3 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pt-2 pb-2 h-[100px] resize-none"
                    autoFocus
                />
                ) : (
                <input
                    type="text"
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder={(() => {
                    const nodeType = getNodeType(nodes.find(n => n.id === selectedNode));
                    if (nodeType === 'base') return 'e.g., Google, Meta';
                    if (nodeType === 'company') return 'e.g., SWE';
                    return '';
                    })()}
                    className="w-full px-3 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 py-2"
                    onKeyPress={(e) => e.key === 'Enter' && addChildNode()}
                    autoFocus
                />
                )}

              <div className="flex gap-2 mb-2">
                  <button
                    onClick={addChildNode}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    {getNodeType(nodes.find(n => n.id === selectedNode)) === 'role' ? '✓ Enter' : '✓ Add'}
                  </button>
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    setNewNodeLabel('');
                    setContinuousAdd(false);
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
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Click a node to get started</p>
      )}
    </div>
  );
}