import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiImage, FiTrash2, FiEdit3, FiPlus, FiFolder, FiFolderPlus,
  FiSearch, FiGrid, FiList, FiRefreshCw, FiChevronRight, FiChevronDown,
  FiMoreVertical, FiDownload, FiLink, FiFile, FiX, FiFileText, FiVideo,
  FiChevronRight as FiChevronRightIcon, FiArrowLeft
} from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import CloudinaryUpload from '../../components/ui/CloudinaryUpload';
import { deleteFromCloudinary } from "../../utils/cloudinary";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MediaManagement = () => {
  // -- State --
  const [folders, setFolders] = useState([]); // Root folders
  const [subFolders, setSubFolders] = useState([]); // Folders in current main view
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState(''); // Default root
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [rateLimitError, setRateLimitError] = useState(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Folder Action Modals
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);

  // Selection
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null); // For folder actions

  const [newFolderName, setNewFolderName] = useState('');
  const [newName, setNewName] = useState('');
  const [creatingInPath, setCreatingInPath] = useState(null); // Track where we are creating the folder

  // -- Effects --
  useEffect(() => {
    fetchTreeFolders();
  }, []);

  useEffect(() => {
    fetchContent(currentPath);
  }, [currentPath]);

  // -- API Actions --

  const fetchTreeFolders = async (refresh = false) => {
    try {
      const url = refresh ? `${API_URL}/api/cloudinary/folders?refresh=true` : `${API_URL}/api/cloudinary/folders`;
      const res = await fetch(url);
      if (res.status === 420 || res.status === 429) {
        const errData = await res.json();
        setRateLimitError(errData.error?.message || "Rate limit exceeded. Please try again later.");
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch folders');
      const data = await res.json();
      setRateLimitError(null);
      setFolders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContent = async (path, refresh = false) => {
    setLoadingFiles(true);
    try {
      const queryPath = path;
      const refreshParam = refresh ? '&refresh=true' : '';

      // Parallel fetch: subfolders + files
      const [foldersRes, filesRes] = await Promise.all([
        fetch(`${API_URL}/api/cloudinary/folders?parent=${encodeURIComponent(queryPath)}${refreshParam}`),
        fetch(`${API_URL}/api/cloudinary/files?folder=${encodeURIComponent(queryPath)}${refreshParam}`)
      ]);

      if (foldersRes.status === 420 || filesRes.status === 420 || foldersRes.status === 429 || filesRes.status === 429) {
        setRateLimitError("Rate limit exceeded. Please try again later.");
        return;
      }

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setSubFolders(foldersData);
      }

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        setFiles(filesData);
      }
      setRateLimitError(null);

    } catch (err) {
      console.error(err);
      setFiles([]);
      setSubFolders([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const targetBase = creatingInPath || currentPath;
      // Sanitize: remove trailing slashes and avoid double slashes
      const cleanTarget = targetBase.replace(/\/+$/, '');
      const parentPath = cleanTarget === 'hitam_ai' ? 'hitam_ai' : cleanTarget;

      const res = await fetch(`${API_URL}/api/cloudinary/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: parentPath,
          folderName: newFolderName
        })
      });

      if (!res.ok) throw new Error('Failed to create folder');

      try {
        await fetchContent(currentPath, true);
        await fetchTreeFolders(true);
      } catch (refreshErr) {
        console.warn('Folder created but failed to refresh list (likely rate limit):', refreshErr);
      }
      setNewFolderName('');
      setCreatingInPath(null);
      setShowCreateFolderModal(false);
      alert('Folder created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create folder');
    }
  };

  const handleGoUp = () => {
    if (!currentPath) return; // Already at root
    const parts = currentPath.split('/');
    if (parts.length <= 1) {
      setCurrentPath('');
    } else {
      parts.pop();
      setCurrentPath(parts.join('/'));
    }
  };

  const handleRename = async () => {
    if (!selectedFile || !newName.trim()) return;
    try {
      const folderPrefix = selectedFile.publicId.substring(0, selectedFile.publicId.lastIndexOf('/') + 1);
      const toPublicId = folderPrefix + newName.trim();

      const res = await fetch(`${API_URL}/api/cloudinary/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPublicId: selectedFile.publicId,
          toPublicId: toPublicId
        })
      });

      if (!res.ok) throw new Error('Failed to rename');

      await fetchContent(currentPath);
      setShowRenameModal(false);
      setSelectedFile(null);
      setNewName('');
    } catch (err) {
      console.error(err);
      alert('Failed to rename file');
    }
  };

  // -- Folder Actions --

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;
    try {
      const res = await fetch(`${API_URL}/api/cloudinary/delete-folder`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: selectedFolder.path })
      });

      if (!res.ok) throw new Error('Failed to delete folder');

      await fetchContent(currentPath);
      await fetchTreeFolders();
      setShowDeleteFolderModal(false);
      setSelectedFolder(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!selectedFolder || !newName.trim()) return;
    try {
      const pathParts = selectedFolder.path.split('/');
      pathParts[pathParts.length - 1] = newName.trim();
      const toPath = pathParts.join('/');

      const res = await fetch(`${API_URL}/api/cloudinary/rename-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPath: selectedFolder.path, toPath })
      });

      if (!res.ok) throw new Error('Failed to rename folder');

      await fetchContent(currentPath);
      await fetchTreeFolders();
      setShowRenameFolderModal(false);
      setSelectedFolder(null);
      setNewName('');

    } catch (err) {
      console.error(err);
      alert('Failed to rename folder');
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    try {
      // Pass resourceType to delete endpoint
      await deleteFromCloudinary(selectedFile.publicId, selectedFile.resourceType);
      await fetchContent(currentPath);
      setShowDeleteModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const handleUploadSuccess = async () => {
    setShowUploadModal(false);
    await fetchContent(currentPath);
    await fetchTreeFolders(); // Refresh tree potentially
  };


  // -- UI Helpers --

  const getFileIcon = (file) => {
    if (file.resourceType === 'image') return <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />;
    if (file.resourceType === 'video') return <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white"><FiVideo className="w-12 h-12" /></div>;

    const ext = file.format || (file.name.includes('.') ? file.name.split('.').pop() : '');

    switch (ext.toLowerCase()) {
      case 'pdf': return <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-600"><FiFileText className="w-12 h-12" /><span className="absolute bottom-2 text-xs font-bold">PDF</span></div>;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600"><FiFileText className="w-12 h-12" /><span className="absolute bottom-2 text-xs font-bold">XLS</span></div>;
      case 'doc':
      case 'docx':
        return <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600"><FiFileText className="w-12 h-12" /><span className="absolute bottom-2 text-xs font-bold">DOC</span></div>;
      case 'ppt':
      case 'pptx':
        return <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600"><FiFileText className="w-12 h-12" /><span className="absolute bottom-2 text-xs font-bold">PPT</span></div>;
      default:
        return <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500"><FiFile className="w-12 h-12" /></div>;
    }
  };

  // -- Recursive Sidebar Item --
  // -- Recursive Sidebar Item --
  const RecursiveSidebarItem = ({ name, path, level = 0, onSelect, currentPath, startExpanded = false }) => {
    const [expanded, setExpanded] = useState(startExpanded);
    const [children, setChildren] = useState([]);
    const [loadingChildren, setLoadingChildren] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const isSelected = currentPath === path;
    // Indentation
    const paddingLeft = level * 12 + 12;

    // Auto-load if expanded initially or toggled
    useEffect(() => {
      if (expanded && !loaded && !loadingChildren) {
        fetchChildren();
      }
    }, [expanded]);

    const fetchChildren = async () => {
      setLoadingChildren(true);
      try {
        const res = await fetch(`${API_URL}/api/cloudinary/folders?parent=${encodeURIComponent(path)}`);

        if (res.status === 420 || res.status === 429) {
          console.warn("Sidebar fetch rate limited");
          setLoadingChildren(false);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setChildren(data);
          setLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load subfolders", err);
      } finally {
        setLoadingChildren(false);
      }
    };

    const handleToggle = (e) => {
      e.stopPropagation();
      setExpanded(!expanded);
    };

    return (
      <div className="w-full select-none">
        <div
          className={`flex items-center gap-1 py-1 pr-2 text-sm cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onSelect(path)}
        >
          <div onClick={handleToggle} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
            <FiChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
          <FiFolder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'fill-blue-500 text-blue-600' : 'fill-yellow-100 text-yellow-500'}`} />
          <span className="truncate flex-1">{name}</span>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {loadingChildren && (
                <div className="pl-8 py-1 text-xs text-gray-400 flex items-center gap-2">
                  <FiRefreshCw className="animate-spin w-3 h-3" /> Loading...
                </div>
              )}
              {!loadingChildren && children.length === 0 && loaded && (
                <div className="pl-8 py-1 text-xs text-gray-400 italic">Empty</div>
              )}
              {children.map(child => (
                <RecursiveSidebarItem
                  key={child.path}
                  name={child.name}
                  path={child.path}
                  level={level + 1}
                  onSelect={onSelect}
                  currentPath={currentPath}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };


  const filteredSubFolders = subFolders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFiles = files.filter(f =>
    f.name && !f.name.startsWith('.keep') ? f.name.toLowerCase().includes(searchQuery.toLowerCase()) : false
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 flex flex-col h-screen overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex flex-wrap gap-4 items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4 min-w-[200px] flex-1">
          {currentPath && (
            <Button variant="ghost" size="sm" onClick={handleGoUp} className="mr-[-8px]">
              <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiImage className="text-blue-500" />
            Media Manager
          </h1>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block"></div>
          {/* Breadcrumbs */}
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 overflow-hidden whitespace-nowrap">
            <span className="hover:text-blue-500 cursor-pointer" onClick={() => setCurrentPath('')}>Home</span>
            {currentPath !== '' && currentPath.split('/').map((part, i, arr) => (
              <React.Fragment key={i}>
                <FiChevronRight className="w-3 h-3" />
                <span className={i === arr.length - 1 ? 'font-medium text-gray-800 dark:text-gray-200' : ''}>
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search in folder..."
              className="pl-9 pr-4 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => { fetchContent(currentPath); }}>
            <FiRefreshCw className={loadingFiles ? 'animate-spin' : ''} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setCreatingInPath(currentPath); setShowCreateFolderModal(true); }}>
            <FiFolderPlus className="mr-2" /> New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUploadModal(true)}>
            <FiPlus className="mr-2" /> Upload
          </Button>
        </div>
      </div>

      {/* Rate Limit Alert */}
      {rateLimitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-2 text-sm text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>⚠️ {rateLimitError}</span>
          <button onClick={() => setRateLimitError(null)} className="hover:text-red-800 dark:hover:text-red-300"><FiX /></button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar - Folder Tree */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Folders</h3>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <RecursiveSidebarItem
              name="Home"
              path=""
              level={0}
              onSelect={setCurrentPath}
              currentPath={currentPath}
              startExpanded={true}
            />
          </div>
        </div>

        {/* File View */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900" onClick={() => setSelectedFile(null)}>
          {loadingFiles ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <FiRefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (filteredFiles.length === 0 && filteredSubFolders.length === 0) ? (
            <div className="flex flex-col h-full items-center justify-center text-gray-400">
              <FiFolder className="w-16 h-16 mb-4 opacity-20" />
              <p>No files or folders found.</p>
              <Button variant="link" onClick={() => setShowUploadModal(true)}>Upload one now</Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-2'}>

              {/* Render Subfolders */}
              {filteredSubFolders.map(folder => (
                <div
                  key={folder.path}
                  onClick={(e) => { e.stopPropagation(); setCurrentPath(folder.path); }}
                  className={`
                        group relative rounded-lg border border-gray-200 dark:border-gray-700 
                        bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50
                        transition-all cursor-pointer flex flex-col items-center justify-center p-4
                        ${viewMode === 'list' && 'flex-row justify-start p-2 gap-4 h-16'}
                    `}
                >
                  <div className="relative">
                    <FiFolder className={`${viewMode === 'grid' ? 'w-16 h-16 mb-2 text-blue-100 fill-blue-500' : 'w-10 h-10 text-blue-500 fill-blue-100 flex-shrink-0'}`} />
                    {/* Folder Actions Trigger */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFolder(folder);
                        setNewName(folder.name);
                      }} className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-100">
                        <FiMoreVertical className="w-3 h-3 text-gray-600" />
                      </button>
                      {/* Context Menu Mockup (Usually needs click-outside logic) */}
                      {selectedFolder?.path === folder.path && (
                        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 shadow-lg rounded-md z-30 border border-gray-200 dark:border-gray-700 flex flex-col py-1">
                          <button className="text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={(e) => { e.stopPropagation(); setCreatingInPath(folder.path); setShowCreateFolderModal(true); }}>Create Subfolder</button>
                          <button className="text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={(e) => { e.stopPropagation(); setShowRenameFolderModal(true); }}>Rename</button>
                          <button className="text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600" onClick={(e) => { e.stopPropagation(); setShowDeleteFolderModal(true); }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate w-full text-center">
                    {folder.name}
                  </p>
                  {viewMode === 'list' && <div className="flex-1" />}
                </div>
              ))}

              {filteredFiles.map(file => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(file); }}
                  className={`
                                        group relative rounded-lg border transition-all cursor-pointer overflow-hidden
                                        ${selectedFile?.id === file.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'}
                                    `}
                >
                  {/* Grid Item */}
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-square w-full bg-gray-100 dark:bg-gray-900 relative">
                        {getFileIcon(file)}

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => window.open(file.url, '_blank')} className="p-1.5 bg-white/90 rounded-full hover:bg-white text-gray-800" title="View">
                            <FiLink />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">
                          {file.format} • {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    // List Item
                    <div className="flex items-center p-3 gap-4">
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {/* Small Icon for List */}
                        {file.resourceType === 'image' ? <img src={file.url} className="w-full h-full object-cover" /> : <FiFile className="text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt)?.toLocaleDateString()} • {file.format}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto shrink-0 z-20 shadow-lg"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">Details</h3>
                <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600">
                  <FiX />
                </button>
              </div>
              <div className="p-4 space-y-6">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                  {/* Large Preview */}
                  {selectedFile.resourceType === 'image' ? <img src={selectedFile.url} className="w-full h-full object-contain" /> :
                    <div className="text-center p-4">
                      <FiFileText className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 uppercase">{selectedFile.format} File</p>
                    </div>
                  }
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                    <p className="text-sm text-gray-900 dark:text-white break-all">{selectedFile.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Size</label>
                    <p className="text-sm text-gray-900 dark:text-white">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  {selectedFile.width && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Dimensions</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedFile.width} x {selectedFile.height}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Format</label>
                    <p className="text-sm text-gray-900 dark:text-white uppercase">{selectedFile.format}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Public ID</label>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 p-2 rounded break-all select-all">
                      {selectedFile.publicId}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">URL</label>
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 break-all cursor-pointer hover:underline" onClick={() => window.open(selectedFile.url)}>
                      {selectedFile.url}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setNewName(selectedFile.name); setShowRenameModal(true); }}>
                    <FiEdit3 className="mr-2" /> Rename
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setShowDeleteModal(true)}>
                    <FiTrash2 className="mr-2" /> Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* -- Modals -- */}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Media"
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">Uploading to: <span className="font-semibold">{currentPath}</span></p>
          <CloudinaryUpload
            folder={currentPath === 'hitam_ai' ? 'hitam_ai/general' : currentPath}
            onUpload={handleUploadSuccess}
            showPreview
          />
        </div>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        title="Create New Folder"
        size="sm"
      >
        <div>
          <Input
            label="Folder Name"
            placeholder="e.g. events_2024"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="mb-6"
          />
          <div className="mb-4 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            Creating in: <span className="font-mono font-semibold">{creatingInPath || currentPath}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowCreateFolderModal(false); setCreatingInPath(null); }}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </div>
        </div>
      </Modal>

      {/* Rename File Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title="Rename File"
        size="sm"
      >
        <div>
          <Input
            label="New Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mb-6"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </div>
        </div>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        isOpen={showRenameFolderModal}
        onClose={() => setShowRenameFolderModal(false)}
        title="Rename Folder"
        size="sm"
      >
        <div>
          <Input
            label="New Folder Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mb-6"
          />
          <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded mb-4">
            Warning: Renaming a folder involves renaming all assets inside it. This might take a few moments.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowRenameFolderModal(false)}>Cancel</Button>
            <Button onClick={handleRenameFolder}>Rename Folder</Button>
          </div>
        </div>
      </Modal>

      {/* Delete File Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete <b>{selectedFile?.name}</b>?<br />
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Folder Confirmation Modal */}
      <Modal
        isOpen={showDeleteFolderModal}
        onClose={() => setShowDeleteFolderModal(false)}
        title="Delete Folder"
        size="sm"
      >
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete folder <b>{selectedFolder?.name}</b>?<br />
            <span className="text-red-500 text-sm font-semibold">ALL CONTENTS inside will be deleted permanently!</span>
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDeleteFolderModal(false)}>Cancel</Button>
            <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={handleDeleteFolder}>Delete All & Remove</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MediaManagement;
