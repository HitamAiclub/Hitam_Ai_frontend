import { uploadToCloudinary } from './cloudinary';

/**
 * Generate folder path for activity uploads
 * Supports nested structure:
 * upcoming-activities/activity-title/images/
 * upcoming-activities/activity-title/files/
 * upcoming-activities/activity-title/payments/payment-id/proofs/
 * upcoming-activities/activity-title/registrations/registration-id/uploads/
 * 
 * @param {string} activityTitle - Title of the activity
 * @param {string} fileType - Type of file ('images', 'files', 'proofs')
 * @param {string} registrationId - Optional registration ID for registration uploads
 * @param {string} paymentId - Optional payment ID for payment proof uploads
 * @returns {string} Folder path
 */
export const generateFormFolderPath = (
  activityTitle = 'general',
  fileType = 'files',
  registrationId = null,
  paymentId = null
) => {
  // Sanitize title to create valid folder name
  const sanitizedTitle = activityTitle
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Payment proof upload path
  if (paymentId) {
    // New structure: registrations/payment_proofs
    return `hitam_ai/upcoming-activities/${sanitizedTitle}/registrations/payment_proofs`;
  }

  // Registration upload path
  if (registrationId) {
    // New structure: registrations/{registrationId}
    return `hitam_ai/upcoming-activities/${sanitizedTitle}/registrations/${registrationId}`;
  }

  // Default fallback (though usually covered by above)
  return `hitam_ai/upcoming-activities/${sanitizedTitle}/registrations/user_uploads`;
};

/**
 * Upload file for activity registrations and payments
 * Automatically organizes files in nested structure
 * 
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @param {string} options.activityTitle - Title of activity
 * @param {string} options.registrationId - Optional registration ID
 * @param {string} options.paymentId - Optional payment ID for payment proofs
 * @param {string} options.fileType - Type of file (auto-detect if not specified)
 * @returns {Promise<Object>} Upload result
 */
export const uploadFormFile = async (file, options = {}) => {
  try {
    const {
      activityTitle = 'general',
      registrationId = null,
      paymentId = null,
      fileType = null,
    } = options;

    // Auto-detect file type if not specified
    let detectedFileType = fileType;
    if (!detectedFileType) {
      if (file.type.startsWith('image/')) {
        detectedFileType = 'images';
      } else if (file.type === 'application/pdf') {
        detectedFileType = paymentId ? 'proofs' : 'documents';
      } else if (
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.csv')
      ) {
        detectedFileType = 'spreadsheets';
      } else if (
        file.type.includes('word') ||
        file.type.includes('document') ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx')
      ) {
        detectedFileType = 'documents';
      } else {
        detectedFileType = 'files';
      }
    }

    // Generate folder path
    const folderPath = generateFormFolderPath(
      activityTitle,
      detectedFileType,
      registrationId,
      paymentId
    );

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file, folderPath);

    return {
      ...result,
      folderPath,
      fileType: detectedFileType,
    };
  } catch (error) {
    console.error('Form file upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files for form
 * 
 * @param {File[]} files - Array of files to upload
 * @param {Object} options - Upload options (same as uploadFormFile)
 * @returns {Promise<Object[]>} Array of upload results
 */
export const uploadFormFiles = async (files, options = {}) => {
  try {
    const results = await Promise.all(
      files.map(file => uploadFormFile(file, options))
    );
    return results;
  } catch (error) {
    console.error('Multiple form files upload error:', error);
    throw error;
  }
};

export default {
  generateFormFolderPath,
  uploadFormFile,
  uploadFormFiles,
};
