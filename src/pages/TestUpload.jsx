import React, { useState } from 'react';
import FileUpload from '@/components/ui/FileUpload';

export default function TestUpload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = (uploadData) => {
    console.log('✅ File uploaded:', uploadData);
    
    setUploadedFiles([...uploadedFiles, uploadData]);
    setUploadStatus(`✅ ${uploadData.originalName} uploaded successfully!`);
    
    // Clear message after 3 seconds
    setTimeout(() => setUploadStatus(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📤 Upload Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Test the multi-file upload system
        </p>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Any File
          </h2>
          
          <FileUpload
            onUpload={handleFileUpload}
            folder="test"
            buttonLabel="Upload File"
            acceptedTypes="*"
          />

          {uploadStatus && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded">
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📁 Uploaded Files ({uploadedFiles.length})
            </h2>

            <div className="space-y-3">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {file.originalName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB • {file.type}
                    </p>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
              <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                Debug Info
              </h3>
              <pre className="text-xs text-blue-800 dark:text-blue-300 overflow-auto max-h-64">
                {JSON.stringify(uploadedFiles[uploadedFiles.length - 1], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
