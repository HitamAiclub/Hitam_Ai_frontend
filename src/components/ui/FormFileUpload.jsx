import React, { useState } from 'react';
import { useFormUpload } from '../../hooks/useFormUpload';
import { FiFile, FiImage, FiUpload, FiTrash2, FiX } from 'react-icons/fi';

/**
 * FormFileUpload Component
 * Handles file uploads for activity registrations with organized folder structure
 * 
 * @param {Object} props
 * @param {string} props.activityTitle - Activity title
 * @param {string} props.registrationId - Optional registration ID
 * @param {string} props.paymentId - Optional payment ID for payment proofs
 * @param {Function} props.onFilesUpload - Callback when files are uploaded
 * @param {string} props.acceptedTypes - Accepted file types
 * @param {boolean} props.multiple - Allow multiple file selection
 * @param {string} props.label - Label for the upload area
 */
function FormFileUpload({
  activityTitle = 'general',
  registrationId = null,
  paymentId = null,
  onFilesUpload,
  acceptedTypes = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv',
  multiple = true,
  label = 'Upload Files',
  maxFiles = 10,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const {
    uploadSingle,
    uploadMultiple,
    uploading,
    error,
    uploadedFiles,
    removeUploadedFile,
  } = useFormUpload({
    activityTitle,
    registrationId,
    paymentId,
  });

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return <FiImage className="w-5 h-5 text-blue-500" />;
    return <FiFile className="w-5 h-5 text-gray-500" />;
  };

  const getFileTypeLabel = (type) => {
    if (type.startsWith('image/')) return 'Image';
    if (type === 'application/pdf') return 'PDF';
    if (
      type === 'application/vnd.ms-excel' ||
      type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'Excel';
    }
    if (type === 'text/csv') return 'CSV';
    if (type.includes('word') || type.includes('document')) return 'Document';
    if (type.includes('sheet') || type.includes('excel')) return 'Spreadsheet';
    return 'File';
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (!multiple && files.length > 1) {
      alert('Please select only one file');
      return;
    }

    if (selectedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      let results;
      if (selectedFiles.length === 1) {
        const result = await uploadSingle(selectedFiles[0]);
        results = [result];
      } else {
        results = await uploadMultiple(selectedFiles);
      }

      if (onFilesUpload) {
        onFilesUpload(results);
      }

      setSelectedFiles([]);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800/50'
        }`}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept={acceptedTypes}
          multiple={multiple}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center">
          <FiUpload className="w-12 h-12 text-neutral-400 mb-2" />
          <p className="font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            or drag and drop files here
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
            Maximum {maxFiles} files, {Math.round(50 / maxFiles)}MB each
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected ({selectedFiles.length}) - Ready to upload
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-neutral-100 dark:bg-neutral-700 rounded"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(file)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {getFileTypeLabel(file.type)} • {(file.size / 1024).toFixed(1)}KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeSelectedFile(index)}
                  className="p-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
                  disabled={uploading}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            Uploaded ({uploadedFiles.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/10 rounded border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getFileIcon({ type: file.resourceType })}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {file.folderPath}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeUploadedFile(index)}
                  className="p-1 text-neutral-400 hover:text-error-500 rounded"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded">
          <p className="text-error-600 dark:text-error-400 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <FiUpload className="w-4 h-4" />
          {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
        </button>
      )}
    </div>
  );
}

export default FormFileUpload;
