import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormFileUpload from '../components/ui/FormFileUpload';
import { FiArrowLeft, FiCheckCircle, FiAlertCircle, FiExternalLink } from 'react-icons/fi';

function ActivityRegistrationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [formSections, setFormSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0); // Track current section
  const [validationErrors, setValidationErrors] = useState([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const getDefaultFormSections = () => ([
    {
      id: Date.now(),
      title: 'Registration',
      description: 'Please fill in your details',
      fields: [
        {
          id: `field_${Date.now()}`,
          type: "text",
          label: "Full Name",
          required: true,
          placeholder: "Enter your full name"
        },
        {
          id: `field_${Date.now() + 1}`,
          type: "email",
          label: "Email",
          required: true,
          placeholder: "Enter your email"
        }
      ]
    }
  ]);

  const normalizeSections = (activityData) => {
    if (activityData.formSections && activityData.formSections.length > 0) {
      return activityData.formSections;
    }
    const legacyFields = activityData.formSchema;
    if (legacyFields && Array.isArray(legacyFields) && legacyFields.length > 0) {
      return [{
        id: Date.now(),
        title: activityData.formTitle || 'Registration',
        description: activityData.formDescription || '',
        fields: legacyFields,
        conditional: { enabled: false, fieldId: null, condition: 'equals', value: '' }
      }];
    }
    return getDefaultFormSections();
  };

  const fetchActivity = async () => {
    try {
      const docRef = doc(db, 'upcomingActivities', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const activityData = { id: docSnap.id, ...docSnap.data() };
        setActivity(activityData);
        const sections = normalizeSections(activityData);
        setFormSections(sections);

        // Initialize registration data
        const initialData = {};
        sections.forEach(section => {
          section.fields?.forEach(field => {
            if (field.type === 'checkbox') {
              initialData[field.id] = [];
            } else {
              initialData[field.id] = '';
            }
          });
        });
        setRegistrationData(initialData);
      } else {
        alert('Activity not found');
        navigate('/upcoming');
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      alert('Error loading activity');
      navigate('/upcoming');
    } finally {
      setLoading(false);
    }
  };

  const renderContentField = (field) => {
    const renderMarkdownLinks = (text) => {
      if (!text) return text;
      return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">${linkText}</a>`;
      });
    };

    const getFontSizeClass = (size) => {
      switch (size) {
        case "xs": return "text-xs";
        case "sm": return "text-sm";
        case "medium": return "text-base";
        case "lg": return "text-lg";
        case "xl": return "text-xl";
        case "2xl": return "text-2xl";
        case "3xl": return "text-3xl";
        default: return "text-base";
      }
    };

    const getAlignmentClass = (alignment) => {
      switch (alignment) {
        case "center": return "text-center";
        case "right": return "text-right";
        default: return "text-left";
      }
    };

    const getTextColorClass = (color) => {
      switch (color) {
        case "primary": return "text-blue-600 dark:text-blue-400";
        case "secondary": return "text-gray-700 dark:text-gray-300";
        case "success": return "text-green-600 dark:text-green-400";
        case "warning": return "text-yellow-600 dark:text-yellow-400";
        case "danger": return "text-red-600 dark:text-red-400";
        case "muted": return "text-gray-500 dark:text-gray-400";
        default: return "text-gray-900 dark:text-white";
      }
    };

    if (field.type === "label") {
      return (
        <div key={field.id} className={`${getAlignmentClass(field.alignment)} mb-6`}>
          <div
            className={`${getFontSizeClass(field.fontSize)} ${getTextColorClass(field.textColor)} ${field.fontWeight === "bold" ? "font-bold" : field.fontWeight === "semibold" ? "font-semibold" : field.fontWeight === "medium" ? "font-medium" : ""} ${field.italic ? "italic" : ""} ${field.underline ? "underline" : ""}`}
            dangerouslySetInnerHTML={{
              __html: field.contentType === "markdown" ? renderMarkdownLinks(field.content || "") : field.content || ""
            }}
          />
        </div>
      );
    }

    if (field.type === "image") {
      return (
        <div key={field.id} className={`${getAlignmentClass(field.alignment)} mb-6`}>
          {field.imageUrl && (
            <img
              src={field.imageUrl}
              alt={field.altText || "Form image"}
              className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
            />
          )}
        </div>
      );
    }

    if (field.type === "link") {
      return (
        <div key={field.id} className={`${getAlignmentClass(field.alignment)} mb-6`}>
          <a
            href={field.linkUrl || "#"}
            target={field.openInNewTab ? "_blank" : "_self"}
            rel={field.openInNewTab ? "noopener noreferrer" : ""}
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {field.linkText || "Click here"}
          </a>
        </div>
      );
    }

    return null;
  };

  // Calculate visible sections based on flow path
  const getVisibleSectionIds = () => {
    const sections = formSections.length > 0 ? formSections : getDefaultFormSections();
    if (sections.length === 0) return new Set();

    // Start with the first section
    const visibleIds = new Set([sections[0].id]);
    let currentSectionIndex = 0;

    // Prevent infinite loops with max iterations
    let iterations = 0;
    const maxIterations = sections.length * 2;

    // Traverse the path
    while (currentSectionIndex < sections.length && currentSectionIndex >= 0 && iterations < maxIterations) {
      iterations++;
      const currentSection = sections[currentSectionIndex];
      let nextSectionId = null;
      let shouldSubmit = false;

      // Check fields for navigation logic
      if (currentSection.fields) {
        for (const field of currentSection.fields) {
          if (field.conditionalMapping) {
            const value = registrationData[field.id];

            // Handle array values (checkboxes)
            if (Array.isArray(value)) {
              for (const val of value) {
                const mapped = field.conditionalMapping[val];
                if (mapped && mapped.length > 0) {
                  if (mapped.includes('__submit__')) {
                    shouldSubmit = true;
                  } else {
                    const targetHtmlId = mapped.find(m => m !== '__submit__');
                    if (targetHtmlId) nextSectionId = targetHtmlId;
                  }
                }
              }
            } else if (value) {
              // Handle single values
              const mapped = field.conditionalMapping[value];
              if (mapped && mapped.length > 0) {
                if (mapped.includes('__submit__')) {
                  shouldSubmit = true;
                } else {
                  const targetHtmlId = mapped.find(m => m !== '__submit__');
                  if (targetHtmlId) nextSectionId = targetHtmlId;
                }
              }
            }
          }
        }
      }

      // Check section navigation type
      if (currentSection.navigation?.type === 'submit') {
        shouldSubmit = true;
      }

      if (shouldSubmit) {
        // If submitting, no more sections are visible
        break;
      }

      // Determine next index
      let nextIndex = -1;
      if (nextSectionId) {
        nextIndex = sections.findIndex(s => s.id === nextSectionId);
      } else {
        nextIndex = currentSectionIndex + 1;
      }

      // Proceed to next section if valid
      if (nextIndex > currentSectionIndex && nextIndex < sections.length) {
        visibleIds.add(sections[nextIndex].id);
        currentSectionIndex = nextIndex;
      } else if (nextIndex === -1 && !nextSectionId) {
        // Natural end of form
        break;
      } else if (nextIndex <= currentSectionIndex && nextSectionId) {
        // Prevent backward recursion loops
        break;
      } else {
        // Just move to next if no jump
        const plainNext = currentSectionIndex + 1;
        if (plainNext < sections.length) {
          visibleIds.add(sections[plainNext].id);
          currentSectionIndex = plainNext;
        } else {
          break;
        }
      }
    }

    return visibleIds;
  };

  // Check if a section should be visible based on flow
  const isSectionVisible = (section, sectionIndex) => {
    // Basic safety check
    if (!section) return false;

    // First section always visible
    if (sectionIndex === 0) return true;

    const visibleIds = getVisibleSectionIds();
    return visibleIds.has(section.id);
  };

  // Get visible sections
  const getVisibleSections = () => {
    return formSections.filter((section, index) => isSectionVisible(section, index));
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

  // Check if current section has all required fields filled
  const isCurrentSectionValid = () => {
    const sections = formSections.length > 0 ? formSections : getDefaultFormSections();
    const currentSection = sections[currentSectionIndex];

    if (!currentSection?.fields) return true;

    // If section has skipValidation enabled, it's always valid
    if (currentSection.skipValidation) return true;

    return currentSection.fields.every(field => {
      // Skip payment fields if activity is not paid
      if (!activity?.isPaid && (field.label?.toLowerCase().includes('payment') || field.label?.toLowerCase().includes('upi'))) {
        return true;
      }

      const value = registrationData[field.id];

      // Check required fields
      if (field.required && field.type !== "label" && field.type !== "image" && field.type !== "link") {
        if (field.type === 'file') {
          if (!uploadedFiles[field.id] || uploadedFiles[field.id].length === 0) {
            return false;
          }
        } else if (!value || (typeof value === 'string' ? !value.trim() : Array.isArray(value) ? value.length === 0 : !value)) {
          return false;
        }
      }

      // Validate email format and domain
      if (field.type === 'email' && value && typeof value === 'string' && value.trim()) {
        const emailValidation = validateEmail(value, field.emailDomain);
        if (!emailValidation.valid) {
          return false;
        }
      }

      // Validate phone format
      if (field.type === 'phone' && value && typeof value === 'string' && value.trim()) {
        const phoneValidation = validatePhone(value, field.phonePattern);
        if (!phoneValidation.valid) {
          return false;
        }
      }

      return true;
    });
  };

  // Get field validation error (for live feedback)
  const getFieldError = (field) => {
    const value = registrationData[field.id];

    // Check required fields
    if (field.required) {
      if (field.type === 'file') {
        if (!uploadedFiles[field.id] || uploadedFiles[field.id].length === 0) {
          return `${field.label} is required`;
        }
      } else if (!value || (typeof value === 'string' ? !value.trim() : Array.isArray(value) ? value.length === 0 : !value)) {
        return `${field.label} is required`;
      }
    }

    // Validate email format and domain
    if (field.type === 'email' && value && typeof value === 'string' && value.trim()) {
      const emailValidation = validateEmail(value, field.emailDomain);
      if (!emailValidation.valid) {
        return emailValidation.message;
      }
    }

    // Validate phone format
    if (field.type === 'phone' && value && typeof value === 'string' && value.trim()) {
      const phoneValidation = validatePhone(value, field.phonePattern);
      if (!phoneValidation.valid) {
        return phoneValidation.message;
      }
    }

    return null;
  };

  // Check if field has error or has value (for styling)
  const getFieldStatus = (field) => {
    const value = registrationData[field.id];
    const error = getFieldError(field);

    if (error) return 'error';
    if (value && (typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.length > 0 : value)) return 'valid';
    return 'empty';
  };

  // Handler for field value changes with conditional mapping check
  const handleFieldValueChange = (fieldId, newValue) => {
    setRegistrationData(prev => ({
      ...prev,
      [fieldId]: newValue
    }));

    // Check if this field has conditional mapping that triggers submit
    setTimeout(() => {
      const currentSection = formSections[currentSectionIndex];
      const field = currentSection?.fields?.find(f => f.id === fieldId);

      if (field && field.conditionalMapping) {
        const mappedSections = field.conditionalMapping[newValue] || [];

        // If submit form is mapped to this option
        if (mappedSections.includes('__submit__')) {
          handleSubmit();
        }
      }
    }, 50);
  };

  // Handle field blur - mark as touched and validate
  const handleFieldBlur = (fieldId) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldId]: true,
    }));
  };

  // Handler for checkbox changes with conditional mapping check
  const handleCheckboxValueChange = (fieldId, optionValue, isChecked) => {
    const currentValues = registrationData[fieldId] || [];
    const newValues = isChecked
      ? [...currentValues, optionValue]
      : currentValues.filter(v => v !== optionValue);

    setRegistrationData(prev => ({
      ...prev,
      [fieldId]: newValues
    }));

    // Check if this field has conditional mapping that triggers submit
    setTimeout(() => {
      const currentSection = formSections[currentSectionIndex];
      const field = currentSection?.fields?.find(f => f.id === fieldId);

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

  // Check if current section should submit instead of continue
  const shouldSubmitAfterCurrentSection = () => {
    const section = formSections[currentSectionIndex];
    return section?.navigation?.type === 'submit';
  };

  // Go to next section or submit if configured
  const goToNextSection = () => {
    if (isCurrentSectionValid()) {
      // Check if section is set to submit
      if (shouldSubmitAfterCurrentSection()) {
        handleSubmit();
        return;
      }

      const sections = formSections.length > 0 ? formSections : getDefaultFormSections();
      let nextIndex = currentSectionIndex + 1;

      // Skip hidden sections (based on conditional mapping)
      while (nextIndex < sections.length && !isSectionVisible(sections[nextIndex], nextIndex)) {
        nextIndex++;
      }

      // Only move forward if there are more visible sections
      if (nextIndex < sections.length) {
        setCurrentSectionIndex(nextIndex);
      } else {
        // Last visible section reached
        setCurrentSectionIndex(sections.length - 1);
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Please fill in all required fields in this section before proceeding.');
    }
  };

  // Go to previous section
  const goToPreviousSection = () => {
    const sections = formSections.length > 0 ? formSections : getDefaultFormSections();
    let prevIndex = currentSectionIndex - 1;

    // Skip hidden sections when going back
    while (prevIndex >= 0 && !isSectionVisible(sections[prevIndex], prevIndex)) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      setCurrentSectionIndex(prevIndex);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if a field should be visible based on conditional logic
  const isFieldVisible = (field, sectionId) => {
    // If field doesn't have conditional logic, always show it
    if (!field.conditional?.enabled) return true;

    // Find the conditional field
    const currentSection = formSections.find(s => s.id === sectionId);
    if (!currentSection) return true;

    const conditionField = currentSection.fields?.find(f => f.id === field.conditional.fieldId);
    if (!conditionField) return true;

    // Check if the condition value matches
    const fieldValue = registrationData[field.conditional.fieldId];
    return fieldValue === field.conditional.value;
  };

  const renderFormField = (field, sectionId) => {
    // Check if field should be visible
    if (!isFieldVisible(field, sectionId)) return null;

    if (field.type === "label" || field.type === "image" || field.type === "link") {
      return renderContentField(field);
    }

    const commonProps = {
      key: field.id,
      value: registrationData[field.id] || "",
      placeholder: field.placeholder,
      required: field.required
    };

    const fieldError = getFieldError(field);
    const fieldStatus = getFieldStatus(field);
    const isTouched = touchedFields[field.id];

    // Get border and text color based on validation status
    const getBorderColor = () => {
      if (isTouched && fieldStatus === 'error') return 'border-red-500 dark:border-red-500';
      if (isTouched && fieldStatus === 'valid') return 'border-green-500 dark:border-green-500';
      return 'border-gray-300 dark:border-gray-600';
    };

    const getBackgroundColor = () => {
      if (isTouched && fieldStatus === 'error') return 'bg-red-50 dark:bg-red-900/10';
      if (isTouched && fieldStatus === 'valid') return 'bg-green-50 dark:bg-green-900/10';
      return 'bg-white dark:bg-gray-800';
    };

    const getFocusRing = () => {
      if (isTouched && fieldStatus === 'error') return 'focus:ring-red-500';
      if (isTouched && fieldStatus === 'valid') return 'focus:ring-green-500';
      return 'focus:ring-blue-500';
    };

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && "*"}
            </label>
            <textarea
              {...commonProps}
              onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field.id)}
              rows={4}
              className={`w-full px-3 py-2 border-2 rounded-xl ${getBackgroundColor()} text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${getFocusRing()} transition-colors ${getBorderColor()}`}
            />
            {isTouched && fieldError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {fieldError}
              </p>
            )}
            {isTouched && fieldStatus === 'valid' && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Valid
              </p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && "*"}
            </label>
            <select
              {...commonProps}
              onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field.id)}
              className={`w-full px-3 py-2 border-2 rounded-xl ${getBackgroundColor()} text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${getFocusRing()} transition-colors ${getBorderColor()}`}
            >
              <option value="">Select an option</option>
              {field.options?.map((opt, idx) => (
                <option key={idx} value={typeof opt === 'string' ? opt : opt.label}>
                  {typeof opt === 'string' ? opt : opt.label}
                </option>
              ))}
            </select>
            {isTouched && fieldError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {fieldError}
              </p>
            )}
            {isTouched && fieldStatus === 'valid' && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Valid
              </p>
            )}
          </div>
        );

      case "radio":
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && "*"}
            </label>
            <div className="space-y-2">
              {field.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="radio"
                    id={`${field.id}-${idx}`}
                    name={field.id}
                    value={typeof opt === 'string' ? opt : opt.label}
                    checked={registrationData[field.id] === (typeof opt === 'string' ? opt : opt.label)}
                    onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                    onBlur={() => handleFieldBlur(field.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor={`${field.id}-${idx}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {typeof opt === 'string' ? opt : opt.label}
                  </label>
                </div>
              ))}
            </div>
            {isTouched && fieldError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {fieldError}
              </p>
            )}
            {isTouched && fieldStatus === 'valid' && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Valid
              </p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && "*"}
            </label>
            <div className="space-y-2">
              {field.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${field.id}-${idx}`}
                    checked={(registrationData[field.id] || []).includes(typeof opt === 'string' ? opt : opt.label)}
                    onChange={(e) => {
                      const value = typeof opt === 'string' ? opt : opt.label;
                      handleCheckboxValueChange(field.id, value, e.target.checked);
                    }}
                    onBlur={() => handleFieldBlur(field.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor={`${field.id}-${idx}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {typeof opt === 'string' ? opt : opt.label}
                  </label>
                </div>
              ))}
            </div>
            {isTouched && fieldError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {fieldError}
              </p>
            )}
            {isTouched && fieldStatus === 'valid' && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Valid
              </p>
            )}
          </div>
        );

      case "file":
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && "*"}
            </label>
            <FormFileUpload
              activityTitle={activity?.title || 'Activity'}
              registrationId={field.id}
              paymentId={field.label?.toLowerCase().includes('payment') ? `${activity?.id || 'payment'}-proof` : null}
              onFilesUpload={(files) => {
                setUploadedFiles({ ...uploadedFiles, [field.id]: files });
                handleFieldBlur(field.id);
              }}
              multiple={true}
              label={`Upload files for ${field.label}`}
            />
            {isTouched && fieldError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {fieldError}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label} {field.required && "*"}
            </label>
            <input
              {...commonProps}
              type={field.type === 'phone' ? 'tel' : field.type}
              onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
              onBlur={() => handleFieldBlur(field.id)}
              className={`w-full px-3 py-2 border-2 rounded-xl ${getBackgroundColor()} text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${getFocusRing()} transition-colors ${getBorderColor()}`}
            />
            {isTouched && fieldError && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>⚠️</span> {fieldError}
              </p>
            )}
            {isTouched && fieldStatus === 'valid' && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Valid
              </p>
            )}
          </div>
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields including email and phone format
    const sections = formSections.length > 0 ? formSections : getDefaultFormSections();
    const validationErrors = [];

    sections.forEach((section, index) => {
      // Skip validation for invisible sections
      if (!isSectionVisible(section, index)) return;

      section.fields?.forEach(field => {
        // Skip validation for invisible fields
        if (!isFieldVisible(field, section.id)) return;

        if (field.type !== "label" && field.type !== "image" && field.type !== "link") {
          const value = registrationData[field.id];

          // Check required fields
          if (field.required) {
            if (field.type === 'file') {
              if (!uploadedFiles[field.id] || uploadedFiles[field.id].length === 0) {
                validationErrors.push(`${field.label} is required`);
                return;
              }
            } else if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim())) {
              validationErrors.push(`${field.label} is required`);
              return;
            }
          }

          // Validate email format and domain
          if (field.type === 'email' && value && typeof value === 'string' && value.trim()) {
            const emailValidation = validateEmail(value, field.emailDomain);
            if (!emailValidation.valid) {
              validationErrors.push(`${field.label}: ${emailValidation.message}`);
            }
          }

          // Validate phone format
          if (field.type === 'phone' && value && typeof value === 'string' && value.trim()) {
            const phoneValidation = validatePhone(value, field.phonePattern);
            if (!phoneValidation.valid) {
              validationErrors.push(`${field.label}: ${phoneValidation.message}`);
            }
          }
        }
      });
    });

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map((errorMsg, index) => {
        // Parse field name and message
        const parts = errorMsg.split(': ');
        return {
          field: parts[0],
          message: parts[1] || parts[0]
        };
      });
      setValidationErrors(errorMessages);
      setShowErrorModal(true);
      return;
    }

    // Payment validation is now handled in the main validation loop above,
    // which respects section visibility and field types (including files).

    setSubmitting(true);

    try {
      // Create a mapping from field IDs to field labels
      const fieldIdToLabelMap = {};
      sections.forEach(section => {
        section.fields?.forEach(field => {
          if (field.type !== "label" && field.type !== "image" && field.type !== "link") {
            fieldIdToLabelMap[field.id] = field.label;
          }
        });
      });

      // Convert registrationData to use field labels as keys instead of field IDs
      const dataWithLabels = {};
      Object.keys(registrationData).forEach(fieldId => {
        const fieldLabel = fieldIdToLabelMap[fieldId] || fieldId;
        // Sanitize label for use as Firestore key (remove special chars, spaces become underscores)
        const sanitizedKey = fieldLabel
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        dataWithLabels[sanitizedKey] = registrationData[fieldId];
      });

      // Convert uploadedFiles to use field labels as keys
      const filesWithLabels = {};
      Object.keys(uploadedFiles).forEach(fieldId => {
        const fieldLabel = fieldIdToLabelMap[fieldId] || fieldId;
        const sanitizedKey = fieldLabel
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        filesWithLabels[sanitizedKey] = uploadedFiles[fieldId];
      });

      // Check if payment fields exist in the submission
      const hasPaymentFields = Object.keys(dataWithLabels).some(key =>
        key.toLowerCase().includes('payment') || key.toLowerCase().includes('upi')
      );
      const hasPaymentFiles = Object.keys(filesWithLabels).some(key =>
        key.toLowerCase().includes('payment')
      );

      const submissionData = {
        activityId: id,
        activityTitle: activity.title,
        submittedAt: new Date().toISOString(),
        ...dataWithLabels, // Spread data with labels as keys directly into submissionData
        files: filesWithLabels,
        status: (hasPaymentFields || hasPaymentFiles) ? "pending_payment" : "confirmed",
        // Keep field mapping for reference
        _fieldMapping: fieldIdToLabelMap
      };

      // Payment fields are now handled as regular form fields, no special handling needed

      await addDoc(collection(db, 'allRegistrations'), submissionData);

      // Also save to activity-specific collection
      try {
        await addDoc(collection(db, 'upcomingActivities', id, 'registrations'), submissionData);
      } catch (error) {
        console.warn('Could not save to activity-specific collection:', error);
      }

      setSubmitted(true);
      setTimeout(() => {
        navigate('/upcoming');
      }, 3000);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Error submitting registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isRegistrationOpen = () => {
    if (!activity) return false;
    const now = new Date();
    const start = new Date(activity.registrationStart);
    const end = new Date(activity.registrationEnd);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Activity Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The activity you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate('/upcoming')}>
            Back to Activities
          </Button>
        </div>
      </div>
    );
  }

  if (!isRegistrationOpen()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <FiAlertCircle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Registration Closed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Registration for this activity is currently closed.
          </p>
          <Button onClick={() => navigate('/upcoming')}>
            Back to Activities
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto"
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your registration has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to activities page...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/upcoming')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <FiArrowLeft size={20} />
              <span>Back to Activities</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {activity.title}
            </h1>
            {activity.description && (
              <p className="text-gray-600 dark:text-gray-400">{activity.description}</p>
            )}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p><strong>Event Date:</strong> {new Date(activity.eventDate).toLocaleDateString()}</p>
              <p><strong>Registration Deadline:</strong> {new Date(activity.registrationEnd).toLocaleDateString()}</p>
              {activity.maxParticipants && (
                <p><strong>Max Participants:</strong> {activity.maxParticipants}</p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {(() => {
              const sections = formSections.length > 0 ? formSections : getDefaultFormSections();
              const visibleSections = sections.filter((s, idx) => isSectionVisible(s, idx));
              const currentSection = sections[currentSectionIndex];
              const visibleSectionIndex = visibleSections.findIndex(s => s.id === currentSection.id);
              const totalVisibleSections = visibleSections.length;
              const isFirstSection = currentSectionIndex === 0;
              const isLastVisibleSection = visibleSectionIndex === totalVisibleSections - 1;
              const isValid = isCurrentSectionValid();

              return (
                <div key={currentSection.id} id={`section-${currentSection.id}`} className="space-y-6">
                  {/* Progress Indicator */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Section {visibleSectionIndex + 1} of {totalVisibleSections}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(((visibleSectionIndex + 1) / totalVisibleSections) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((visibleSectionIndex + 1) / totalVisibleSections) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Section Content */}
                  {(currentSection.title || currentSection.description) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      {currentSection.title && (
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          Section {currentSectionIndex + 1}: {currentSection.title}
                        </h3>
                      )}
                      {currentSection.description && (
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {currentSection.description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-6">
                    {currentSection.fields?.map((field) => {
                      if (field.type === "label" || field.type === "image" || field.type === "link") {
                        return renderContentField(field);
                      }
                      return renderFormField(field, currentSection.id);
                    })}
                  </div>

                  {/* Section Navigation */}
                  <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-4">
                      {!isFirstSection && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => goToPreviousSection()}
                          className="min-w-[150px]"
                        >
                          ← Previous
                        </Button>
                      )}
                      <div className="flex-1"></div>
                      {!isLastVisibleSection && !shouldSubmitAfterCurrentSection() && (
                        <Button
                          type="button"
                          variant={isValid ? "primary" : "disabled"}
                          onClick={() => goToNextSection()}
                          disabled={!isValid}
                          className="min-w-[150px]"
                        >
                          Next →
                        </Button>
                      )}
                      {(isLastVisibleSection || shouldSubmitAfterCurrentSection()) && (
                        <Button
                          type="submit"
                          disabled={!isValid}
                          className="min-w-[150px]"
                        >
                          Register
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </form>

          {/* Validation Error Modal */}
          <Modal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            title="⚠️ Validation Errors"
          >
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Please fix the following errors before registering:
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
        </motion.div>
      </div>
    </div>
  );
}

export default ActivityRegistrationPage;
