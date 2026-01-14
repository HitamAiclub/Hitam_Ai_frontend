/**
 * CLOUDINARY UTILITIES FOR HITAM_AI FOLDER STRUCTURE
 * 
 * Directory Structure:
 * hitam_ai/
 * ├── upcoming-activities/
 * ├── events/
 * ├── committee-members/
 * ├── certificate-templates/
 * ├── session-reports/
 * ├── club-join/
 * ├── admin-uploads/
 * ├── user-profiles/
 * └── general/
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fetch all files from Cloudinary (from hitam_ai/ directory and subfolders)
export const getAllCloudinaryFiles = async () => {
  try {
    const response = await fetch(`${API_URL}/api/cloudinary/all-files`);
    if (!response.ok) {
      throw new Error('Failed to fetch all files');
    }
    return await response.json();
  } catch (error) {
    console.error('Cloudinary fetch all files error:', error);
    throw new Error('Failed to fetch all files from Cloudinary');
  }
};

// Fetch all images from Cloudinary (for backward compatibility)
export const getAllCloudinaryImages = async () => {
  try {
    const response = await fetch(`${API_URL}/api/cloudinary/all-images`);
    if (!response.ok) {
      throw new Error('Failed to fetch all images');
    }
    return await response.json();
  } catch (error) {
    console.error('Cloudinary fetch all images error:', error);
    throw new Error('Failed to fetch all images from Cloudinary');
  }
};

/**
 * Upload file to Cloudinary under hitam_ai/ folder structure
 * Supports all file types: images, PDFs, Excel, CSV, DOCX, etc.
 * Uses direct frontend upload with automatic preset detection
 * 
 * @param {File} file - The file to upload
 * @param {string} folder - Target folder path (e.g., 'hitam_ai/events', 'hitam_ai/upcoming-activities')
 * @returns {Promise<Object>} Upload result with URL, publicId, and file metadata
 */
