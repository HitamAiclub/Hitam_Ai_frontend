import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import FormFileUpload from '../components/ui/FormFileUpload';
import Modal from '../components/ui/Modal';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const FIELD_TYPES = {
  text: 'text',
  textarea: 'textarea',
  email: 'email',
  number: 'number',
  phone: 'tel',
  date: 'date',
  select: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  file: 'file',
};

function PublicForm() {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const formDoc = await getDoc(doc(db, 'forms', formId));
      if (formDoc.exists()) {
        const formData = { id: formDoc.id, ...formDoc.data() };
        setForm(formData);
        
        // Initialize form values using field labels as keys
        const initialValues = {};
        
        // Check if form has sections (new format) or just fields (old format)
        if (formData.sections && formData.sections.length > 0) {
          formData.sections.forEach(section => {
            section.fields?.forEach(field => {
              const fieldKey = field.label;
              if (field.type === 'checkbox') {
                initialValues[fieldKey] = [];
              } else {
                initialValues[fieldKey] = '';
              }
            });
          });
        } else if (formData.fields) {
          // Fallback for old format
          formData.fields.forEach(field => {
            const fieldKey = field.label;
            if (field.type === 'checkbox') {
              initialValues[fieldKey] = [];
            } else {
              initialValues[fieldKey] = '';
            }
          });
        }
        
        setFormValues(initialValues);
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldLabel, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldLabel]: value,
    }));
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [fieldLabel]: '',
    }));
    
    // Check if this field has conditional mapping that triggers submit
    setTimeout(() => {
      const currentSection = visibleSections[currentSectionIndex];
      const field = currentSection?.fields?.find(f => f.label === fieldLabel);
      
      if (field && field.conditionalMapping) {
        const selectedOption = value;
        const mappedSections = field.conditionalMapping[selectedOption] || [];
        
        // If submit form is mapped to this option
        if (mappedSections.includes('__submit__')) {
          handleSubmit();
        }
      }
    }, 50);
  };

  const handleCheckboxChange = (fieldLabel, optionLabel, checked) => {
    const newValues = checked
      ? [...(formValues[fieldLabel] || []), optionLabel]
      : (formValues[fieldLabel] || []).filter(v => v !== optionLabel);
    
    setFormValues(prev => ({
      ...prev,
      [fieldLabel]: newValues,
    }));
    setErrors(prev => ({
      ...prev,
      [fieldLabel]: '',
    }));
    
    // Check if this field has conditional mapping that triggers submit
    setTimeout(() => {
      const currentSection = visibleSections[currentSectionIndex];
      const field = currentSection?.fields?.find(f => f.label === fieldLabel);
      
      if (field && field.conditionalMapping) {
        // For checkboxes, check if any selected option has submit mapping
        newValues.forEach(selectedOption => {
          const mappedSections = field.conditionalMapping[selectedOption] || [];
          if (mappedSections.includes('__submit__')) {
            handleSubmit();
          }
        });
      }
    }, 50);
  };

  const handleFilesUpload = (fieldLabel, files) => {
    // Use field label as the key
    setUploadedFiles(prev => ({
      ...prev,
      [fieldLabel]: files,
    }));
  };

  const handleFieldBlur = (fieldLabel) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldLabel]: true,
    }));
    
    // Validate field on blur
    const currentSection = visibleSections[currentSectionIndex];
    const field = currentSection?.fields?.find(f => f.label === fieldLabel);
    
    if (field) {
      const value = formValues[fieldLabel];
      let error = '';
      
      // Check required fields
      if (field.required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())) {
          error = `${field.label} is required`;
        }
      }
      
      // Validate email format and domain
      if (field.type === 'email' && value && typeof value === 'string') {
        const emailValidation = validateEmail(value, field.emailDomain);
        if (!emailValidation.valid) {
          error = emailValidation.message;
        }
      }
      
      // Validate phone format
      if (field.type === 'phone' && value && typeof value === 'string') {
        const phoneValidation = validatePhone(value, field.phonePattern);
        if (!phoneValidation.valid) {
          error = phoneValidation.message;
        }
      }
      
      setErrors(prev => ({
        ...prev,
        [fieldLabel]: error,
      }));
    }
  };

  // Validate email format
  const validateEmail = (email, emailDomain) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }
    
    if (emailDomain === 'hitam') {
      if (!email.toLowerCase().endsWith('@hitam.org')) {
        return { valid: false, message: 'Only @hitam.org emails are allowed' };
      }
    }
    
    return { valid: true, message: '' };
  };

  // Validate phone format
  const validatePhone = (phone, phonePattern) => {
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (phonePattern === 'india') {
      if (digitsOnly.length !== 10) {
        return { valid: false, message: 'Indian phone number must be exactly 10 digits' };
      }
    } else if (phonePattern === 'international') {
      if (!phone.startsWith('+')) {
        return { valid: false, message: 'International format must start with +' };
      }
      if (digitsOnly.length < 10) {
        return { valid: false, message: 'International phone must have at least 10 digits' };
      }
    } else {
      // 'any' format
      if (digitsOnly.length < 10) {
        return { valid: false, message: 'Phone number must have at least 10 digits' };
      }
    }
    
    return { valid: true, message: '' };
  };

  // Check if section should be shown based on conditional logic
  const shouldShowSection = (section) => {
    if (!section.conditional?.enabled) return true;

    const { fieldId, condition, value } = section.conditional;
    const fieldValue = formValues[fieldId];

    if (!fieldValue) return false;

    switch (condition) {
      case 'equals':
        return String(fieldValue) === String(value);
      case 'not_equals':
        return String(fieldValue) !== String(value);
      case 'contains':
        return String(fieldValue).includes(value);
      default:
        return true;
    }
  };

  // Get visible sections
  const visibleSections = (form?.sections || []).filter(shouldShowSection);
  const hasMultipleSections = visibleSections.length > 1;

  // Validate current section
  const validateCurrentSection = () => {
    if (!hasMultipleSections) return true;
    
    const section = visibleSections[currentSectionIndex];
    const newErrors = {};

    section?.fields?.forEach(field => {
      const value = formValues[field.label];
      
      // Check required fields
      if (field.required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())) {
          newErrors[field.label] = `${field.label} is required`;
          return;
        }
      }

      // Validate email format and domain
      if (field.type === 'email' && value && typeof value === 'string') {
        const emailValidation = validateEmail(value, field.emailDomain);
        if (!emailValidation.valid) {
          newErrors[field.label] = emailValidation.message;
        }
      }

      // Validate phone format
      if (field.type === 'phone' && value && typeof value === 'string') {
        const phoneValidation = validatePhone(value, field.phonePattern);
        if (!phoneValidation.valid) {
          newErrors[field.label] = phoneValidation.message;
        }
      }
    });

    setErrors(newErrors);
    
    // If there are errors, show modal with all error messages
    if (Object.keys(newErrors).length > 0) {
      const errorMessages = Object.entries(newErrors).map(([fieldLabel, errorMsg]) => ({
        field: fieldLabel,
        message: errorMsg
      }));
      setValidationErrors(errorMessages);
      setShowErrorModal(true);
      return false;
    }
    
    return true;
  };

  // Check if current section has submit navigation
  const shouldSubmitAfterSection = () => {
    const section = visibleSections[currentSectionIndex];
    return section?.navigation?.type === 'submit';
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      // Check if section is set to submit
      if (shouldSubmitAfterSection()) {
        handleSubmit();
      } else if (currentSectionIndex < visibleSections.length - 1) {
        setCurrentSectionIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    
    if (!validateCurrentSection()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare submission data - store directly with field labels as keys
      const submissionData = {
        formId,
        formTitle: form.title,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        data: formValues,
        files: uploadedFiles,
      };

      // Save to Firebase
      await addDoc(collection(db, 'formSubmissions'), submissionData);

      setSubmitted(true);
      setTimeout(() => {
        setFormValues({});
        setUploadedFiles({});
        setCurrentSectionIndex(0);
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="text-4xl text-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            The form you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800 py-12">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Your form has been submitted successfully.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Determine which sections/fields to display
  const displaySections = form?.sections && form.sections.length > 0 ? visibleSections : null;
  const displayFields = displaySections ? displaySections[currentSectionIndex]?.fields : form?.fields;
  const currentSection = displaySections ? displaySections[currentSectionIndex] : null;
  const totalSections = displaySections?.length || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800 py-12">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-neutral-600 dark:text-neutral-400">{form.description}</p>
            )}

            {/* Progress Indicator for Multi-Section Forms */}
            {hasMultipleSections && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    Section {currentSectionIndex + 1} of {totalSections}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {Math.round(((currentSectionIndex + 1) / totalSections) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentSectionIndex + 1) / totalSections) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Title and Description */}
          {currentSection && (
            <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-900/30">
              <h2 className="text-xl font-semibold mb-2">{currentSection.title}</h2>
              {currentSection.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {currentSection.description}
                </p>
              )}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            {displayFields?.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <label className="block text-sm font-medium mb-2">
                  {field.label}
                  {field.required && <span className="text-error-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <>
                    <textarea
                      value={formValues[field.label] || ''}
                      onChange={e => handleFieldChange(field.label, e.target.value)}
                      onBlur={() => handleFieldBlur(field.label)}
                      required={field.required}
                      rows="4"
                      className={`w-full px-3 py-2 border-2 rounded-lg transition-all ${
                        touchedFields[field.label] && errors[field.label] 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                          : touchedFields[field.label] && formValues[field.label]
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    />
                    {touchedFields[field.label] && errors[field.label] && (
                      <p className="mt-1 text-sm text-red-500">⚠️ {errors[field.label]}</p>
                    )}
                    {touchedFields[field.label] && !errors[field.label] && formValues[field.label] && (
                      <p className="mt-1 text-sm text-green-500">✓ Valid</p>
                    )}
                  </>
                ) : field.type === 'select' ? (
                  <>
                    <select
                      value={formValues[field.label] || ''}
                      onChange={e => handleFieldChange(field.label, e.target.value)}
                      onBlur={() => handleFieldBlur(field.label)}
                      required={field.required}
                      className={`w-full px-3 py-2 border-2 rounded-lg transition-all ${
                        touchedFields[field.label] && errors[field.label] 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                          : touchedFields[field.label] && formValues[field.label]
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map(opt => (
                        <option key={opt.id} value={opt.label}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {touchedFields[field.label] && errors[field.label] && (
                      <p className="mt-1 text-sm text-red-500">⚠️ {errors[field.label]}</p>
                    )}
                    {touchedFields[field.label] && !errors[field.label] && formValues[field.label] && (
                      <p className="mt-1 text-sm text-green-500">✓ Valid</p>
                    )}
                  </>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2">
                    {field.options?.map(opt => (
                      <div key={opt.id} className="flex items-center">
                        <input
                          type="radio"
                          id={`${field.id}-${opt.id}`}
                          name={field.label}
                          value={opt.label}
                          checked={formValues[field.label] === opt.label}
                          onChange={e => handleFieldChange(field.label, e.target.value)}
                          required={field.required}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`${field.id}-${opt.id}`} className="ml-2 text-sm">
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {field.options?.map(opt => (
                      <div key={opt.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${field.id}-${opt.id}`}
                          checked={(formValues[field.label] || []).includes(opt.label)}
                          onChange={e =>
                            handleCheckboxChange(field.label, opt.label, e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        <label htmlFor={`${field.id}-${opt.id}`} className="ml-2 text-sm">
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : field.type === 'file' ? (
                  <FormFileUpload
                    activityTitle={form.title || 'form-submission'}
                    registrationId={field.label}
                    onFilesUpload={files => handleFilesUpload(field.label, files)}
                    multiple={true}
                    label={`Upload files for ${field.label}`}
                  />
                ) : (
                  <>
                    <input
                      type={FIELD_TYPES[field.type] || 'text'}
                      value={formValues[field.label] || ''}
                      onChange={e => handleFieldChange(field.label, e.target.value)}
                      onBlur={() => handleFieldBlur(field.label)}
                      required={field.required}
                      className={`w-full px-3 py-2 border-2 rounded-lg transition-all ${
                        touchedFields[field.label] && errors[field.label] 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                          : touchedFields[field.label] && formValues[field.label]
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                          : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                    {touchedFields[field.label] && errors[field.label] && (
                      <p className="mt-1 text-sm text-red-500">⚠️ {errors[field.label]}</p>
                    )}
                    {touchedFields[field.label] && !errors[field.label] && formValues[field.label] && (
                      <p className="mt-1 text-sm text-green-500">✓ Valid</p>
                    )}
                  </>
                )}

                {/* Error Message with live feedback - Only for non-text fields */}
                {field.type !== 'text' && field.type !== 'email' && field.type !== 'phone' && field.type !== 'number' && field.type !== 'date' && touchedFields[field.label] && errors[field.label] && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1"
                  >
                    <span>⚠️</span> {errors[field.label]}
                  </motion.p>
                )}
                {field.type !== 'text' && field.type !== 'email' && field.type !== 'phone' && field.type !== 'number' && field.type !== 'date' && touchedFields[field.label] && !errors[field.label] && formValues[field.label] && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1"
                  >
                    <span>✓</span> Valid
                  </motion.p>
                )}
              </motion.div>
            ))}
          </form>

          {/* Navigation Buttons */}
          {hasMultipleSections ? (
            <div className="flex items-center justify-between gap-4 pt-8 border-t border-neutral-200 dark:border-neutral-700">
              <motion.button
                onClick={handlePrevious}
                disabled={currentSectionIndex === 0 || submitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={20} />
                Previous
              </motion.button>

              {/* Section Indicators */}
              <div className="flex gap-2">
                {visibleSections.map((_, idx) => (
                  <motion.div
                    key={idx}
                    className={`rounded-full transition-all ${
                      idx === currentSectionIndex
                        ? 'w-6 h-2 bg-primary-500'
                        : idx < currentSectionIndex
                        ? 'w-2 h-2 bg-success-500'
                        : 'w-2 h-2 bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  />
                ))}
              </div>

              {currentSectionIndex === visibleSections.length - 1 || shouldSubmitAfterSection() ? (
                <motion.button
                  onClick={handleSubmit}
                  disabled={submitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={20} />
                      Submit
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNext}
                  disabled={submitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 btn-primary"
                >
                  Next
                  <FiChevronRight size={20} />
                </motion.button>
              )}
            </div>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 pt-8 border-t border-neutral-200 dark:border-neutral-700"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Submitting...
                </>
              ) : (
                'Submit Form'
              )}
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Validation Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="⚠️ Validation Errors"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Please fix the following errors before proceeding:
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {validationErrors.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex gap-3">
                  <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {error.field}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <button
            onClick={() => setShowErrorModal(false)}
            className="w-full mt-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            OK, I'll Fix These
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default PublicForm;
