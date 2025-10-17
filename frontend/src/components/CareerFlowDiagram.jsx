import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import InfoPanel from './InfoPanel';
import ControlPanel from './ControlPanel';
import apiService from '../services/api';

// icons
import { FaUpload, FaBuilding, FaUserTie } from "react-icons/fa";

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
  const [editingNode, setEditingNode] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const editInputRef = useRef(null);
  // Remove showAddChild state
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uploadedCV, setUploadedCV] = useState(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const [continuousAdd, setContinuousAdd] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forceRender, setForceRender] = useState(0);

  // Load data from backend on component mount
  useEffect(() => {
    loadDataFromBackend();
  }, []);

  const loadDataFromBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading data from backend...');
      const [companiesData, jobsData, latestCVData] = await Promise.all([
        apiService.getCompanies(),
        apiService.getJobs(),
        apiService.getLatestCV().catch(() => null) // Don't fail if no CV exists
      ]);
      
      console.log('Companies data:', companiesData);
      console.log('Jobs data:', jobsData);
      console.log('Latest CV data:', latestCVData);
      
      setCompanies(companiesData);
      setJobs(jobsData);
      
      // Set uploaded CV if one exists
      if (latestCVData && latestCVData.filename) {
        // Create a mock file object for display purposes
        const mockFile = {
          name: latestCVData.filename,
          size: latestCVData.file_size,
          type: latestCVData.content_type
        };
        setUploadedCV(mockFile);
      }
      
      // Sync nodes with backend data
      const syncedNodes = syncNodesWithBackendData(companiesData, jobsData);
      setNodes(syncedNodes);
      console.log('Data loaded successfully');
    } catch (err) {
      console.error('Failed to load data from backend:', err);
      setError(`Failed to load data from backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncNodesWithBackendData = (companiesData, jobsData) => {
    const baseNode = { 
      id: 1, 
      label: 'Upload base cv here', 
      x: 100, 
      y: 400, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      type: 'base',
      parentId: null
    };

    const companyNodes = companiesData.map((company, index) => ({
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

    const jobNodes = jobsData.map((job, index) => {
      const companyNode = companyNodes.find(cn => cn.backendId === job.company);
      if (!companyNode) return null;
      
      const companyJobCount = jobsData.filter(j => j.company === job.company).indexOf(job);
      
      return {
        id: `job_${job.id}`,
        label: job.title,
        x: companyNode.x + 350,
        y: companyNode.y - 100 + (companyJobCount * 120),
        color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        type: 'role',
        parentId: companyNode.id,
        backendId: job.id,
        backendData: job
      };
    }).filter(Boolean);

    const allNodes = [baseNode, ...companyNodes, ...jobNodes];

    // Create connections
    const connections = [];
    companyNodes.forEach(companyNode => {
      connections.push({ from: 1, to: companyNode.id });
    });
    jobNodes.forEach(jobNode => {
      connections.push({ from: jobNode.parentId, to: jobNode.id });
    });
    setConnections(connections);
    
    return allNodes;
  };

  const getNodeType = (node) => {
    if (node.type === 'base') return 'base';
    if (node.type === 'company') return 'company';
    if (node.type === 'role') return 'role';
    if (node.parentId === 1) return 'company';
    return 'role';
  };

  const getNodeColor = (node) => {
    const type = getNodeType(node);
    if (type === 'base') return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (type === 'company') return 'bg-gradient-to-r from-green-500 to-green-600';
    return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
  };

  const getNodeIcon = (node) => {
    const type = getNodeType(node);
    if (type === 'base') return <FaUpload />;
    if (type === 'company') return <FaBuilding />;
    return <FaUserTie />;
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

  const addChildNode = async () => {
    if (!newNodeLabel.trim() || !selectedNode) return;

    const parentNode = nodes.find(n => n.id === selectedNode);
    const nodeType = getNodeType(parentNode);
    
    setLoading(true);
    setError(null);

    try {
      if (nodeType === 'base') {
        // Adding a company
        const companyData = {
          name: newNodeLabel.trim(),
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
          parentId: selectedNode,
          backendId: newCompany.id,
          backendData: newCompany
        };

        // Update all states
        setNodes(prevNodes => [...prevNodes, newNode]);
        setConnections(prevConnections => [...prevConnections, { from: selectedNode, to: newNode.id }]);
        setCompanies(prevCompanies => [...prevCompanies, newCompany]);
        
        // Reload data from backend to ensure consistency
        setTimeout(() => {
          loadDataFromBackend();
        }, 100);
        
      } else if (nodeType === 'company') {
        // Adding a job/role
        const jobData = {
          title: newNodeLabel.trim(),
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
          parentId: selectedNode,
          backendId: newJob.id,
          backendData: newJob
        };

        // Update all states
        setNodes(prevNodes => [...prevNodes, newNode]);
        setConnections(prevConnections => [...prevConnections, { from: selectedNode, to: newNode.id }]);
        setJobs(prevJobs => [...prevJobs, newJob]);
        
        // Reload data from backend to ensure consistency
        setTimeout(() => {
          loadDataFromBackend();
        }, 100);
      }
      
      setNewNodeLabel('');
    } catch (err) {
      console.error('Failed to create node:', err);
      setError(`Failed to create ${nodeType}: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  const deleteNode = async (id) => {
    if (id === 1) return;
    
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;
    
    setLoading(true);
    setError(null);

    try {
      // Find all nodes to delete (including children)
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
      
      // Delete all nodes from backend
      const companiesToRemove = [];
      const jobsToRemove = [];
      
      for (const nodeId of toDelete) {
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.backendId) {
          if (node.type === 'company') {
            await apiService.deleteCompany(node.backendId);
            companiesToRemove.push(node.backendId);
          } else if (node.type === 'role') {
            await apiService.deleteJob(node.backendId);
            jobsToRemove.push(node.backendId);
          }
        }
      }
      
      // Update frontend state
      setNodes(prevNodes => prevNodes.filter(n => !toDelete.has(n.id)));
      setConnections(prevConnections => prevConnections.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)));
      setCompanies(prevCompanies => prevCompanies.filter(c => !companiesToRemove.includes(c.id)));
      setJobs(prevJobs => prevJobs.filter(j => !jobsToRemove.includes(j.id)));
      setSelectedNode(null);
      
    } catch (err) {
      console.error('Failed to delete node:', err);
      setError(`Failed to delete node: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  const updateNodeLabel = async (nodeId, newLabel) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.backendId) return;
    
    setLoading(true);
    setError(null);

    try {
      if (node.type === 'company') {
        const updatedCompany = await apiService.updateCompany(node.backendId, {
          name: newLabel,
          description: node.backendData.description,
          website: node.backendData.website,
          industry: node.backendData.industry
        });
        
        setCompanies(prevCompanies => prevCompanies.map(c => 
          c.id === node.backendId ? updatedCompany : c
        ));
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
        
        setJobs(prevJobs => prevJobs.map(j => 
          j.id === node.backendId ? updatedJob : j
        ));
      }
      
      // Update frontend state
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, label: newLabel }
          : node
      ));
      
    } catch (err) {
      console.error('Failed to update node:', err);
      setError(`Failed to update node: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateJobDescription = async (nodeId, newDescription) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.backendId || node.type !== 'role') return;
    
    setLoading(true);
    setError(null);

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
      
      setJobs(prevJobs => prevJobs.map(j => 
        j.id === node.backendId ? updatedJob : j
      ));
      
      // Update frontend state with new backend data
      setNodes(prevNodes => prevNodes.map(n => 
        n.id === nodeId 
          ? { ...n, backendData: updatedJob }
          : n
      ));
      
    } catch (err) {
      console.error('Failed to update job description:', err);
      setError(`Failed to update job description: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingNode !== null) {
      // focus the input when editing starts
      setTimeout(() => editInputRef.current && editInputRef.current.focus(), 0);
    }
  }, [editingNode]);

  // Motion settings
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.06,
      },
    },
  };

  const nodeVariants = {
    hidden: { scale: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 },
    show: { scale: 1, opacity: 1, transition: { duration: 0.33, ease: 'easeOut' } },
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
        updateJobDescription={updateJobDescription}
        loading={loading}
        error={error}
        setError={setError}
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
            {visibleConnections.map((conn, idx) => {
              const d = generatePath(conn.from, conn.to);
              const isConnected = selectedNode !== null && (conn.from === selectedNode || conn.to === selectedNode);
              const delay = shouldReduceMotion || !isConnected ? 0 : idx * 0.04;
              // include selected info in key only for connected paths so they remount and animate when selection changes
              const key = isConnected ? `${conn.from}-${conn.to}-sel-${selectedNode}` : `${conn.from}-${conn.to}`;

              return (
                <motion.path
                  key={key}
                  d={d}
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={shouldReduceMotion || !isConnected ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeInOut', delay }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {visibleNodes.map((node, nodeIndex) => {
              const nodeType = getNodeType(node);
              const color = node.color || getNodeColor(node);
              return (
                <motion.div
                  key={node.id}
                  variants={nodeVariants}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.33 }}
                  className={`absolute ${color} rounded-lg shadow-lg cursor-pointer transition-all hover:shadow-2xl hover:scale-105 ${
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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    // start inline edit
                    setEditingNode(node.id);
                    setEditingLabel(node.label || '');
                    handleNodeClick(node.id);
                  }}
            >
              <div className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                {getNodeIcon(node)}
                {editingNode === node.id ? (
                  <input
                    ref={editInputRef}
                    value={editingLabel}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={() => {
                      // save on blur
                      setNodes(nodes.map(n => n.id === node.id ? { ...n, label: editingLabel || n.label } : n));
                      setEditingNode(null);
                      setEditingLabel('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setNodes(nodes.map(n => n.id === node.id ? { ...n, label: editingLabel || n.label } : n));
                        setEditingNode(null);
                        setEditingLabel('');
                      } else if (e.key === 'Escape') {
                        setEditingNode(null);
                        setEditingLabel('');
                      }
                    }}
                    className="w-full bg-transparent text-white font-semibold text-sm text-center outline-none"
                  />
                ) : (
                  <span>{node.label}</span>
                )}
              </div>
              {node.id === 1 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  START
                </div>
              )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}