import React from 'react';
import { FiTarget } from "react-icons/fi";
import { RiDragMove2Fill } from "react-icons/ri";
import { MdEdit } from "react-icons/md";

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
  setContinuousAdd,
  updateNodeLabel
}) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [pendingDeleteNode, setPendingDeleteNode] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editNodeLabel, setEditNodeLabel] = React.useState('');

  const handleDeleteClick = (nodeId) => {
    setPendingDeleteNode(nodeId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteNode) {
      deleteNode(pendingDeleteNode);
      setPendingDeleteNode(null);
    }
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setPendingDeleteNode(null);
    setShowDeleteModal(false);
  };

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
        <span className="text-xs text-gray-400 ml-auto flex items-center gap-2"><RiDragMove2Fill /> Drag</span>
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
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editNodeLabel}
                  onChange={(e) => setEditNodeLabel(e.target.value)}
                  className="w-full px-3 bg-gray-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 py-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateNodeLabel(selectedNode, editNodeLabel);
                      setIsEditing(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-white font-semibold text-center">
                {(() => {
                    const node = nodes.find(n => n.id === selectedNode);
                    if (!node) return null;

                    const nodeType = getNodeType(node);
                    return nodeType === 'base' ? 'Base node' : node.label;
                })()}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-400 mt-1">
                    {'>'} {getNodeTypeLabel(nodes.find(n => n.id === selectedNode))}
                  </p>
                  {selectedNode !== 1 && (
                    <button
                      onClick={() => {
                        const node = nodes.find(n => n.id === selectedNode);
                        setEditNodeLabel(node.label);
                        setIsEditing(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1"
                    >
                      <MdEdit /> Edit
                    </button>
                  )}
                </div>
              </>
            )}
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
                    if (nodeType === 'company') return 'e.g., SWE, data engineer';
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
              onClick={() => handleDeleteClick(selectedNode)}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              🗑 Delete Node & Children
            </button>
          )}
        {/* Custom Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Confirm Deletion</h2>
              <p className="mb-6 text-gray-700">Are you sure you want to delete this node and all its children?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Click a node to get started</p>
      )}
    </div>
  );
}