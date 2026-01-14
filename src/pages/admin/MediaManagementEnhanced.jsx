import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFile, FiTrash2, FiPlus, FiFolder, FiSearch, FiGrid, FiList, FiRefreshCw, FiDownload, FiFileText, FiImage, FiMusic, FiVideo, FiChevronRight } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import { uploadToCloudinary, getAllCloudinaryFiles } from "../../utils/cloudinary";

const MediaManagement = () => {
  const [files, setFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [currentPath, setCurrentPath] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [pathBreadcrumbs, setPathBreadcrumbs] = useState(['home']);

  // Real Cloudinary folder mapping
  const realFolders = {
    'home': {
      name: 'All Media',
      icon: FiFile,
      color: 'bg-gray-500',
      path: 'home'
    },
    'home/upcoming-activities': {
      name: 'Upcoming Activities',
      icon: FiFolder,
      color: 'bg-blue-500',
      path: 'home/upcoming-activities'
    },
    'home/events': {
      name: 'Events',
      icon: FiFolder,
      color: 'bg-green-500',
      path: 'home/events'
    },
    'home/workshops': {
      name: 'Workshops',
      icon: FiFolder,
      color: 'bg-purple-500',
      path: 'home/workshops'
    },
    'home/certificate-templates': {
      name: 'Certificate Templates',
      icon: FiFolder,
      color: 'bg-orange-500',
      path: 'home/certificate-templates'
    },
    'home/section-reports': {
      name: 'Section Reports',
      icon: FiFolder,
      color: 'bg-pink-500',
      path: 'home/section-reports'
    },
    'home/others': {
      name: 'Others',
      icon: FiFolder,
      color: 'bg-indigo-500',
      path: 'home/others'
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const allFilesList = await getAllCloudinaryFiles();
      setAllFiles(allFilesList);
      
      // Filter files based on current path
      const visibleAssets = allFilesList.filter(asset => {
        const assetFolder = asset.actualFolder || asset.folder || 'home';
        return assetFolder === currentPath || assetFolder.startsWith(currentPath + '/');
      });

      // Separate files and folders
      const filesInPath = visibleAssets.filter(f => f.actualFolder === currentPath);
      
      // Get unique immediate subfolders
      const subfolders = new Set();
      visibleAssets.forEach(asset => {
        const assetFolder = asset.actualFolder || asset.folder || 'home';
        if (assetFolder.startsWith(currentPath + '/')) {
          const remaining = assetFolder.substring(currentPath.length + 1);
          const nextLevel = remaining.split('/')[0];
          if (nextLevel) subfolders.add(nextLevel);
        }
      });

      setFolders(Array.from(subfolders).map(f => ({
        name: f,
        path: `${currentPath}/${f}`
      })));

      setFiles(filesInPath);
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigatePath = (newPath) => {
    setCurrentPath(newPath);
    setPathBreadcrumbs(newPath.split('/'));
  };

  const handleFolderClick = (folderPath) => {
    handleNavigatePath(folderPath);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const allFilesList = await getAllCloudinaryFiles();
      setAllFiles(allFilesList);
      await loadFiles();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpload = async (uploadData) => {
    if (!uploadData) return;
    setUploading(true);
    try {
      // Refresh to show newly uploaded file
      const allFilesList = await getAllCloudinaryFiles();
      setAllFiles(allFilesList);
      await loadFiles();
      setShowUploadModal(false);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId, publicId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Use the delete endpoint from cloudinary.js
      const response = await fetch('/api/cloudinary/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });

      if (!response.ok) throw new Error('Delete failed');

      const allFilesList = await getAllCloudinaryFiles();
      setAllFiles(allFilesList);
      await loadFiles();
      
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    try {
      const response = await fetch('/api/cloudinary/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: currentPath,
          folderName: newFolderName
        })
      });

      if (!response.ok) throw new Error('Folder creation failed');

      setNewFolderName('');
      setShowCreateFolderModal(false);
      
      // Refresh to show new folder
      const allFilesList = await getAllCloudinaryFiles();
      setAllFiles(allFilesList);
      await loadFiles();
      
      alert(`Folder '${newFolderName}' created successfully!`);
    } catch (error) {
      console.error('Create folder failed:', error);
      alert('Failed to create folder. Please try again.');
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'image') return <FiImage className="w-5 h-5 text-blue-400" />;
    if (file.type === 'pdf') return <FiFileText className="w-5 h-5 text-red-400" />;
    if (file.type === 'spreadsheet') return <FiFileText className="w-5 h-5 text-green-400" />;
    if (file.type === 'document') return <FiFileText className="w-5 h-5 text-purple-400" />;
    if (file.type === 'video') return <FiVideo className="w-5 h-5 text-orange-400" />;
    if (file.type === 'audio') return <FiMusic className="w-5 h-5 text-pink-400" />;
    return <FiFile className="w-5 h-5 text-gray-400" />;
  };

  const filterFiles = () => {
    let filtered = files;

    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => file.type === fileTypeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading media...</p>
        </div>
      </div>
    );
  }

  const filteredFiles = filterFiles();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Media Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all files and folders in the home directory
          </p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          {pathBreadcrumbs.map((part, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <FiChevronRight className="text-gray-400" />}
              <button
                onClick={() => handleNavigatePath(pathBreadcrumbs.slice(0, idx + 1).join('/'))}
                className={`${
                  idx === pathBreadcrumbs.length - 1
                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              <FiGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
            >
              <FiList className="w-4 h-4" />
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Create Folder Button */}
          <Button
            variant="outline"
            onClick={() => setShowCreateFolderModal(true)}
            className="whitespace-nowrap"
          >
            <FiFolder className="w-4 h-4 mr-2" />
            New Folder
          </Button>

          {/* Upload Button */}
          <Button
            onClick={() => setShowUploadModal(true)}
            className="whitespace-nowrap"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>

        {/* Quick Navigation Tabs (Top-level folders) */}
        {currentPath === 'home' && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Navigate to:
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.values(realFolders)
                .filter(f => f.path !== 'home')
                .map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => handleFolderClick(folder.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${folder.color}`}></div>
                    <folder.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* File Type Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'image', 'pdf', 'document', 'spreadsheet', 'video', 'audio'].map((type) => (
            <button
              key={type}
              onClick={() => setFileTypeFilter(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                fileTypeFilter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Folders Grid (show before files) */}
        {folders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Folders
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {folders.map((folder) => (
                <motion.button
                  key={folder.path}
                  onClick={() => handleFolderClick(folder.path)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <FiFolder className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        📁 {folder.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click to open
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Files Grid/List */}
        {filteredFiles.length === 0 && folders.length === 0 ? (
          <div className="text-center py-12">
            <FiFile className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No files or folders found</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No files match your filter</p>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Files
            </h3>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredFiles.map((file) => (
                <motion.div key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {viewMode === 'grid' ? (
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="p-4">
                        {file.type === 'image' && (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                          />
                        )}
                        <div className="flex items-start gap-3">
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatFileSize(file.size)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(file.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <a
                            href={file.url}
                            download
                            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition flex items-center justify-center gap-1"
                          >
                            <FiDownload className="w-3 h-3" />
                            Download
                          </a>
                          <button
                            onClick={() => handleDelete(file.id, file.publicId)}
                            className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {file.type === 'image' ? (
                            <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                              {getFileIcon(file)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{formatDate(file.createdAt)}</span>
                            <span>{file.type}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={file.url}
                            download
                            title="Download"
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          >
                            <FiDownload className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(file.id, file.publicId)}
                            title="Delete"
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Upload File to ${currentPath}`}
      >
        <FileUpload
          onUpload={handleUpload}
          folder={currentPath}
          buttonLabel="Upload"
          acceptedTypes="*"
        />
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        title={`Create Folder in ${currentPath}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-200">
            Creating folder: <span className="font-mono font-semibold">{currentPath}/{newFolderName}</span>
          </div>
          <Input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreateFolder}
              className="flex-1"
            >
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateFolderModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MediaManagement;
