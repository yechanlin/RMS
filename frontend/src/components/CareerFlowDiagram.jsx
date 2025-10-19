import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Modal, Group, Text, Button, Alert, ThemeIcon, Box, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import InfoPanel from './InfoPanel';
import ControlPanel from './ControlPanel';
import apiService from '../services/api';

// icons
import { FaUpload, FaBuilding, FaUserTie } from "react-icons/fa";

export default function CareerFlowDiagram() {
  // Consolidate related state into objects
  const [diagram, setDiagram] = useState({
    nodes: [
      { 
        id: 1, 
        label: 'Upload base CV', 
        x: 100, 
        y: 400, 
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        type: 'base',
        parentId: null
      }
    ],
    connections: [],
    selectedNode: null,
    selectedNodes: new Set(),
    expandedCompanyId: null,
    expandedRoleId: null
  });

  const [editing, setEditing] = useState({
    nodeId: null,
    label: '',
    newNodeLabel: ''
  });

  const [ui, setUI] = useState({
    panelPosition: { x: 16, y: 16 },
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    loading: false,
    error: null
  });

  const [modals, setModals] = useState({
    showDeleteMultiple: false,
    showResume: false,
    showCVWarning: false,
    showDuplicateCompanyError: false,
    showPlainText: false
  });

  const [data, setData] = useState({
    companies: [],
    jobs: [],
    tailoredResumes: [],
    uploadedCV: null,
    resumeUrl: '',
    duplicateCompanyName: '',
    plainTextContent: '',
    plainTextFilename: '',
    isEditingPlainText: false,
    editedPlainText: ''
  });

  const [process, setProcess] = useState({
    isGeneratingResume: false,
    continuousAdd: false
  });

  const editInputRef = useRef(null);

  // Load data from backend on component mount
  useEffect(() => {
    loadDataFromBackend();
  }, []);

  // Keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDiagram(prev => ({ ...prev, selectedNodes: new Set(), selectedNode: null }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper function to find all descendant nodes
  const findAllDescendants = (nodeIds) => {
    const toDelete = new Set(nodeIds);
    let hasMore = true;
    
    while (hasMore) {
      hasMore = false;
      diagram.nodes.forEach(node => {
        if (toDelete.has(node.parentId) && !toDelete.has(node.id)) {
          toDelete.add(node.id);
          hasMore = true;
        }
      });
    }
    return toDelete;
  };

  // Helper function to delete nodes from backend
  const deleteNodesFromBackend = async (nodeIds) => {
    const results = { companies: [], jobs: [], tailored: [] };
    
    for (const nodeId of nodeIds) {
      const node = diagram.nodes.find(n => n.id === nodeId);
      if (node?.backendId) {
        try {
          if (node.type === 'company') {
            await apiService.deleteCompany(node.backendId);
            results.companies.push(node.backendId);
          } else if (node.type === 'role') {
            await apiService.deleteJob(node.backendId);
            results.jobs.push(node.backendId);
          } else if (node.type === 'tailored') {
            await apiService.deleteTailoredResume(node.backendId);
            results.tailored.push(node.backendId);
          }
        } catch (deleteError) {
          console.warn(`Failed to delete ${node.type} with ID ${node.backendId}:`, deleteError.message);
          // Add to results anyway to clean up frontend state
          if (node.type === 'company') results.companies.push(node.backendId);
          else if (node.type === 'role') results.jobs.push(node.backendId);
          else if (node.type === 'tailored') results.tailored.push(node.backendId);
        }
      }
    }
    return results;
  };

  const loadDataFromBackend = async () => {
    setUI(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [companiesData, jobsData, latestCVData, tailoredResumesData] = await Promise.all([
        apiService.getCompanies(),
        apiService.getJobs(),
        apiService.getLatestCV().catch(() => null), // Don't fail if no CV exists
        apiService.getTailoredResumes().catch(() => []) // Don't fail if no tailored resumes exist
      ]);
      
      // Update data state
      setData(prev => ({
        ...prev,
        companies: companiesData,
        jobs: jobsData,
        tailoredResumes: tailoredResumesData,
        uploadedCV: latestCVData?.filename ? {
          name: latestCVData.filename,
          size: latestCVData.file_size,
          type: latestCVData.content_type
        } : null
      }));
      
      // Sync nodes with backend data
      const syncedNodes = syncNodesWithBackendData(companiesData, jobsData, tailoredResumesData);
      setDiagram(prev => ({ ...prev, nodes: syncedNodes }));
    } catch (err) {
      console.error('Failed to load data from backend:', err);
      setUI(prev => ({ ...prev, error: `Failed to load data from backend: ${err.message}` }));
    } finally {
      setUI(prev => ({ ...prev, loading: false }));
    }
  };

  const syncNodesWithBackendData = (companiesData, jobsData, tailoredResumesData = []) => {
    const baseNode = { 
      id: 1, 
      label: 'Upload base CV', 
      x: 100, 
      y: 400, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      type: 'base',
      parentId: null
    };

    // Sort companies alphabetically by name
    const sortedCompanies = [...companiesData].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    const companyNodes = sortedCompanies.map((company, index) => ({
      id: `company_${company.id}`,
      label: company.name,
      x: 100 + 350,
      y: 100 + (index * 80),
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      type: 'company',
      parentId: 1,
      backendId: company.id,
      backendData: company
    }));

    // Sort jobs alphabetically by title within each company
    const sortedJobs = [...jobsData].sort((a, b) => 
      a.title.toLowerCase().localeCompare(b.title.toLowerCase())
    );

    const jobNodes = sortedJobs.map((job, index) => {
      const companyNode = companyNodes.find(cn => cn.backendId === job.company);
      if (!companyNode) return null;
      
      // Get all jobs for this company and sort them alphabetically
      const companyJobs = sortedJobs.filter(j => j.company === job.company);
      const companyJobIndex = companyJobs.findIndex(j => j.id === job.id);
      
      return {
        id: `job_${job.id}`,
        label: job.title,
        x: companyNode.x + 350,
        y: companyNode.y - 100 + (companyJobIndex * 80),  // Use alphabetical index within company
        color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        type: 'role',
        parentId: companyNode.id,
        backendId: job.id,
        backendData: job
      };
    }).filter(Boolean);

    // Create tailored resume nodes
    const tailoredNodes = [];
    const jobTailoredCounts = {};
    
    tailoredResumesData.forEach((resume) => {
      const jobNode = jobNodes.find(jn => jn.backendId === resume.job);
      if (!jobNode) return;
      
      // Count existing tailored resumes for this job
      if (!jobTailoredCounts[jobNode.id]) {
        jobTailoredCounts[jobNode.id] = 0;
      }
      
      // Increment version number for this job
      jobTailoredCounts[jobNode.id]++;
      const versionNumber = jobTailoredCounts[jobNode.id];
      
      tailoredNodes.push({
        id: `tailored_${resume.id}`,
        label: `Version ${versionNumber}`,
        x: jobNode.x + 350,
        y: jobNode.y + ((versionNumber - 1) * 60),
        color: 'bg-gradient-to-r from-orange-500 to-orange-600',
        type: 'tailored',
        parentId: jobNode.id,
        backendId: resume.id,
        version: versionNumber,
        backendData: {
          file_path: resume.file_path,
          tailored_resume: resume.tailored_content,
          company: resume.company_name,
          created_at: resume.created_at
        }
      });
    });

    const allNodes = [baseNode, ...companyNodes, ...jobNodes, ...tailoredNodes];

    // Create connections more efficiently
    const connections = [
      ...companyNodes.map(node => ({ from: 1, to: node.id })),
      ...jobNodes.map(node => ({ from: node.parentId, to: node.id })),
      ...tailoredNodes.map(node => ({ from: node.parentId, to: node.id }))
    ];
    setDiagram(prev => ({ ...prev, connections }));
    
    return allNodes;
  };

  const getNodeType = (node) => {
    if (node.type === 'base') return 'base';
    if (node.type === 'company') return 'company';
    if (node.type === 'role') return 'role';
    if (node.type === 'tailored') return 'tailored';
    if (node.parentId === 1) return 'company';
    return 'role';
  };

  const getNodeColor = (node) => {
    const type = getNodeType(node);
    if (type === 'base') return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (type === 'company') return 'bg-gradient-to-r from-green-500 to-green-600';
    if (type === 'tailored') return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
  };

  const getNodeIcon = (node) => {
    const type = getNodeType(node);
    if (type === 'base') return <FaUpload />;
    if (type === 'company') return <FaBuilding />;
    if (type === 'tailored') return <FaUserTie />;
    return <FaUserTie />;
  };

  const getChildrenCount = (nodeId) => {
    return diagram.nodes.filter(n => n.parentId === nodeId).length;
  };

  const repositionSiblingNodes = (deletedNodeId, remainingNodes) => {
    const deletedNode = diagram.nodes.find(n => n.id === deletedNodeId);
    if (!deletedNode || !deletedNode.parentId) return remainingNodes;

    const parentId = deletedNode.parentId;
    const parentNode = remainingNodes.find(n => n.id === parentId);
    if (!parentNode) return remainingNodes;

    // Get all siblings (excluding the deleted node)
    const siblings = remainingNodes.filter(n => n.parentId === parentId);
    
    // Sort siblings alphabetically by their label/name
    siblings.sort((a, b) => {
      const nameA = a.label.toLowerCase();
      const nameB = b.label.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Recalculate positions for all siblings as if they were added sequentially from the beginning
    const nodeType = getNodeType(parentNode);
    let xOffset, ySpacing, baseY;
    
    if (nodeType === 'base') {
      // Company nodes under base node
      xOffset = 350;
      ySpacing = 80;
      baseY = 100;
    } else if (nodeType === 'role') {
      // Tailored resume nodes under role nodes
      xOffset = 350;
      ySpacing = 60;
      baseY = parentNode.y;
    } else if (nodeType === 'company') {
      // Role nodes under company nodes
      xOffset = 350;
      ySpacing = 80;  // Same spacing as company nodes (80px)
      baseY = parentNode.y - 100;
    } else {
      // Default fallback
      xOffset = 350;
      ySpacing = 80;  // Same spacing as company nodes (80px)
      baseY = parentNode.y - 100;
    }

    // Update positions for each sibling - reset to sequential positions starting from 0
    let updatedNodes = remainingNodes.map(node => {
      const siblingIndex = siblings.findIndex(s => s.id === node.id);
      if (siblingIndex !== -1) {
        const updatedNode = {
          ...node,
          x: parentNode.x + xOffset,
          y: baseY + (siblingIndex * ySpacing)  // Start from index 0, not preserving gaps
        };

        // Handle special case for tailored resume nodes - update version numbers
        if (node.type === 'tailored') {
          const newVersion = siblingIndex + 1;
          updatedNode.label = `Version ${newVersion}`;
          updatedNode.version = newVersion;
        }

        return updatedNode;
      }
      return node;
    });

    // Recursively update child nodes positions when their parent positions change
    const repositionChildNodes = (nodeId, updatedNodes) => {
      const children = updatedNodes.filter(n => n.parentId === nodeId);
      if (children.length === 0) return updatedNodes;

      const parentNode = updatedNodes.find(n => n.id === nodeId);
      if (!parentNode) return updatedNodes;

      const parentNodeType = getNodeType(parentNode);
      let childXOffset, childYSpacing, childBaseY;

      if (parentNodeType === 'company') {
        // Role nodes under company nodes
        childXOffset = 350;
        childYSpacing = 80;  // Same spacing as company nodes (80px)
        childBaseY = parentNode.y - 100;
      } else if (parentNodeType === 'role') {
        // Tailored resume nodes under role nodes
        childXOffset = 350;
        childYSpacing = 60;
        childBaseY = parentNode.y;
      } else {
        return updatedNodes;
      }

      // Sort children alphabetically
      children.sort((a, b) => {
        const nameA = a.label.toLowerCase();
        const nameB = b.label.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Update child positions
      let result = updatedNodes.map(node => {
        const childIndex = children.findIndex(c => c.id === node.id);
        if (childIndex !== -1) {
          const updatedChild = {
            ...node,
            x: parentNode.x + childXOffset,
            y: childBaseY + (childIndex * childYSpacing)
          };

          // Handle special case for tailored resume nodes - update version numbers
          if (node.type === 'tailored') {
            const newVersion = childIndex + 1;
            updatedChild.label = `Version ${newVersion}`;
            updatedChild.version = newVersion;
          }

          return updatedChild;
        }
        return node;
      });

      // Recursively update grandchildren
      children.forEach(child => {
        result = repositionChildNodes(child.id, result);
      });

      return result;
    };

    // Apply recursive repositioning for all updated siblings
    siblings.forEach(sibling => {
      updatedNodes = repositionChildNodes(sibling.id, updatedNodes);
    });

    return updatedNodes;
  };

  const calculateChildPosition = (parentNode) => {
    const childCount = getChildrenCount(parentNode.id);
    const nodeType = getNodeType(parentNode);
    
    let xOffset, ySpacing, baseY;
    
    if (nodeType === 'base') {
      // Company nodes under base node
      xOffset = 350;
      ySpacing = 80;
      baseY = 100;
    } else if (nodeType === 'role') {
      // Tailored resume nodes under role nodes
      xOffset = 350;
      ySpacing = 60;
      baseY = parentNode.y;
    } else if (nodeType === 'company') {
      // Role nodes under company nodes
      xOffset = 350;
      ySpacing = 80;  // Same spacing as company nodes (80px)
      baseY = parentNode.y - 100;
    } else {
      // Default fallback
      xOffset = 350;
      ySpacing = 80;  // Same spacing as company nodes (80px)
      baseY = parentNode.y - 100;
    }

    return {
      x: parentNode.x + xOffset,
      y: baseY + (childCount * ySpacing)
    };
  };

  const addChildNode = async () => {
    if (!editing.newNodeLabel.trim() || !diagram.selectedNode) return;

    const parentNode = diagram.nodes.find(n => n.id === diagram.selectedNode);
    const nodeType = getNodeType(parentNode);
    
    setUI(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (nodeType === 'base') {
        // Adding a company
        const companyData = {
          name: editing.newNodeLabel.trim(),
          description: '',
          website: '',
          industry: ''
        };
        
        const newCompany = await apiService.createCompany(companyData);
        
        // Add company node to frontend
        const position = calculateChildPosition(parentNode);
        const newNode = {
          id: `company_${newCompany.id}`,
          label: newCompany.name,
          x: position.x,
          y: position.y,
          color: 'bg-gradient-to-r from-green-500 to-green-600',
          type: 'company',
          parentId: diagram.selectedNode,
          backendId: newCompany.id,
          backendData: newCompany
        };

        // Update all states
        setDiagram(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
          connections: [...prev.connections, { from: diagram.selectedNode, to: newNode.id }]
        }));
        setData(prev => ({ ...prev, companies: [...prev.companies, newCompany] }));
        
        // Reload data from backend to ensure consistency
        setTimeout(() => {
          loadDataFromBackend();
        }, 100);
        
      } else if (nodeType === 'company') {
        // Adding a job/role
        const jobData = {
          title: editing.newNodeLabel.trim(),
          description: '',
          company: parentNode.backendId,
          requirements: '',
          location: '',
          salary_range: '',
          job_type: 'full-time'
        };
        
        const newJob = await apiService.createJob(jobData);
        
        // Add job node to frontend
        const position = calculateChildPosition(parentNode);
        const newNode = {
          id: `job_${newJob.id}`,
          label: newJob.title,
          x: position.x,
          y: position.y,
          color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
          type: 'role',
          parentId: diagram.selectedNode,
          backendId: newJob.id,
          backendData: newJob
        };

        // Update all states
        setDiagram(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
          connections: [...prev.connections, { from: diagram.selectedNode, to: newNode.id }]
        }));
        setData(prev => ({ ...prev, jobs: [...prev.jobs, newJob] }));
        
        // Reload data from backend to ensure consistency
        setTimeout(() => {
          loadDataFromBackend();
        }, 100);
      }
      
      setEditing(prev => ({ ...prev, newNodeLabel: '' }));
    } catch (err) {
      console.error('Failed to create node:', err);
      
      // Check if it's a duplicate company name error
      if (nodeType === 'base' && (
        err.message.includes('already exists') || 
        err.message.includes('must be unique') ||
        err.message.includes('unique') ||
        (err.message.includes('400') && editing.newNodeLabel.trim())
      )) {
        setData(prev => ({ ...prev, duplicateCompanyName: editing.newNodeLabel.trim() }));
        setModals(prev => ({ ...prev, showDuplicateCompanyError: true }));
      } else {
        setUI(prev => ({ ...prev, error: `Failed to create ${nodeType}: ${err.message}` }));
      }
    } finally {
      setUI(prev => ({ ...prev, loading: false }));
    }
  };

  const addTailoredResumeNode = (parentRoleNodeId, payload) => {
    const parentNode = diagram.nodes.find(n => n.id === parentRoleNodeId);
    if (!parentNode) return;
    
    // Count existing tailored resume children for this parent
    const existingTailoredCount = diagram.nodes.filter(n => 
      n.parentId === parentRoleNodeId && n.type === 'tailored'
    ).length;
    
    // Create version number for the new tailored resume
    const versionNumber = existingTailoredCount + 1;
    
    const newNode = {
      id: `tailored_${Date.now()}`,
      label: `Version ${versionNumber}`,
      x: parentNode.x + 350,
      y: parentNode.y + (existingTailoredCount * 60),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      type: 'tailored',
      parentId: parentRoleNodeId,
      backendId: null,
      backendData: payload,
      version: versionNumber,
    };
    setDiagram(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      connections: [...prev.connections, { from: parentRoleNodeId, to: newNode.id }]
    }));
    
    // Add to tailored resumes state if it has backend data
    if (payload.id) {
      setData(prev => ({
        ...prev,
        tailoredResumes: [...prev.tailoredResumes, {
          id: payload.id,
          job: parentRoleNodeId.replace('job_', ''),
          file_path: payload.file_path,
          tailored_content: payload.tailored_resume,
          created_at: payload.created_at
        }]
      }));
    }
  };

  const handleNodeClick = (id, event) => {
    // Handle multi-selection with Ctrl key
    if (event && (event.ctrlKey || event.metaKey)) {
      // Multi-selection mode
      if (id === 1) return; // Don't allow selecting base node in multi-select
      
      const clickedNode = diagram.nodes.find(n => n.id === id);
      const clickedNodeType = getNodeType(clickedNode);
      
      // Check if we can add this node to the current selection
      const currentSelection = Array.from(diagram.selectedNodes);
      if (currentSelection.length > 0) {
        // Check if all currently selected nodes are of the same type as the clicked node
        const allSameType = currentSelection.every(selectedId => {
          const selectedNode = diagram.nodes.find(n => n.id === selectedId);
          return getNodeType(selectedNode) === clickedNodeType;
        });
        
        // If types don't match, clear selection and start fresh with clicked node
        if (!allSameType) {
          // Show a brief visual feedback for the restriction
          const firstSelectedNode = diagram.nodes.find(n => n.id === currentSelection[0]);
          const firstSelectedType = getNodeType(firstSelectedNode);
          console.log(`Multi-selection restriction: Cannot mix ${firstSelectedType} nodes with ${clickedNodeType} nodes. Starting new selection.`);
          
          setDiagram(prev => ({
            ...prev,
            selectedNodes: new Set([id]),
            selectedNode: null,
            // Don't collapse the tree when switching selection types
            // expandedCompanyId: null,
            // expandedRoleId: null
          }));
          return;
        }
      }
      
      // Add/remove from selection if types match or selection is empty
      const newSelectedNodes = new Set(diagram.selectedNodes);
      if (newSelectedNodes.has(id)) {
        newSelectedNodes.delete(id);
      } else {
        newSelectedNodes.add(id);
      }
      setDiagram(prev => ({
        ...prev,
        selectedNodes: newSelectedNodes,
        selectedNode: null,
        // Preserve expanded state during multi-selection
        // expandedCompanyId: null,
        // expandedRoleId: null
      }));
      
      return;
    }
    
    // Clear multi-selection when doing single click
    setDiagram(prev => ({ ...prev, selectedNodes: new Set() }));
    
    // Single selection mode (original behavior)
    const node = diagram.nodes.find(n => n.id === id);
    const nodeType = getNodeType(node);
    
    setDiagram(prev => ({
      ...prev,
      selectedNode: id,
      expandedCompanyId: nodeType === 'company' ? id : (nodeType === 'base' ? null : prev.expandedCompanyId),
      expandedRoleId: nodeType === 'role' ? id : (nodeType === 'company' || nodeType === 'base' ? null : prev.expandedRoleId)
    }));
  };

  const deleteMultipleNodes = async () => {
    if (diagram.selectedNodes.size === 0) return;
    
    // Filter out base node (id: 1) if somehow selected
    const nodesToDelete = Array.from(diagram.selectedNodes).filter(id => id !== 1);
    if (nodesToDelete.length === 0) return;
    
    setUI(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Find all nodes to delete (including children)
      const toDelete = new Set(nodesToDelete);
      let hasMore = true;
      
      const deletionResults = await deleteNodesFromBackend(toDelete);
      
      // Update frontend state with repositioning
      setDiagram(prev => {
        const remainingNodes = prev.nodes.filter(n => !toDelete.has(n.id));
        let repositionedNodes = remainingNodes;
        for (const deletedNodeId of toDelete) {
          repositionedNodes = repositionSiblingNodes(deletedNodeId, repositionedNodes);
        }
        return {
          ...prev,
          nodes: repositionedNodes,
          connections: prev.connections.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)),
          selectedNodes: new Set(),
          selectedNode: null,
          expandedCompanyId: toDelete.has(prev.expandedCompanyId) ? null : prev.expandedCompanyId,
          expandedRoleId: toDelete.has(prev.expandedRoleId) ? null : prev.expandedRoleId
        };
      });
      
      setData(prev => ({
        ...prev,
        companies: prev.companies.filter(c => !deletionResults.companies.includes(c.id)),
        jobs: prev.jobs.filter(j => !deletionResults.jobs.includes(j.id)),
        tailoredResumes: prev.tailoredResumes.filter(t => !deletionResults.tailored.includes(t.id))
      }));
      
      setModals(prev => ({ ...prev, showDeleteMultiple: false }));
      
    } catch (err) {
      console.error('Failed to delete multiple nodes:', err);
      setUI(prev => ({ ...prev, error: `Failed to delete multiple nodes: ${err.message}` }));
    } finally {
      setUI(prev => ({ ...prev, loading: false }));
    }
  };

  const selectAllNodesOfType = (nodeType) => {
    // Only works when there are currently selected nodes
    const currentSelection = Array.from(diagram.selectedNodes);
    
    if (currentSelection.length > 0) {
      // Get the parent of the first selected node to determine the scope
      const firstSelectedNode = diagram.nodes.find(n => n.id === currentSelection[0]);
      const targetParentId = firstSelectedNode.parentId;
      
      // Select all nodes of the same type that share the same parent
      const nodesOfType = diagram.nodes.filter(node => {
        const type = getNodeType(node);
        return type === nodeType && node.id !== 1 && node.parentId === targetParentId;
      });
      
      const nodeIds = new Set(nodesOfType.map(node => node.id));
      
      setDiagram(prev => ({
        ...prev,
        selectedNodes: nodeIds,
        selectedNode: null
      }));
    }
  };

  const deselectAllNodes = () => {
    setDiagram(prev => ({
      ...prev,
      selectedNodes: new Set(),
      selectedNode: null
    }));
  };

  const deleteNode = async (id) => {
    if (id === 1) return;
    
    const nodeToDelete = diagram.nodes.find(n => n.id === id);
    if (!nodeToDelete) return;
    
    setUI(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Find all nodes to delete (including children)
      const toDelete = new Set([id]);
      let hasMore = true;
      
      const deletionResults = await deleteNodesFromBackend(toDelete);
      
      // Update frontend state with repositioning
      setDiagram(prev => {
        const remainingNodes = prev.nodes.filter(n => !toDelete.has(n.id));
        let repositionedNodes = remainingNodes;
        for (const deletedNodeId of toDelete) {
          repositionedNodes = repositionSiblingNodes(deletedNodeId, repositionedNodes);
        }
        
        return {
          ...prev,
          nodes: repositionedNodes,
          connections: prev.connections.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)),
          selectedNode: null,
          expandedCompanyId: toDelete.has(prev.expandedCompanyId) ? null : prev.expandedCompanyId,
          expandedRoleId: toDelete.has(prev.expandedRoleId) ? null : prev.expandedRoleId
        };
      });
      
      setData(prev => ({
        ...prev,
        companies: prev.companies.filter(c => !deletionResults.companies.includes(c.id)),
        jobs: prev.jobs.filter(j => !deletionResults.jobs.includes(j.id)),
        tailoredResumes: prev.tailoredResumes.filter(t => !deletionResults.tailored.includes(t.id))
      }));
      
    } catch (err) {
      console.error('Failed to delete node:', err);
      setUI(prev => ({ ...prev, error: `Failed to delete node: ${err.message}` }));
    } finally {
      setUI(prev => ({ ...prev, loading: false }));
    }
  };

  const generatePath = (from, to) => {
    const fromNode = diagram.nodes.find(n => n.id === from);
    const toNode = diagram.nodes.find(n => n.id === to);
    
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
    setUI(prev => ({
      ...prev,
      isDragging: true,
      dragOffset: {
        x: e.clientX - prev.panelPosition.x,
        y: e.clientY - prev.panelPosition.y
      }
    }));
  };

  const handleMouseMove = (e) => {
    if (!ui.isDragging) return;
    setUI(prev => ({
      ...prev,
      panelPosition: {
        x: e.clientX - prev.dragOffset.x,
        y: e.clientY - prev.dragOffset.y
      }
    }));
  };

  const handleMouseUp = () => {
    setUI(prev => ({ ...prev, isDragging: false }));
  };

  const updateNodeLabel = async (nodeId, newLabel) => {
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node || !node.backendId) return;
    
    setUI(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (node.type === 'company') {
        const updatedCompany = await apiService.updateCompany(node.backendId, {
          name: newLabel,
          description: node.backendData.description,
          website: node.backendData.website,
          industry: node.backendData.industry
        });
        
        setData(prev => ({
          ...prev,
          companies: prev.companies.map(c => c.id === node.backendId ? updatedCompany : c)
        }));
      } else if (node.type === 'role') {
        const updatedJob = await apiService.updateJob(node.backendId, {
          title: newLabel,
          description: node.backendData.description,
          company: node.backendData.company,
          requirements: node.backendData.requirements,
          location: node.backendData.location,
          salary_range: node.backendData.salary_range,
          job_type: node.backendData.job_type
        });
        
        setData(prev => ({
          ...prev,
          jobs: prev.jobs.map(j => j.id === node.backendId ? updatedJob : j)
        }));
      }
      
      // Update frontend state
      setDiagram(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === nodeId ? { ...node, label: newLabel } : node
        )
      }));
      
    } catch (err) {
      console.error('Failed to update node:', err);
      setUI(prev => ({ ...prev, error: `Failed to update node: ${err.message}` }));
    } finally {
      setUI(prev => ({ ...prev, loading: false }));
    }
  };

  const updateJobDescription = async (nodeId, newDescription) => {
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node || !node.backendId || node.type !== 'role') return;
    
    setUI(prev => ({ ...prev, loading: true, error: null }));

    try {
      const updatedJob = await apiService.updateJob(node.backendId, {
        title: node.label,
        description: newDescription,
        company: node.backendData.company,
        requirements: node.backendData.requirements,
        location: node.backendData.location,
        salary_range: node.backendData.salary_range,
        job_type: node.backendData.job_type
      });
      
      setData(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => j.id === node.backendId ? updatedJob : j)
      }));
      
      // Update frontend state with new backend data
      setDiagram(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === nodeId ? { ...n, backendData: updatedJob } : n
        )
      }));
      
    } catch (err) {
      console.error('Failed to update job description:', err);
      setUI(prev => ({ ...prev, error: `Failed to update job description: ${err.message}` }));
    } finally {
      setUI(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (editing.nodeId !== null) {
      setTimeout(() => editInputRef.current?.focus(), 0);
    }
  }, [editing.nodeId]);

  // Reduced motion detection (keeping for potential future use)
  const shouldReduceMotion = useReducedMotion();

  // Determine which nodes are visible - optimized logic
  const visibleNodes = useMemo(() => {
    return diagram.nodes.filter(node => {
      const type = getNodeType(node);
      return type === 'base' || 
             type === 'company' ||
             (type === 'role' && (diagram.expandedCompanyId === node.parentId || diagram.selectedNode === node.parentId)) ||
             (type === 'tailored' && (diagram.expandedRoleId === node.parentId || diagram.selectedNode === node.parentId));
    });
  }, [diagram.nodes, diagram.expandedCompanyId, diagram.expandedRoleId, diagram.selectedNode]);

  // Only show connections where both nodes are visible - memoized
  const visibleConnections = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    return diagram.connections.filter(conn => visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to));
  }, [visibleNodes, diagram.connections]);

  return (
    <div 
      className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <InfoPanel />
      <ControlPanel 
        nodes={diagram.nodes}
        selectedNode={diagram.selectedNode}
        newNodeLabel={editing.newNodeLabel}
        setNewNodeLabel={(value) => setEditing(prev => ({ ...prev, newNodeLabel: value }))}
        panelPosition={ui.panelPosition}
        isDragging={ui.isDragging}
        handlePanelMouseDown={handlePanelMouseDown}
        addChildNode={addChildNode}
        addTailoredResumeNode={addTailoredResumeNode}
        deleteNode={deleteNode}
        selectedNodes={diagram.selectedNodes}
        setSelectedNodes={(nodes) => setDiagram(prev => ({ ...prev, selectedNodes: nodes }))}
        setShowDeleteMultipleModal={(show) => setModals(prev => ({ ...prev, showDeleteMultiple: show }))}
        deleteMultipleNodes={deleteMultipleNodes}
        selectAllNodesOfType={selectAllNodesOfType}
        deselectAllNodes={deselectAllNodes}
        setSelectedNode={(node) => setDiagram(prev => ({ ...prev, selectedNode: node }))}
        getNodeType={getNodeType}
        getNodeTypeLabel={getNodeTypeLabel}
        uploadedCV={data.uploadedCV}
        setUploadedCV={(cv) => setData(prev => ({ ...prev, uploadedCV: cv }))}
        continuousAdd={process.continuousAdd}
        setContinuousAdd={(add) => setProcess(prev => ({ ...prev, continuousAdd: add }))}
        updateNodeLabel={updateNodeLabel}
        updateJobDescription={updateJobDescription}
        loading={ui.loading}
        error={ui.error}
        setError={(error) => setUI(prev => ({ ...prev, error }))}
        showCVWarning={modals.showCVWarning}
        setShowCVWarning={(show) => setModals(prev => ({ ...prev, showCVWarning: show }))}
        isGeneratingResume={process.isGeneratingResume}
        setIsGeneratingResume={(generating) => setProcess(prev => ({ ...prev, isGeneratingResume: generating }))}
        setResumeUrl={(url) => setData(prev => ({ ...prev, resumeUrl: url }))}
        setShowResumePopup={(show) => setModals(prev => ({ ...prev, showResume: show }))}
        setShowPlainTextPopup={(show) => setModals(prev => ({ ...prev, showPlainText: show }))}
        setPlainTextContent={(content) => setData(prev => ({ ...prev, plainTextContent: content }))}
        setPlainTextFilename={(filename) => setData(prev => ({ ...prev, plainTextFilename: filename }))}
      />

      {/* Calculate required canvas dimensions based on node positions */}
      {(() => {
        const maxY = visibleNodes.length > 0 ? Math.max(...visibleNodes.map(node => node.y)) : 400;
        const maxX = visibleNodes.length > 0 ? Math.max(...visibleNodes.map(node => node.x)) : 1000;
        const canvasHeight = Math.max(maxY + 200, 800); // Add padding and minimum height
        const canvasWidth = Math.max(maxX + 400, 2000); // Add padding and minimum width
        
        return (
          <>
            {/* Scrollable Canvas */}
            <div className="absolute inset-0 overflow-auto py-16 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <div className="relative" style={{ minHeight: '100%', minWidth: '100%', width: `${canvasWidth}px`, height: `${canvasHeight}px` }}>
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
            {visibleConnections.map((conn, idx) => {
              const d = generatePath(conn.from, conn.to);
              const isConnected = diagram.selectedNode !== null && (conn.from === diagram.selectedNode || conn.to === diagram.selectedNode);
              // Remove animation by using static key without selection state
              const key = `${conn.from}-${conn.to}`;

              return (
                <path
                  key={key}
                  d={d}
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  // markerEnd="url(#arrowhead)"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          <div>
            {visibleNodes.map((node, nodeIndex) => {
              const nodeType = getNodeType(node);
              const color = node.color || getNodeColor(node);
              const isTailored = node.type === 'tailored';
              return (
                <div
                  key={node.id}
                  className={`absolute ${color} rounded-xl shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl hover:brightness-90 transform ${
                    diagram.selectedNode === node.id 
                      ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-yellow-400/25' 
                      : diagram.selectedNodes.has(node.id)
                      ? 'ring-4 ring-blue-400 ring-opacity-75 shadow-blue-400/25'
                      : 'hover:ring-2 hover:ring-white/20'
                  } backdrop-blur-sm border border-white/10`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: '180px',
                    padding: '12px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id, e);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    // start inline edit
                    setEditing(prev => ({ ...prev, nodeId: node.id, label: node.label || '' }));
                    handleNodeClick(node.id, e);
                  }}
            >
              <div className="text-white font-semibold text-sm flex items-center justify-center gap-2 drop-shadow-sm">
                {getNodeIcon(node)}
                {editing.nodeId === node.id ? (
                  <input
                    ref={editInputRef}
                    value={editing.label}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditing(prev => ({ ...prev, label: e.target.value }))}
                    onBlur={async () => {
                      // save on blur - update both frontend and backend
                      if (editing.label && editing.label.trim() !== node.label) {
                        await updateNodeLabel(node.id, editing.label.trim());
                      }
                      setEditing(prev => ({ ...prev, nodeId: null, label: '' }));
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        // save on enter - update both frontend and backend
                        if (editing.label && editing.label.trim() !== node.label) {
                          await updateNodeLabel(node.id, editing.label.trim());
                        }
                        setEditing(prev => ({ ...prev, nodeId: null, label: '' }));
                      } else if (e.key === 'Escape') {
                        setEditing(prev => ({ ...prev, nodeId: null, label: '' }));
                      }
                    }}
                    className="w-full bg-transparent text-white font-semibold text-sm text-center outline-none border-b border-white/30 focus:border-white/60 transition-colors"
                  />
                ) : (
                  // Truncate long labels visually and expose full text via title for accessibility
                  <span
                    className="truncate max-w-[120px] block text-center hover:text-white/90 transition-colors"
                    title={node.label}
                    aria-label={node.label}
                    tabIndex={0}
                  >
                    {node.label}
                  </span>
                )}
              </div>
              {node.id === 1 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg animate-pulse border border-white/20">
                  START
                </div>
              )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
            </>
          );
        })()}

      {/* Resume Popup */}
      <Modal
        opened={modals.showResume}
        onClose={() => setModals(prev => ({ ...prev, showResume: false }))}
        title="Tailored Resume"
        size="xl"
        centered
        styles={{
          body: { padding: 0 },
          content: { height: '85vh', position: 'relative',overflow: 'hidden' },
        }}
      >
        <Box style={{ height: '80vh', overflow: 'hidden' }} className="rounded-lg shadow-2xl">
          <iframe
            src={data.resumeUrl}
            style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
            title="Resume Preview"
            className="rounded-lg"
          />
        </Box>
      </Modal>

      {/* Plain Text Resume Popup */}
      <Modal
        opened={modals.showPlainText}
        onClose={() => {
          setModals(prev => ({ ...prev, showPlainText: false }));
          setData(prev => ({ ...prev, isEditingPlainText: false, editedPlainText: '' }));
        }}
        title={
          <div className="space-y-1">
            <Text size="lg" fw={600} className="text-gray-800 font-bold">Resume Text Content</Text>
            {data.plainTextFilename && (
              <Text size="sm" c="dimmed" className="text-gray-500 text-xs">From: {data.plainTextFilename}</Text>
            )}
          </div>
        }
        size="xl"
        centered
        styles={{
          body: { padding: 0 },
          content: { height: '85vh', position: 'relative', overflow: 'hidden' },
        }}
      >
        <Box style={{ height: '70vh', overflow: 'auto', padding: 'var(--mantine-spacing-md)' }} className="bg-gray-50">
          {data.isEditingPlainText ? (
            <Textarea
              value={data.editedPlainText}
              onChange={(event) => setData(prev => ({ ...prev, editedPlainText: event.target.value }))}
              placeholder="Edit your CV text here..."
              autosize
              minRows={25}
              maxRows={30}
              className="font-mono text-sm"
              styles={{
                input: {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: 'black',
                  backgroundColor: 'var(--mantine-color-gray-0)',
                  border: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: 'var(--mantine-spacing-md)',
                  height: '60vh',
                  resize: 'vertical'
                }
              }}
            />
          ) : (
            <Box
              component="pre"
              className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-white p-4 rounded-lg border border-gray-200 shadow-inner"
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'var(--mantine-color-gray-8)',
                backgroundColor: 'var(--mantine-color-gray-0)',
                padding: 'var(--mantine-spacing-md)',
                borderRadius: 'var(--mantine-radius-sm)',
                border: '1px solid var(--mantine-color-gray-3)',
              }}
            >
              {data.plainTextContent}
            </Box>
          )}
        </Box>
        <Group justify="space-between" p="md" className="bg-gray-100 border-t border-gray-200" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Group>
            {!data.isEditingPlainText ? (
              <Button
                variant="filled"
                color="blue"
                className="transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                onClick={() => {
                  console.log('Edit button clicked, current plainTextContent:', data.plainTextContent);
                  setData(prev => ({
                    ...prev,
                    isEditingPlainText: true,
                    editedPlainText: prev.plainTextContent
                  }));
                }}
              >
                Edit Text
              </Button>
            ) : (
              <Group>
                <Button
                  variant="filled"
                  color="green"
                  className="transition-all duration-200 hover:bg-green-700 hover:shadow-md"
                  onClick={async () => {
                    try {
                      console.log('Save button clicked, editedPlainText:', data.editedPlainText);
                      const latestCV = await apiService.getLatestCV();
                      console.log('Latest CV:', latestCV);
                      
                      if (latestCV && latestCV.id) {
                        console.log('Updating CV text for ID:', latestCV.id);
                        await apiService.updateCVText(latestCV.id, data.editedPlainText);
                        setData(prev => ({
                          ...prev,
                          plainTextContent: prev.editedPlainText,
                          isEditingPlainText: false
                        }));
                        notifications.show({
                          title: 'Success!',
                          message: 'CV text updated successfully',
                          color: 'green',
                          icon: <FaCheck size={16} />,
                        });
                      } else {
                        notifications.show({
                          title: 'Error',
                          message: 'No CV found. Please upload a CV first.',
                          color: 'red',
                        });
                      }
                    } catch (error) {
                      console.error('Error updating CV text:', error);
                      notifications.show({
                        title: 'Error',
                        message: error.message || 'Failed to update CV text',
                        color: 'red',
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  color="gray"
                  className="transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      isEditingPlainText: false,
                      editedPlainText: ''
                    }));
                  }}
                >
                  Cancel
                </Button>
              </Group>
            )}
          </Group>
          
          <Button
            variant="default"
            className="transition-all duration-200 hover:bg-gray-100 hover:shadow-md border-blue-200"
            onClick={() => {
              const textToCopy = data.isEditingPlainText ? data.editedPlainText : data.plainTextContent;
              navigator.clipboard.writeText(textToCopy);
              notifications.show({
                title: 'Copied!',
                message: 'Resume text copied to clipboard',
                color: 'green',
                icon: <FaCheck size={16} />,
              });
            }}
          >
            Copy Text
          </Button>
        </Group>
      </Modal>

      {/* Duplicate Company Error Popup */}
      <Modal
        opened={modals.showDuplicateCompanyError}
        onClose={() => {
          setModals(prev => ({ ...prev, showDuplicateCompanyError: false }));
          setData(prev => ({ ...prev, duplicateCompanyName: '' }));
        }}
        title="Company Already Exists"
        centered
        className="backdrop-blur-sm"
      >
        <Group mb="md" className="items-start space-x-4">
          <ThemeIcon 
            color="red" 
            variant="light" 
            size="lg"
            className="mt-1 shadow-lg ring-2 ring-red-100"
          >
            <FaExclamationTriangle size={24} />
          </ThemeIcon>
          <Box style={{ flex: 1 }} className="space-y-2">
            <Text className="text-gray-700 leading-relaxed">
              A company with the name "<Text component="span" fw={700} className="text-red-600 font-bold">"{data.duplicateCompanyName}"</Text>" already exists. 
              Company names must be unique. Please choose a different name.
            </Text>
          </Box>
        </Group>
        <Group justify="flex-end" className="pt-4 border-t border-gray-100">
          <Button
            onClick={() => {
              setModals(prev => ({ ...prev, showDuplicateCompanyError: false }));
              setData(prev => ({ ...prev, duplicateCompanyName: '' }));
            }}
            className="transition-all duration-200 hover:bg-blue-100 hover:shadow-md"
          >
            OK
          </Button>
        </Group>
      </Modal>
    </div>
  );
}