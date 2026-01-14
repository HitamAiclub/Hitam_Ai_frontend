import React, { useState } from "react";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { usePageBasedUpload } from "../../hooks/usePageBasedUpload";
import { FiFile, FiImage, FiUpload } from "react-icons/fi";

const FileUpload = ({ 
  onUpload, 
  folder = "auto", // "auto" to use current page name, or specify custom folder
  buttonLabel = "Upload File",
  acceptedTypes = "*", // "*" for all files, or specific types like "image/*", ".pdf,.doc"
  showPreview = false 
}) => {
  const { upload: pageBasedUpload, getPageFolderName } = usePageBasedUpload();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return <FiImage className="w-8 h-8 text-blue-500" />;
    return <FiFile className="w-8 h-8 text-gray-500" />;
  };

  const getFileTypeLabel = (type) => {
    if (type.startsWith('image/')) return 'Image';
    if (type === 'application/pdf') return 'PDF';
    if (type.includes('word') || type.includes('document')) return 'Document';
    if (type.includes('sheet') || type.includes('excel')) return 'Spreadsheet';
    return 'File';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setProgress(0);

    // Create preview only for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      let uploadData;
      
      // Use page-based upload if folder is "auto"
      if (folder === "auto") {
        uploadData = await pageBasedUpload(file);
      } else {
        uploadData = await uploadToCloudinary(file, folder);
      }
      
      clearInterval(progressInterval);
      setProgress(100);

      if (onUpload) {
        onUpload(uploadData);
      }

      // Reset form
      setFile(null);
      setPreview(null);
      setProgress(0);
    } catch (err) {
      const errorMessage = err.message || "Upload error. Please try again.";
      setError(errorMessage);
      console.error('Upload error details:', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select File
        </label>
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          disabled={uploading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {/* File Preview */}
      {file && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                getFileIcon(file)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {showPreview && preview && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </label>
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && progress > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <FiUpload className="w-4 h-4" />
        {uploading ? `Uploading... ${progress}%` : buttonLabel}
      </button>
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default FileUpload;
