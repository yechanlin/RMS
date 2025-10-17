import React from 'react';
import { FiTarget } from "react-icons/fi";
import { RiDragMove2Fill } from "react-icons/ri";
import { MdEdit } from "react-icons/md";
import apiService from '../services/api';

export default function ControlPanel({ 
  nodes,
  selectedNode,
  newNodeLabel,
  setNewNodeLabel,
  panelPosition,
  isDragging,
  handlePanelMouseDown,
  addChildNode,
  addTailoredResumeNode,
  deleteNode,
  setSelectedNode,
  getNodeType,
  getNodeTypeLabel,
  uploadedCV,
  setUploadedCV,
  continuousAdd,
  setContinuousAdd,
  updateNodeLabel,
  updateJobDescription,
  loading,
  error,
  setError,
  showCVWarning,
  setShowCVWarning,
  isGeneratingResume,
  setIsGeneratingResume
}) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [pendingDeleteNode, setPendingDeleteNode] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editNodeLabel, setEditNodeLabel] = React.useState('');
  const [uploadingCV, setUploadingCV] = React.useState(false);

  // Load existing job description when a role node is selected
  React.useEffect(() => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node && node.type === 'role' && node.backendData) {
        setNewNodeLabel(node.backendData.description || '');
      } else {
        setNewNodeLabel('');
      }
    }
  }, [selectedNode, nodes]);

  const handleCVUpload = async (file) => {
    if (!file) return;
    
    setUploadingCV(true);
    setError(null);
    
    try {
      const response = await apiService.uploadCV(file);
      setUploadedCV(file);
      console.log('CV uploaded successfully:', response);
    } catch (err) {
      console.error('Failed to upload CV:', err);
      setError(`Failed to upload CV: ${err.message}`);
    } finally {
      setUploadingCV(false);
    }
  };

  const handleJobDescriptionUpdate = async () => {
    if (!selectedNode || !newNodeLabel.trim()) return;
    
    const node = nodes.find(n => n.id === selectedNode);
    if (!node || node.type !== 'role' || !node.backendId) return;
    
    try {
      await updateJobDescription(selectedNode, newNodeLabel.trim());
      console.log('Job description updated successfully');

      // After updating the job description, call tailor resume if CV is uploaded
      const companyNode = nodes.find(n => n.id === node.parentId);
      const companyName = companyNode?.label || '';
      if (!uploadedCV) {
        setShowCVWarning(true);
        return;
      }

      setError(null);
      setIsGeneratingResume(true);
      
      // Get the actual CV file from backend
      let formCv;
      try {
        const latestCV = await apiService.getLatestCV();
        if (!latestCV || !latestCV.id) {
          setError('No CV found. Please upload a CV first.');
          setIsGeneratingResume(false);
          return;
        }
        
        // Download the CV file and convert to File object
        const response = await fetch(`http://localhost:8000/api/resumes/base-cv/${latestCV.id}/download/`);
        if (!response.ok) {
          throw new Error('Failed to download CV');
        }
        
        const blob = await response.blob();
        formCv = new File([blob], latestCV.filename, { type: latestCV.content_type });
      } catch (err) {
        console.error('Failed to get CV file:', err);
        setError('Failed to get CV file. Please try uploading again.');
        setIsGeneratingResume(false);
        return;
      }

      try {
        const result = await apiService.tailorResume({
          cv: formCv,
          company: companyName,
          job_description: newNodeLabel.trim()
        });

        // Normalize file path for URLs
        const normalizedPath = (result.file_path || '').replace(/\\\\/g, '/').replace(/\\/g, '/');

        addTailoredResumeNode(selectedNode, {
          tailored_resume: result.tailored_resume,
          file_path: normalizedPath,
          company: result.company,
          created_at: Date.now()
        });

        // Clear textarea
        setNewNodeLabel('');
        
        // Add a small delay to ensure the node appears smoothly
        setTimeout(() => {
          setIsGeneratingResume(false);
        }, 500);
      } catch (apiErr) {
        console.error('Failed to tailor resume:', apiErr);
        setError(apiErr?.message || 'Failed to tailor resume');
        setIsGeneratingResume(false);
      }
    } catch (err) {
      console.error('Failed to update job description:', err);
      setError(`Failed to update job description: ${err.message}`);
      setIsGeneratingResume(false);
    }
  };

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
      className="absolute z-20 bg-gray-800 rounded-lg p-4 shadow-xl w-72 cursor-move"
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
                    handleCVUpload(file);
                  }
                }}
                disabled={uploadingCV}
                className="w-full text-sm text-gray-300 bg-gray-700 p-2 rounded cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploadingCV && (
                <p className="text-xs text-blue-400 mt-1">
                  Uploading CV...
                </p>
              )}
              {uploadedCV && !uploadingCV && (
                <p className="text-xs text-green-400 mt-1">
                  Uploaded: {uploadedCV.name}
                </p>
              )}
              {uploadedCV && (
                <button
                  onClick={async () => {
                    try {
                      // Get the latest CV from backend and download it
                      const latestCV = await apiService.getLatestCV();
                      if (latestCV && latestCV.id) {
                        const downloadUrl = `http://localhost:8000/api/resumes/base-cv/${latestCV.id}/download/`;
                        window.open(downloadUrl, '_blank');
                      }
                    } catch (err) {
                      console.error('Failed to download CV:', err);
                      setError('Failed to download CV');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  📄 Download CV
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
                    const label = nodeType === 'base' ? 'Base node' : node.label;
                    return (
                      <span className="truncate max-w-[160px] block mx-auto" title={label} aria-label={label} tabIndex={0}>
                        {label}
                      </span>
                    );
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
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleJobDescriptionUpdate()}
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
                    onClick={() => {
                      const nodeType = getNodeType(nodes.find(n => n.id === selectedNode));
                      if (nodeType === 'role') {
                        handleJobDescriptionUpdate();
                      } else {
                        addChildNode();
                      }
                    }}
                    disabled={loading || isGeneratingResume}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    {loading ? 'Loading...' : isGeneratingResume ? 'Generating Resume...' : (getNodeType(nodes.find(n => n.id === selectedNode)) === 'role' ? '✓ Enter' : '✓ Add')}
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
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              {loading ? 'Deleting...' : '🗑 Delete Node & Children'}
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
      
      {/* Error Display */}
      {error && (
        <div className="mt-3 p-2 bg-red-900 border border-red-700 rounded text-red-200 text-xs">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* CV Warning Popup */}
      {showCVWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                CV Required
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Please upload your CV on the base node first before generating a tailored resume.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCVWarning(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCVWarning(false);
                    // Scroll to base node or highlight it
                    const baseNode = nodes.find(n => n.id === 1);
                    if (baseNode) {
                      setSelectedNode(1);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Base Node
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}