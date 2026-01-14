import { useCallback, useState } from 'react';
import { uploadFormFile, uploadFormFiles } from '../utils/formUpload';

/**
 * Hook for uploading files in activity registrations and payments
 * Handles organized folder structure for activity uploads
 * 
 * @param {Object} options - Configuration
 * @param {string} options.activityTitle - Title of the activity
 * @param {string} options.registrationId - Optional registration ID
 * @param {string} options.paymentId - Optional payment ID for payment proofs
 * @returns {Object} Upload handlers and state
 */
export const useFormUpload = (options = {}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadSingle = useCallback(
    async (file) => {
      try {
        setUploading(true);
        setError(null);

        const result = await uploadFormFile(file, options);

        setUploadedFiles(prev => [...prev, result]);
        return result;
      } catch (err) {
        const errorMessage = err.message || 'Upload failed';
        setError(errorMessage);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [options]
  );

  const uploadMultiple = useCallback(
    async (files) => {
      try {
        setUploading(true);
        setError(null);

        const results = await uploadFormFiles(files, options);

        setUploadedFiles(prev => [...prev, ...results]);
        return results;
      } catch (err) {
        const errorMessage = err.message || 'Upload failed';
        setError(errorMessage);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [options]
  );

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
    setError(null);
  }, []);

  const removeUploadedFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    uploadSingle,
    uploadMultiple,
    uploading,
    error,
    uploadedFiles,
    clearUploadedFiles,
    removeUploadedFile,
  };
};

export default useFormUpload;
