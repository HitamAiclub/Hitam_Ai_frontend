import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { uploadToCloudinary } from '../utils/cloudinary';

/**
 * Custom hook for uploading files to page-specific Cloudinary folders
 * Automatically determines folder based on current page name
 * 
 * Usage:
 * const { upload, uploading, error } = usePageBasedUpload();
 * const result = await upload(file);
 */
export const usePageBasedUpload = () => {
  const location = useLocation();

  // Map page routes to folder names
  const getPageFolderName = useCallback(() => {
    const path = location.pathname.toLowerCase();

    if (path.includes('events')) return 'events';
    if (path.includes('members') || path.includes('committee')) return 'committee-members';
    if (path.includes('activities') || path.includes('upcoming')) return 'upcoming-activities';
    if (path.includes('certificates')) return 'certificate-templates';
    if (path.includes('reports')) return 'session-reports';
    if (path.includes('club') || path.includes('join')) return 'club-join';
    if (path.includes('admin')) return 'admin-uploads';
    if (path.includes('profile') || path.includes('user')) return 'user-profiles';

    return 'general'; // Default folder
  }, [location.pathname]);

  const upload = useCallback(
    async (file) => {
      try {
        const pageFolder = getPageFolderName();
        const folderPath = `hitam-ai/${pageFolder}`;
        const result = await uploadToCloudinary(file, folderPath);
        return result;
      } catch (error) {
        console.error('Page-based upload error:', error);
        throw error;
      }
    },
    [getPageFolderName]
  );

  return {
    upload,
    getPageFolderName,
  };
};

export default usePageBasedUpload;
