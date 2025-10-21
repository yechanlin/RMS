import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  Group,
  Stack,
  Badge,
  FileInput,
  Modal,
  ActionIcon,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { FiTarget } from "react-icons/fi";
import { RiDragMove2Fill } from "react-icons/ri";
import { MdEdit } from "react-icons/md";
import { FaUpload, FaExclamationTriangle } from "react-icons/fa";
import { LoadingButton, ConfirmModal, ErrorAlert } from './ui';
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
  selectedNodes,
  setSelectedNodes,
  setShowDeleteMultipleModal,
  deleteMultipleNodes,
  selectAllNodesOfType,
  deselectAllNodes,
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
  setIsGeneratingResume,
  setResumeUrl,
  setShowResumePopup,
  setShowPlainTextPopup,
  setPlainTextContent,
  setPlainTextFilename
}) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showDeleteMultipleModal, setShowDeleteMultipleModalLocal] = React.useState(false);
  const [pendingDeleteNode, setPendingDeleteNode] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editNodeLabel, setEditNodeLabel] = React.useState('');
  const [uploadingCV, setUploadingCV] = React.useState(false);
  const [showFeedbackBox, setShowFeedbackBox] = React.useState(false);
  const [feedbackText, setFeedbackText] = React.useState('');

  // Load existing job description when a role node is selected and reset feedback state
  React.useEffect(() => {
    if (selectedNode) {
      const node = nodes.find(n => n.id === selectedNode);
      if (node && node.type === 'role' && node.backendData) {
        setNewNodeLabel(node.backendData.description || '');
      } else {
        setNewNodeLabel('');
      }
    }
    // Reset feedback state when switching nodes
    setShowFeedbackBox(false);
    setFeedbackText('');
  }, [selectedNode, nodes]);

  // Function to check for duplicate node names at the same level
  const checkForDuplicateName = (parentNodeId, nodeType, newName, excludeNodeId = null) => {
    const siblingNodes = nodes.filter(n => 
      n.parentId === parentNodeId && 
      n.type === nodeType &&
      n.id !== excludeNodeId
    );
    
    return siblingNodes.some(sibling => 
      sibling.label.toLowerCase().trim() === newName.toLowerCase().trim()
    );
  };

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
      
      // Get the latest CV and check if there's updated text
      try {
        const latestCV = await apiService.getLatestCV();
        if (!latestCV || !latestCV.id) {
          setError('No CV found. Please upload a CV first.');
          setIsGeneratingResume(false);
          return;
        }
        
        // Check if there's updated extracted text
        let requestData;
        if (latestCV.extracted_text && latestCV.extracted_text.trim()) {
          // Use the updated extracted text
          requestData = {
            cv_text: latestCV.extracted_text,
            company: companyName,
            job_description: newNodeLabel.trim()
          };
        } else {
          // Fall back to using the original file
          const response = await fetch(`http://localhost:8000/api/resumes/base-cv/${latestCV.id}/download/`);
          if (!response.ok) {
            throw new Error('Failed to download CV');
          }
          
          const blob = await response.blob();
          const formCv = new File([blob], latestCV.filename, { type: latestCV.content_type });
          
          requestData = {
            cv: formCv,
            company: companyName,
            job_description: newNodeLabel.trim()
          };
        }
        
        const result = await apiService.tailorResume(requestData);

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
      // Use the same deleteNode function for all node types
      deleteNode(pendingDeleteNode);
      setPendingDeleteNode(null);
    }
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setPendingDeleteNode(null);
    setShowDeleteModal(false);
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
  const nodeType = selectedNodeData ? getNodeType(selectedNodeData) : null;

  return (
    <>
      <Paper 
        radius="lg"
        p="md"
        withBorder
        className={`backdrop-blur-md bg-gray-800/90 border-white/20 shadow-2xl ${isDragging ? '' : 'transition-all duration-300 hover:shadow-3xl'}`}
        style={{ 
          position: 'absolute',
          left: `${panelPosition.x}px`, 
          top: `${panelPosition.y}px`,
          zIndex: 20,
          backgroundColor: 'var(--mantine-color-dark-6)',
          width: '288px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handlePanelMouseDown}
      >
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue" size="sm" className="shadow-lg ring-2 ring-blue-100/20">
              <FiTarget size={16} />
            </ThemeIcon>
            <Title order={4} size="h5" c="white" className="font-bold tracking-wide">
              Control Panel
            </Title>
          </Group>
          <Group gap="xs" className="opacity-70 hover:opacity-100 transition-opacity">
            <ThemeIcon variant="subtle" color="gray" size="xs" className="hover:bg-gray-600/50 transition-colors">
              <RiDragMove2Fill size={12} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" className="text-gray-400">
              Drag
            </Text>
          </Group>
        </Group>
        
        {selectedNodes && selectedNodes.size > 0 ? (
          // Multi-selection mode - only show delete button
          <Stack gap="md">
            <div className="text-center">
              <Text size="sm" c="gray.3">
                {selectedNodes.size} {(() => {
                  // Get the type of the first selected node to display
                  const firstSelectedId = Array.from(selectedNodes)[0];
                  const firstNode = nodes.find(n => n.id === firstSelectedId);
                  const nodeType = getNodeType(firstNode);
                  const typeLabel = getNodeTypeLabel(firstNode);
                  
                  // Get the appropriate color for the node type
                  const typeColor = nodeType === 'company' ? 'text-green-400' : 
                                  nodeType === 'role' ? 'text-indigo-400' : 
                                  nodeType === 'tailored' ? 'text-orange-400' : 'text-gray-400';
                  
                  return (
                    <span className={typeColor}>
                      {typeLabel.toLowerCase()}{selectedNodes.size > 1 ? 's' : ''}
                    </span>
                  );
                })()} selected
              </Text>
            </div>
            
            {/* Select All / Deselect All Buttons */}
            <Group grow>
              <LoadingButton
                variant="outline"
                color="blue"
                size="sm"
                onClick={() => {
                  // Get the type of currently selected nodes to determine what to select all of
                  const firstSelectedId = Array.from(selectedNodes)[0];
                  const firstNode = nodes.find(n => n.id === firstSelectedId);
                  const nodeType = getNodeType(firstNode);
                  selectAllNodesOfType(nodeType);
                }}
                className="transition-all duration-200 hover:bg-blue-600/20 hover:shadow-md"
              >
                {(() => {
                  const firstSelectedId = Array.from(selectedNodes)[0];
                  const firstNode = nodes.find(n => n.id === firstSelectedId);
                  const nodeType = getNodeType(firstNode);
                  
                  if (nodeType === 'company') {
                    return 'Select All Companies';
                  } else if (nodeType === 'role') {
                    // Find the parent company name
                    const parentCompany = nodes.find(n => n.id === firstNode.parentId);
                    const companyName = parentCompany?.label || 'Company';
                    return `Select All in ${companyName}`;
                  } else if (nodeType === 'tailored') {
                    // Find the parent role name
                    const parentRole = nodes.find(n => n.id === firstNode.parentId);
                    const roleName = parentRole?.label || 'Role';
                    return `Select All in ${roleName}`;
                  }
                  return 'Select All';
                })()}
              </LoadingButton>
              <LoadingButton
                variant="outline"
                color="gray"
                size="sm"
                onClick={deselectAllNodes}
                className="transition-all duration-200 hover:bg-gray-600/20 hover:shadow-md"
              >
                Deselect All
              </LoadingButton>
            </Group>
            
            <LoadingButton
              color="red"
              fullWidth
              onClick={() => setShowDeleteMultipleModalLocal(true)}
              loading={loading}
              leftSection={<FaExclamationTriangle size={16} />}
              className="transition-all duration-200 hover:shadow-md bg-red-600 hover:bg-red-700"
            >
              Delete {selectedNodes.size} node{selectedNodes.size > 1 ? 's' : ''}
            </LoadingButton>
            <Text size="xs" c="dimmed" className="text-center text-gray-400">
              Hold Ctrl and click nodes of the same type to select multiple
            </Text>
          </Stack>
        ) : selectedNode ? (
          <Stack gap="md">
            {/* File upload for base node */}
            {selectedNode === 1 && (
              <Stack gap="xs">
                <Text size="sm" c="gray.3">Upload CV</Text>
                <FileInput
                  placeholder="Choose CV file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleCVUpload}
                  disabled={uploadingCV}
                  leftSection={<FaUpload size={16} />}
                  styles={{
                    input: {
                      backgroundColor: 'var(--mantine-color-dark-7)',
                      border: '1px solid var(--mantine-color-dark-4)',
                      color: 'var(--mantine-color-gray-3)',
                    },
                  }}
                />
                {uploadingCV && (
                  <Text size="xs" c="blue.4">
                    Uploading CV...
                  </Text>
                )}
                {uploadedCV && !uploadingCV && (
                  <Text size="xs" c="green.4">
                    Uploaded: {uploadedCV.name}
                  </Text>
                )}
                {uploadedCV && (
                  <Group gap="xs">
                    <LoadingButton
                      size="xs"
                      variant="filled"
                      color="blue"
                      style={{ flex: 1 }}
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
                    >
                      Download
                    </LoadingButton>
                    <LoadingButton
                      size="xs"
                      variant="filled"
                      color="violet"
                      style={{ flex: 1 }}
                      onClick={async () => {
                        try {
                          setError(null);
                          // Get the latest CV from backend and extract text
                          const latestCV = await apiService.getLatestCV();
                          if (latestCV && latestCV.id) {
                            const textResult = await apiService.extractCVText(latestCV.id);
                            setPlainTextContent(textResult.text);
                            setPlainTextFilename(textResult.filename);
                            setShowPlainTextPopup(true);
                          } else {
                            setError('No CV found');
                          }
                        } catch (err) {
                          console.error('Failed to extract CV text:', err);
                          setError('Failed to extract CV text');
                        }
                      }}
                    >
                      Plain Text
                    </LoadingButton>
                  </Group>
                )}
              </Stack>
            )}

            <Paper p="sm" bg="dark.7" radius="md">
              <Text size="xs" c="gray.4" mb="xs">Selected Node:</Text>
              {isEditing ? (
                <Stack gap="xs">
                  <TextInput
                    value={editNodeLabel}
                    onChange={(e) => setEditNodeLabel(e.target.value)}
                    size="sm"
                    className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-400/50"
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-dark-6)',
                        color: 'white',
                        border: '1px solid var(--mantine-color-dark-4)',
                      },
                    }}
                    autoFocus
                  />
                  <Group gap="xs">
                    <LoadingButton
                      size="xs"
                      color="green"
                      style={{ flex: 1 }}
                      onClick={() => {
                        // Check for duplicate names at the same level
                        const currentNode = nodes.find(n => n.id === selectedNode);
                        if (currentNode) {
                          const isDuplicate = checkForDuplicateName(
                            currentNode.parentId, 
                            currentNode.type, 
                            editNodeLabel, 
                            selectedNode
                          );
                          
                          if (isDuplicate) {
                            setError(`A ${currentNode.type} with the name "${editNodeLabel}" already exists at this level. Please choose a different name.`);
                            return;
                          }
                        }
                        
                        updateNodeLabel(selectedNode, editNodeLabel);
                        setIsEditing(false);
                        setError(null); // Clear any previous errors
                      }}
                    >
                      Save
                    </LoadingButton>
                    <LoadingButton
                      size="xs"
                      variant="default"
                      style={{ flex: 1 }}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </LoadingButton>
                  </Group>
                </Stack>
              ) : (
                <>
                  <Text fw={600} c="white" ta="center" style={{ wordBreak: 'break-word' }}>
                    {nodeType === 'base' ? 'Base node' : selectedNodeData?.label}
                  </Text>
                  <Group justify="space-between" mt="xs">
                    <Badge variant="light" color="blue" size="xs" className="shadow-sm ring-1 ring-blue-100/30 font-medium">
                      {getNodeTypeLabel(selectedNodeData)}
                    </Badge>
                    {selectedNode !== 1 && (
                      <ActionIcon 
                        variant="subtle" 
                        color="blue" 
                        size="sm"
                        className="transition-all duration-200 hover:bg-blue-600/30 hover:shadow-md"
                        onClick={() => {
                          setEditNodeLabel(selectedNodeData.label);
                          setIsEditing(true);
                        }}
                      >
                        <MdEdit size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </>
              )}
            </Paper>

            {/* Always show add child textbox when a node is selected, except for tailored nodes */}
            {selectedNode && nodeType !== 'tailored' && (
              <Stack gap="xs">
                <Text size="sm" c="gray.3">
                  {(() => {
                    if (nodeType === 'base') return 'Add Company';
                    if (nodeType === 'company') return 'Add Role';
                    return 'Job description';
                  })()}
                </Text>
                {nodeType === 'role' ? (
                  <Textarea
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="Paste the job description here"
                    minRows={8}
                    maxRows={12}
                    size="lg"
                    className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-400/50 hover:bg-gray-700/30"
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-dark-7)',
                        color: 'white',
                        border: '1px solid var(--mantine-color-dark-4)',
                        fontSize: '12px',
                        padding: '16px',
                        minHeight: '160px',
                        lineHeight: '1.6',
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleJobDescriptionUpdate();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <TextInput
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder={(() => {
                      if (nodeType === 'base') return 'e.g., Google, Meta';
                      if (nodeType === 'company') return 'e.g., SWE, data engineer';
                      return '';
                    })()}
                    className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-400/50 hover:bg-gray-700/50"
                    styles={{
                      input: {
                        backgroundColor: 'var(--mantine-color-dark-7)',
                        color: 'white',
                        border: '1px solid var(--mantine-color-dark-4)',
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Check for duplicate names before adding
                        const currentNode = nodes.find(n => n.id === selectedNode);
                        const newNodeType = currentNode?.type === 'base' ? 'company' : 'role';
                        
                        if (checkForDuplicateName(selectedNode, newNodeType, newNodeLabel)) {
                          setError(`A ${newNodeType} with the name "${newNodeLabel}" already exists. Please choose a different name.`);
                          return;
                        }
                        
                        setError(null); // Clear any previous errors
                        addChildNode();
                      }
                    }}
                    autoFocus
                  />
                )}

                <Group gap="xs">
                  <LoadingButton
                    style={{ flex: 1 }}
                    color="green"
                    loading={loading || isGeneratingResume}
                    onClick={() => {
                      if (nodeType === 'role') {
                        handleJobDescriptionUpdate();
                      } else {
                        // Check for duplicate names before adding
                        const currentNode = nodes.find(n => n.id === selectedNode);
                        const newNodeType = currentNode?.type === 'base' ? 'company' : 'role';
                        
                        if (checkForDuplicateName(selectedNode, newNodeType, newNodeLabel)) {
                          setError(`A ${newNodeType} with the name "${newNodeLabel}" already exists. Please choose a different name.`);
                          return;
                        }
                        
                        setError(null); // Clear any previous errors
                        addChildNode();
                      }
                    }}
                  >
                    {loading ? 'Loading...' : isGeneratingResume ? 'Generating Resume...' : (nodeType === 'role' ? '✓ Submit' : '✓ Add')}
                  </LoadingButton>
                  <LoadingButton
                    style={{ flex: 1 }}
                    variant="default"
                    onClick={() => {
                      setSelectedNode(null);
                      setNewNodeLabel('');
                      setContinuousAdd(false);
                    }}
                  >
                    Cancel
                  </LoadingButton>
                </Group>
              </Stack>
            )}

            {selectedNode !== 1 && (
              <>
                {nodeType === 'tailored' ? (
                  <LoadingButton
                    fullWidth
                    color="red"
                    loading={loading}
                    onClick={() => handleDeleteClick(selectedNode)}
                  >
                    {loading ? 'Deleting...' : 'Delete Tailored Resume'}
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    fullWidth
                    color="red"
                    loading={loading}
                    onClick={() => handleDeleteClick(selectedNode)}
                  >
                    {loading ? 'Deleting...' : 'Delete Node & Children'}
                  </LoadingButton>
                )}
              </>
            )}

            {/* Tailored Resume Actions */}
            {selectedNode && nodeType === 'tailored' && (
              <Stack gap="xs">
                <LoadingButton
                  fullWidth
                  color="violet"
                  onClick={() => {
                    const node = nodes.find(n => n.id === selectedNode);
                    if (node && node.backendData && node.backendData.file_path) {
                      const resumeUrl = `http://localhost:8000/media/${node.backendData.file_path}`;
                      setResumeUrl(resumeUrl);
                      setShowResumePopup(true);
                    }
                  }}
                >
                  Preview
                </LoadingButton>
                <LoadingButton
                  fullWidth
                  color="green"
                  onClick={() => {
                    const node = nodes.find(n => n.id === selectedNode);
                    if (node && node.backendData && node.backendData.file_path) {
                      const link = document.createElement('a');
                      link.href = `http://localhost:8000/media/${node.backendData.file_path}`;
                      link.target = '_blank';
                      link.click();
                    }
                  }}
                >
                  View in new tab
                </LoadingButton>
                <LoadingButton
                  fullWidth
                  color="blue"
                  onClick={async () => {
                    const node = nodes.find(n => n.id === selectedNode);
                    if (node && node.backendData && node.backendData.file_path) {
                      try {
                        const response = await fetch(`http://localhost:8000/media/${node.backendData.file_path}`);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'tailored_resume.pdf';
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error('Download failed:', error);
                        setError('Failed to download resume');
                      }
                    }
                  }}
                >
                  Download Resume
                </LoadingButton>
                <LoadingButton
                  fullWidth
                  color="pink"
                  loading={isGeneratingResume}
                  onClick={() => {
                    if (!showFeedbackBox) {
                      setShowFeedbackBox(true);
                      return;
                    }

                    // Proceed with resume generation if feedback box is already shown
                    const generateResume = async () => {
                      const node = nodes.find(n => n.id === selectedNode);
                      const roleNode = nodes.find(n => n.id === node?.parentId);
                      const companyNode = nodes.find(n => n.id === roleNode?.parentId);
                      
                      if (!uploadedCV || !companyNode || !roleNode) {
                        setError('Missing CV, company, or role information');
                        return;
                      }

                      // Check if role node has job description
                      const jobDescription = roleNode.backendData?.description;
                      if (!jobDescription || jobDescription.trim() === '') {
                        setError('Job description is required. Please add a job description to the role first.');
                        return;
                      }
                      
                      try {
                        setIsGeneratingResume(true);
                        setError(null);
                        
                        // Get the latest CV and check for updated text
                        const latestCV = await apiService.getLatestCV();
                        if (!latestCV || !latestCV.id) {
                          setError('No CV found');
                          setIsGeneratingResume(false);
                          return;
                        }
                        
                        // Prepare the request with optional feedback
                        let requestData;
                        if (latestCV.extracted_text && latestCV.extracted_text.trim()) {
                          // Use the updated extracted text
                          requestData = {
                            cv_text: latestCV.extracted_text,
                            company: companyNode.label,
                            job_description: jobDescription.trim()
                          };
                        } else {
                          // Fall back to using the original file
                          const response = await fetch(`http://localhost:8000/api/resumes/base-cv/${latestCV.id}/download/`);
                          if (!response.ok) {
                            throw new Error('Failed to download CV');
                          }
                          
                          const blob = await response.blob();
                          const formCv = new File([blob], latestCV.filename, { type: latestCV.content_type });
                          
                          requestData = {
                            cv: formCv,
                            company: companyNode.label,
                            job_description: jobDescription.trim()
                          };
                        }

                        // Add feedback if provided
                        if (feedbackText.trim()) {
                          requestData.additional_feedback = feedbackText.trim();
                        }
                        
                        const result = await apiService.tailorResume(requestData);
                        
                        const normalizedPath = (result.file_path || '').replace(/\\\\/g, '/').replace(/\\/g, '/');
                        addTailoredResumeNode(roleNode.id, {
                          tailored_resume: result.tailored_resume,
                          file_path: normalizedPath,
                          company: result.company,
                          created_at: Date.now()
                        });

                        // Reset feedback state after successful generation
                        setShowFeedbackBox(false);
                        setFeedbackText('');
                      } catch (apiErr) {
                        console.error('Failed to create new tailored resume:', apiErr);
                        setError('Failed to create new tailored resume');
                      } finally {
                        setIsGeneratingResume(false);
                      }
                    };

                    generateResume();
                  }}
                >
                  {isGeneratingResume ? 'Creating...' : (showFeedbackBox ? 'Generate with Feedback' : 'Create New Version')}
                </LoadingButton>
                
                {showFeedbackBox && (
                  <Stack spacing="xs" className="mt-3">
                    <Text size="sm" fw={500} c="dimmed">
                      Additional Feedback
                    </Text>
                    <Textarea
                      placeholder="Provide additional feedback to improve the tailored resume (optional)..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      minRows={3}
                      maxRows={6}
                      autosize
                      className="text-sm"
                    />
                    <Group spacing="xs">
                      <LoadingButton
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={() => {
                          setShowFeedbackBox(false);
                          setFeedbackText('');
                        }}
                      >
                        Cancel
                      </LoadingButton>
                    </Group>
                  </Stack>
                )}
              </Stack>
            )}
          </Stack>
        ) : (
          <Text c="gray.4" size="sm" className="text-center">Click a node to get started</Text>
        )}
        
        {/* Error Display */}
        {error && (
          <Box mt="md">
            <ErrorAlert error={error} onClose={() => setError(null)} />
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        opened={showDeleteModal}
        title="Confirm Deletion"
        message="Are you sure you want to delete this node and all its children?"
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Delete Multiple Nodes Confirmation Modal */}
      <ConfirmModal
        opened={showDeleteMultipleModal}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedNodes?.size || 0} node${(selectedNodes?.size || 0) > 1 ? 's' : ''}? This action will also delete all child nodes and cannot be undone.`}
        confirmLabel={`Delete ${selectedNodes?.size || 0} node${(selectedNodes?.size || 0) > 1 ? 's' : ''}`}
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteMultipleNodes) {
            deleteMultipleNodes();
          }
          setShowDeleteMultipleModalLocal(false);
        }}
        onCancel={() => setShowDeleteMultipleModalLocal(false)}
      />

      {/* CV Warning Modal */}
      <Modal
        opened={showCVWarning}
        onClose={() => setShowCVWarning(false)}
        title="CV Required"
        centered
      >
        <Stack gap="md">
          <Group>
            <ThemeIcon color="yellow" variant="light">
              <FaExclamationTriangle size={16} />
            </ThemeIcon>
            <Text>Please upload your CV on the base node first before generating a tailored resume.</Text>
          </Group>
          <Group justify="flex-end">
            <LoadingButton variant="default" onClick={() => setShowCVWarning(false)}>
              Cancel
            </LoadingButton>
            <LoadingButton
              color="blue"
              onClick={() => {
                setShowCVWarning(false);
                // Scroll to base node or highlight it
                const baseNode = nodes.find(n => n.id === 1);
                if (baseNode) {
                  setSelectedNode(1);
                }
              }}
            >
              Go to Base Node
            </LoadingButton>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}