export const uploadToCloudinary = async (file, folder = 'hitam_ai') => {
  try {
    if (!file) {
      throw new Error('File is required');
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwva5ae36';
    let uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Hitam_ai';

    if (!cloudName) {
      throw new Error('Cloudinary cloud name is missing. Check your .env file.');
    }

    // Ensure folder starts with 'hitam_ai/' if not already
    const targetFolder = folder.startsWith('hitam_ai/') || folder === 'hitam_ai' ? folder : `hitam_ai/${folder}`;


    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', targetFolder);

    // Attempt upload with specified preset
    let response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    // If preset not found, try common default presets
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Try fallback presets
      if (errorData.error?.message?.includes('not found') || response.status === 400) {
        console.warn(`Preset '${uploadPreset}' not found. Trying alternatives...`);

        const fallbackPresets = ['ml_default', 'default', 'cloud_default'];
        let success = false;

        for (const preset of fallbackPresets) {
          const fallbackForm = new FormData();
          fallbackForm.append('file', file);
          fallbackForm.append('upload_preset', preset);
          fallbackForm.append('folder', targetFolder);

          const fallbackResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            {
              method: 'POST',
              body: fallbackForm,
            }
          );

          if (fallbackResponse.ok) {
            response = fallbackResponse;
            success = true;
            console.log(`Successfully uploaded using preset: ${preset}`);
            break;
          }
        }

        if (!success) {
          console.error('All upload attempts failed. Error:', errorData);
          throw new Error(`Upload failed: ${errorData.error?.message || 'Upload preset not found. Please configure an unsigned upload preset in Cloudinary dashboard.'}`);
        }
      } else {
        console.error('Cloudinary response error:', errorData);
        throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();
    const fileType = data.type === 'image' ? 'image' : data.resource_type || 'document';

    return {
      url: data.secure_url,
      publicId: data.public_id,
      folder: targetFolder,
      originalName: file.name,
      size: file.size,
      format: data.format,
      type: fileType,
      resourceType: data.resource_type,
      uploadedAt: new Date().toISOString(),
      width: data.width,
      height: data.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const response = await fetch(`${API_URL}/api/cloudinary/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId, resourceType }),
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

/**
 * Get files from a specific folder path
 * @param {string} folder - Folder path (e.g., 'hitam_ai/events')
 */
export const getFilesFromFolder = async (folder = 'hitam_ai') => {
  try {
    // Ensure folder starts with 'hitam_ai/'
    const targetFolder = folder.startsWith('hitam_ai/') || folder === 'hitam_ai' ? folder : `hitam_ai/${folder}`;

    const response = await fetch(`${API_URL}/api/cloudinary/files?folder=${targetFolder}`);

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary fetch error:', error);
    throw new Error('Failed to fetch files from Cloudinary');
  }
};

/**
 * Create a new folder in Cloudinary (creates via .keep file)
 * @param {string} folderPath - Parent folder path (e.g., 'hitam_ai/events')
 * @param {string} folderName - Name of the new folder (e.g., 'AI-Workshop')
 */
export const createFolder = async (folderPath, folderName) => {
  try {
    // Ensure folderPath starts with 'hitam_ai/'
    const targetPath = folderPath.startsWith('hitam_ai/') || folderPath === 'hitam_ai' ? folderPath : `hitam_ai/${folderPath}`;

    const response = await fetch(`${API_URL}/api/cloudinary/create-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderPath: targetPath,
        folderName
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    return await response.json();
  } catch (error) {
    console.error('Create folder error:', error);
    throw error;
  }
};

/**
 * Get all available folders under hitam_ai/
 */
export const getAllFolders = async () => {
  try {
    const response = await fetch(`${API_URL}/api/cloudinary/folders`);

    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    return await response.json();
  } catch (error) {
    console.error('Cloudinary fetch folders error:', error);
    throw new Error('Failed to fetch folders from Cloudinary');
  }
};

// ============================================
// SPECIALIZED UPLOAD FUNCTIONS FOR PAGES
// ============================================

/**
 * Upload file to Upcoming Activities folder
 */
export const uploadUpcomingActivityFile = async (file, activityName = '') => {
  const folder = activityName
    ? `hitam_ai/upcoming-activities/${activityName}`
    : 'hitam_ai/upcoming-activities';
  return await uploadToCloudinary(file, folder);
};

/**
 * Upload file to Events folder
 */
export const uploadEventFile = async (file, eventName = '') => {
  const folder = eventName
    ? `hitam_ai/events/${eventName}`
    : 'hitam_ai/events';
  return await uploadToCloudinary(file, folder);
};

/**
 * Upload file to Committee Members folder
 */
export const uploadCommitteeMemberFile = async (file, memberName = '') => {
  const folder = memberName
    ? `hitam_ai/committee-members/${memberName}`
    : 'hitam_ai/committee-members';
  return await uploadToCloudinary(file, folder);
};

/**
 * Upload file to Certificate Templates folder
 */
export const uploadCertificateTemplate = async (file, templateName = '') => {
  const folder = templateName
    ? `hitam_ai/certificate-templates/${templateName}`
    : 'hitam_ai/certificate-templates';
  return await uploadToCloudinary(file, folder);
};

/**
 * Upload file to Session Reports folder
 */
export const uploadSessionReport = async (file, sessionName = '') => {
  const folder = sessionName
    ? `hitam_ai/session-reports/${sessionName}`
    : 'hitam_ai/session-reports';
  return await uploadToCloudinary(file, folder);
};

/**
 * Upload file to Others folder
 */
export const uploadToOthersFolder = async (file, subfolder = '') => {
  const folder = subfolder
    ? `hitam_ai/others/${subfolder}`
    : 'hitam_ai/others';
  return await uploadToCloudinary(file, folder);
};

// ============================================
// DEPRECATED FUNCTIONS (Kept for backward compatibility)
// ============================================

export const uploadToSubfolder = async (file, subfolder) => {
  // Legacy: redirect to hitam_ai/ structure
  const folder = `hitam_ai/${subfolder}`;
  return await uploadToCloudinary(file, folder);
};

export const uploadEventImage = async (file) => {
  return await uploadEventFile(file);
};

export const uploadUpcomingEventImage = async (file) => {
  return await uploadUpcomingActivityFile(file);
};

export const uploadFormFile = async (file, formTitle) => {
  // Legacy: form files now go to upcoming-activities
  return await uploadUpcomingActivityFile(file, formTitle);
};

export const uploadCommitteeMemberImage = async (file) => {
  return await uploadCommitteeMemberFile(file);
};

export const uploadCommunityMemberImage = async (file) => {
  // Legacy: redirect to committee-members
  return await uploadCommitteeMemberFile(file);
};

export const uploadGeneralImage = async (file) => {
  return await uploadToOthersFolder(file);
};

export const uploadFormBuilderImage = async (file) => {
  return await uploadToOthersFolder(file);
};

export const uploadFormFiles = async (files, formTitle) => {
  // Legacy: upload multiple files
  const uploadPromises = files.map(file =>
    uploadUpcomingActivityFile(file, formTitle)
  );
  return await Promise.all(uploadPromises);
};
