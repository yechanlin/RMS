import React, { useState, useEffect } from 'react';
import InfoPanel from './InfoPanel';
import ControlPanel from './ControlPanel';
import apiService from '../services/api';

// icons
import { FaUpload, FaTimes } from "react-icons/fa";

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
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [tailoredResumes, setTailoredResumes] = useState([]);

  // Load data from backend on component mount
  useEffect(() => {
    loadDataFromBackend();
  }, []);

  const loadDataFromBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading data from backend...');
      const [companiesData, jobsData, latestCVData, tailoredResumesData] = await Promise.all([
        apiService.getCompanies(),
        apiService.getJobs(),
        apiService.getLatestCV().catch(() => null), // Don't fail if no CV exists
        apiService.getTailoredResumes().catch(() => []) // Don't fail if no tailored resumes exist
      ]);
      
      console.log('Companies data:', companiesData);
      console.log('Jobs data:', jobsData);
      console.log('Latest CV data:', latestCVData);
      console.log('Tailored resumes data:', tailoredResumesData);
      
      setCompanies(companiesData);
      setJobs(jobsData);
      setTailoredResumes(tailoredResumesData);
      
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
      syncNodesWithBackendData(companiesData, jobsData, tailoredResumesData);
      console.log('Data loaded successfully');
    } catch (err) {
      console.error('Failed to load data from backend:', err);
      setError(`Failed to load data from backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncNodesWithBackendData = (companiesData, jobsData, tailoredResumesData = []) => {
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
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
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
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
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
      
      tailoredNodes.push({
        id: `tailored_${resume.id}`,
        label: 'Tailored Resume',
        x: jobNode.x + 350,
        y: jobNode.y + (jobTailoredCounts[jobNode.id] * 180),
        color: 'bg-gradient-to-r from-orange-500 to-orange-600',
        type: 'tailored',
        parentId: jobNode.id,
        backendId: resume.id,
        backendData: {
          file_path: resume.file_path,
          tailored_resume: resume.tailored_content,
          company: resume.company_name,
          created_at: resume.created_at
        }
      });
      
      jobTailoredCounts[jobNode.id]++;
    });

    const allNodes = [baseNode, ...companyNodes, ...jobNodes, ...tailoredNodes];
    setNodes(allNodes);

    // Create connections
    const connections = [];
    companyNodes.forEach(companyNode => {
      connections.push({ from: 1, to: companyNode.id });
    });
    jobNodes.forEach(jobNode => {
      connections.push({ from: jobNode.parentId, to: jobNode.id });
    });
    tailoredNodes.forEach(tailoredNode => {
      connections.push({ from: tailoredNode.parentId, to: tailoredNode.id });
    });
    setConnections(connections);
  };

  const getNodeType = (node) => {
    if (node.type === 'base') return 'base';
    if (node.type === 'company') return 'company';
    if (node.type === 'role') return 'role';
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
    } else if (nodeType === 'role') {
      // For tailored resumes under role nodes
      xOffset = 350;
      ySpacing = 80;
      baseY = parentNode.y;
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
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
          type: 'company',
          parentId: selectedNode,
          backendId: newCompany.id,
          backendData: newCompany
        };

        setNodes([...nodes, newNode]);
        setConnections([...connections, { from: selectedNode, to: newNode.id }]);
        setCompanies([...companies, newCompany]);
        
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
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
          type: 'role',
          parentId: selectedNode,
          backendId: newJob.id,
          backendData: newJob
        };

        setNodes([...nodes, newNode]);
        setConnections([...connections, { from: selectedNode, to: newNode.id }]);
        setJobs([...jobs, newJob]);
      }
      
      setNewNodeLabel('');
    } catch (err) {
      console.error('Failed to create node:', err);
      setError(`Failed to create ${nodeType}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTailoredResumeNode = (parentRoleNodeId, payload) => {
    const parentNode = nodes.find(n => n.id === parentRoleNodeId);
    if (!parentNode) return;
    
    // Count existing tailored resume children for this parent
    const existingTailoredCount = nodes.filter(n => 
      n.parentId === parentRoleNodeId && n.type === 'tailored'
    ).length;
    
    const newNode = {
      id: `tailored_${Date.now()}`,
      label: 'Tailored Resume',
      x: parentNode.x + 350,
      y: parentNode.y + (existingTailoredCount * 180),
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      type: 'tailored',
      parentId: parentRoleNodeId,
      backendId: null,
      backendData: payload,
    };
    setNodes([...nodes, newNode]);
    setConnections([...connections, { from: parentRoleNodeId, to: newNode.id }]);
    setSelectedNode(newNode.id);
    
    // Add to tailored resumes state if it has backend data
    if (payload.id) {
      setTailoredResumes([...tailoredResumes, {
        id: payload.id,
        job: parentRoleNodeId.replace('job_', ''),
        file_path: payload.file_path,
        tailored_content: payload.tailored_resume,
        created_at: payload.created_at
      }]);
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
      // Delete from backend first
      if (nodeToDelete.type === 'company' && nodeToDelete.backendId) {
        await apiService.deleteCompany(nodeToDelete.backendId);
        setCompanies(companies.filter(c => c.id !== nodeToDelete.backendId));
      } else if (nodeToDelete.type === 'role' && nodeToDelete.backendId) {
        await apiService.deleteJob(nodeToDelete.backendId);
        setJobs(jobs.filter(j => j.id !== nodeToDelete.backendId));
      }
      
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
      
      // Delete child nodes from backend
      for (const nodeId of toDelete) {
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.backendId) {
          if (node.type === 'company') {
            await apiService.deleteCompany(node.backendId);
            setCompanies(companies.filter(c => c.id !== node.backendId));
          } else if (node.type === 'role') {
            await apiService.deleteJob(node.backendId);
            setJobs(jobs.filter(j => j.id !== node.backendId));
          }
        }
      }
      
      // Update frontend state
      setNodes(nodes.filter(n => !toDelete.has(n.id)));
      setConnections(connections.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)));
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
        
        setCompanies(companies.map(c => 
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
        
        setJobs(jobs.map(j => 
          j.id === node.backendId ? updatedJob : j
        ));
      }
      
      // Update frontend state
      setNodes(nodes.map(node => 
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
      
      setJobs(jobs.map(j => 
        j.id === node.backendId ? updatedJob : j
      ));
      
      // Update frontend state with new backend data
      setNodes(nodes.map(n => 
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

  // Determine which nodes are visible
  const visibleNodes = nodes.filter(node => {
    const type = getNodeType(node);
    if (type === 'base') return true;
    if (type === 'company') return true;
    // Show roles under expanded company
    if (type === 'role' && expandedCompanyId && node.parentId === expandedCompanyId) return true;
    // Show children of currently selected node (e.g., tailored resume under role)
    if (selectedNode && node.parentId === selectedNode) return true;
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
        addTailoredResumeNode={addTailoredResumeNode}
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
              : node.type === 'tailored'
              ? 'bg-gradient-to-r from-orange-600 to-orange-900'
              : 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600';
            const isTailored = node.type === 'tailored';
            return (
              <div
                key={node.id}
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
            >
              <div className="text-white font-semibold text-sm flex items-center justify-center gap-2">
                {node.id === 1 && <FaUpload />}
                {node.label}
              </div>
              {isTailored && node.backendData && (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const path = node.backendData.file_path;
                      if (!path) return;
                      // Use direct media URL with proper headers
                      const link = document.createElement('a');
                      link.href = `http://localhost:8000/media/${path}`;
                      link.target = '_blank';
                      link.click();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                  >
                    View Resume
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const path = node.backendData.file_path;
                      if (!path) return;
                      
                      try {
                        const response = await fetch(`http://localhost:8000/media/${path}`);
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
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Download
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const roleNode = nodes.find(n => n.id === node.parentId);
                      const companyNode = nodes.find(n => n.id === roleNode?.parentId);
                      if (!uploadedCV || !companyNode || !roleNode) return;
                      
                      try {
                        // Get the actual CV file from backend
                        const latestCV = await apiService.getLatestCV();
                        if (!latestCV || !latestCV.id) {
                          console.error('No CV found');
                          return;
                        }
                        
                        const response = await fetch(`http://localhost:8000/api/resumes/base-cv/${latestCV.id}/download/`);
                        if (!response.ok) {
                          throw new Error('Failed to download CV');
                        }
                        
                        const blob = await response.blob();
                        const formCv = new File([blob], latestCV.filename, { type: latestCV.content_type });
                        
                        const result = await apiService.tailorResume({
                          cv: formCv,
                          company: companyNode.label,
                          job_description: roleNode.backendData?.description || ''
                        });
                        const normalizedPath = (result.file_path || '').replace(/\\\\/g, '/').replace(/\\/g, '/');
                        addTailoredResumeNode(roleNode.id, {
                          tailored_resume: result.tailored_resume,
                          file_path: normalizedPath,
                          company: result.company,
                          created_at: Date.now()
                        });
                      } catch (apiErr) {
                        console.error('Failed to create new tailored resume:', apiErr);
                      }
                    }}
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Create new
                  </button>
                </div>
              )}
              {node.id === 1 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  START
                </div>
              )}
            </div>
          )})}
        </div>
      </div>

      {/* Resume Popup */}
      {showResumePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Tailored Resume</h3>
              <button
                onClick={() => setShowResumePopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={resumeUrl}
                className="w-full h-full"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}