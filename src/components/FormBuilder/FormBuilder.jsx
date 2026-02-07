import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GripVertical, Eye, Settings, Link, Image as ImageIcon, Type, Copy, ArrowUp, ArrowDown, ArrowRight, Download, Play, CheckCircle, Info, Star, Heart, ThumbsUp, Sun, Moon, Zap, Award, Crown, Smile, Meh, Frown } from "lucide-react";
import { uploadFormBuilderImage, uploadFormFiles } from "../../utils/cloudinary";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

const FormBuilder = ({ formSchema = [], onChange, isPaid = false, fee = '', paymentUrl = '', paymentInstructions = '' }) => {
  // Convert formSchema to sections structure if needed
  const initializeSections = () => {
    // Check if formSchema is already an array of sections (has id, title, fields properties)
    if (formSchema && formSchema.length > 0) {
      // Check if first item is a section (has fields property) or a field (has type property)
      const firstItem = formSchema[0];
      if (firstItem && firstItem.fields !== undefined) {
        // Already in sections format - ensure navigation property exists
        return formSchema.map((section, index) => ({
          ...section,
          navigation: section.navigation || { type: index === formSchema.length - 1 ? "submit" : "next" }
        }));
      } else if (firstItem && firstItem.type !== undefined) {
        // It's an array of fields, convert to sections
        return [{
          id: `section_${Date.now()}`,
          title: "Section 1",
          description: "",
          fields: formSchema,
          conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] },
          navigation: { type: "submit" }
        }];
      }
    }
    // Default empty section
    return [{
      id: `section_${Date.now()}`,
      title: "Section 1",
      description: "",
      fields: [],
      conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] },
      navigation: { type: "submit" }
    }];
  };

  const [sections, setSections] = useState(() => initializeSections());
  const sectionRefs = React.useRef({});
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingFieldDraft, setEditingFieldDraft] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [draggedField, setDraggedField] = useState(null);
  const [currentSectionId, setCurrentSectionId] = useState(() => {
    const initSections = initializeSections();
    return initSections[0]?.id || null;
  });
  const [editingSection, setEditingSection] = useState(null);
  const isInternalUpdateRef = React.useRef(false);

  // Update sections when formSchema prop changes externally
  useEffect(() => {
    // Only update if this is an external change (not from our internal updates)
    if (!isInternalUpdateRef.current) {
      const newSections = initializeSections();
      setSections(newSections);
      if (newSections.length > 0 && !currentSectionId) {
        setCurrentSectionId(newSections[0].id);
      }
    }
    isInternalUpdateRef.current = false;
  }, [formSchema]);

  // Helper function to update sections and notify parent
  const updateSections = (newSections) => {
    isInternalUpdateRef.current = true;
    setSections(newSections);
    // Use setTimeout to ensure state is updated before calling onChange
    setTimeout(() => {
      if (onChange) {
        onChange(newSections);
      }
    }, 0);
  };

  const fieldTypes = [
    { type: "text", label: "Short Text", icon: "📝", category: "input" },
    { type: "textarea", label: "Long Text", icon: "📄", category: "input" },
    { type: "email", label: "Email", icon: "📧", category: "input" },
    { type: "phone", label: "Phone Number", icon: "📞", category: "input" },
    { type: "number", label: "Number", icon: "🔢", category: "input" },
    { type: "select", label: "Dropdown", icon: "📋", category: "choice" },
    { type: "radio", label: "Multiple Choice", icon: "⚪", category: "choice" },
    { type: "checkbox", label: "Checkboxes", icon: "☑️", category: "choice" },
    { type: "file", label: "File Upload", icon: "📎", category: "input" },
    { type: "date", label: "Date", icon: "📅", category: "input" },
    { type: "time", label: "Time", icon: "⏰", category: "input" },
    { type: "url", label: "Website URL", icon: "🌐", category: "input" },
    { type: "label", label: "Description", icon: "📋", category: "content" },
    { type: "image", label: "Image", icon: "🖼️", category: "content" },
    { type: "link", label: "Link/Button", icon: "🔗", category: "content" },
    { type: "rating", label: "Rating", icon: "⭐", category: "input" }
  ];

  // Section management functions
  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      description: "",
      fields: [],
      conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] },
      navigation: { type: "next" }, // "next", "submit", or section ID
      skipValidation: false // Allow skipping required field validation
    };
    updateSections([...sections, newSection]);
    setCurrentSectionId(newSection.id);
  };

  const insertSectionAfter = (index) => {
    const newSection = {
      id: `section_${Date.now()}`,
      title: `Section ${index + 2}`,
      description: "",
      fields: [],
      conditional: { enabled: false, fieldId: null, optionValue: null, showSections: [] },
      navigation: { type: "next" },
      skipValidation: false // Allow skipping required field validation
    };
    const updated = [...sections];
    updated.splice(index + 1, 0, newSection);
    updateSections(updated);
    setCurrentSectionId(newSection.id);
    setEditingSection(newSection.id);
    // scroll into view after render
    setTimeout(() => {
      const el = sectionRefs.current?.[newSection.id];
      if (el && typeof el.scrollIntoView === 'function') {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
          el.scrollIntoView();
        }
      }
    }, 120);
  };

  const updateSection = (sectionId, updates) => {
    const updatedSections = sections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
    updateSections(updatedSections);
  };

  const deleteSection = (sectionId) => {
    if (sections.length <= 1) {
      alert("You must have at least one section");
      return;
    }
    if (window.confirm("Are you sure you want to delete this section? All fields in this section will be deleted.")) {
      const updatedSections = sections.filter(s => s.id !== sectionId);
      updateSections(updatedSections);
      if (currentSectionId === sectionId) {
        setCurrentSectionId(updatedSections.find(s => s.id !== sectionId)?.id || updatedSections[0]?.id);
      }
    }
  };

  const moveSection = (sectionId, direction) => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updatedSections = [...sections];
    const [movedSection] = updatedSections.splice(currentIndex, 1);
    updatedSections.splice(newIndex, 0, movedSection);
    updateSections(updatedSections);
  };

  const getCurrentSection = () => sections.find(s => s.id === currentSectionId) || sections[0];
  const getCurrentFields = () => getCurrentSection()?.fields || [];

  const addField = (type, sectionId = null) => {
    const targetSectionId = sectionId || currentSectionId;
    const fieldType = fieldTypes.find(f => f.type === type);
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: fieldType?.category === "content" ? "" : `${fieldType?.label || "New Field"}`,
      required: false,
      placeholder: "",
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
      conditional: { enabled: false, fieldId: null, value: "" }, // Field-level conditional visibility
      validation: {},
      helpText: "",
      acceptedFileTypes: type === "file" ? "*" : undefined,
      conditionalMapping: {}, // Store option -> section mappings
      // Content field properties
      content: type === "label" ? "Add your description here. You can use [links](https://example.com) in your text." : "",
      contentType: type === "label" ? "markdown" : "text",
      imageUrl: type === "image" ? "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400" : undefined,
      altText: type === "image" ? "Sample image" : undefined,
      linkUrl: type === "link" ? "https://example.com" : undefined,
      linkText: type === "link" ? "Click here" : undefined,
      openInNewTab: type === "link" ? true : undefined,
      buttonStyle: type === "link" ? "primary" : undefined,
      buttonSize: type === "link" ? "md" : undefined,
      buttonWidth: type === "link" ? "auto" : undefined,
      showIcon: type === "link" ? false : undefined,
      iconType: type === "link" ? "arrow" : undefined,
      iconPosition: type === "link" ? "right" : undefined,
      fontSize: type === "label" ? "medium" : undefined,
      alignment: (type === "label" || type === "image" || type === "link") ? "left" : undefined,
      textColor: type === "label" ? "default" : undefined,
      fontWeight: type === "label" ? "normal" : undefined,
      italic: type === "label" ? false : undefined,
      underline: type === "label" ? false : undefined,
      imageSize: type === "image" ? "auto" : undefined,
      borderStyle: type === "image" ? "rounded" : undefined,
      shadow: type === "image" ? "none" : undefined,
      clickable: type === "image" ? false : undefined,
      clickUrl: type === "image" ? "" : undefined,
      useFileUpload: type === "image" ? false : undefined,
      maxRating: type === "rating" ? 5 : undefined,
      // iconType is already defined above for link, reuse or override if rating
      ...(type === "rating" ? { iconType: "star" } : {})
    };

    const currentSection = getCurrentSection();
    const updatedFields = [...(currentSection?.fields || []), newField];
    updateSection(targetSectionId, { fields: updatedFields });

    setShowAddField(false);

    // Auto-open settings for content fields and rating
    if (["label", "image", "link", "rating"].includes(type)) {
      setTimeout(() => {
        setEditingField(newField);
        setEditingFieldDraft({ ...newField });
      }, 100);
    }
  };

  const updateField = (fieldId, updates) => {
    const updatedSections = sections.map(section => ({
      ...section,
      fields: section.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
    updateSections(updatedSections);
  };

  const deleteField = (fieldId) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      const updatedSections = sections.map(section => ({
        ...section,
        fields: section.fields.filter(field => field.id !== fieldId)
      }));
      updateSections(updatedSections);
    }
  };

  const duplicateField = (field) => {
    const newField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: field.label + " (Copy)"
    };
    const section = sections.find(s => s.fields.some(f => f.id === field.id));
    if (section) {
      const fieldIndex = section.fields.findIndex(f => f.id === field.id);
      const updatedFields = [...section.fields];
      updatedFields.splice(fieldIndex + 1, 0, newField);
      updateSection(section.id, { fields: updatedFields });
    }
  };

  const moveField = (fieldId, direction) => {
    const section = sections.find(s => s.fields.some(f => f.id === fieldId));
    if (!section) return;

    const currentIndex = section.fields.findIndex(f => f.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= section.fields.length) return;

    const updatedFields = [...section.fields];
    const [movedField] = updatedFields.splice(currentIndex, 1);
    updatedFields.splice(newIndex, 0, movedField);
    updateSection(section.id, { fields: updatedFields });
  };

  const FieldEditor = ({ field, index, sectionId }) => {
    const fieldType = fieldTypes.find(f => f.type === field.type);
    const section = sections.find(s => s.id === sectionId);
    const fieldIndex = section?.fields.findIndex(f => f.id === field.id) || index;

    // Only update fields array, not modal draft
    const addOption = () => {
      const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
      updateField(field.id, { options: newOptions });
    };
    const updateOption = (optionIndex, value) => {
      const newOptions = [...(field.options || [])];
      newOptions[optionIndex] = value;
      updateField(field.id, { options: newOptions });
    };
    const removeOption = (optionIndex) => {
      const newOptions = field.options?.filter((_, i) => i !== optionIndex) || [];
      updateField(field.id, { options: newOptions });
    };

    // Get all fields from previous sections for conditional mapping
    const getPreviousFields = () => {
      const currentSectionIndex = sections.findIndex(s => s.id === sectionId);
      const previousSections = sections.slice(0, currentSectionIndex);
      return previousSections.flatMap(s => s.fields.filter(f =>
        ["select", "radio", "checkbox"].includes(f.type) && f.options && f.options.length > 0
      ));
    };

    const renderFieldPreview = () => {
      switch (field.type) {
        case "label":
          return (
            <div className={`${getAlignmentClass(field.alignment)} mb-4`}>
              <div
                className={`${getFontSizeClass(field.fontSize)} ${getTextColorClass(field.textColor)} ${field.fontWeight === "bold" ? "font-bold" : field.fontWeight === "semibold" ? "font-semibold" : field.fontWeight === "medium" ? "font-medium" : ""} ${field.italic ? "italic" : ""} ${field.underline ? "underline" : ""}`}
                dangerouslySetInnerHTML={{
                  __html: field.contentType === "markdown" ? renderMarkdownLinks(field.content || "Add your description here...") : field.content || "Add your description here..."
                }}
              />
            </div>
          );

        case "image":
          return (
            <div className={`${getAlignmentClass(field.alignment)} mb-4`}>
              {field.imageUrl ? (
                <img
                  src={field.imageUrl}
                  alt={field.altText || "Form image"}
                  className={`${getImageSizeClass(field.imageSize)} ${getBorderStyleClass(field.borderStyle)} ${getShadowClass(field.shadow)} border-2 border-gray-300 dark:border-gray-600`}
                  onError={(e) => {
                    e.target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400";
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          );

        case "link":
          return (
            <div className={`${getAlignmentClass(field.alignment)} mb-4`}>
              <span className={`transition-colors cursor-pointer ${getButtonStyleClass(field.buttonStyle)} ${getButtonSizeClass(field.buttonSize)} ${getButtonWidthClass(field.buttonWidth)} ${field.showIcon ? "inline-flex items-center gap-2" : ""}`}>
                {field.showIcon && field.iconPosition === "left" && (
                  <span className="text-sm">{getIcon(field.iconType)}</span>
                )}
                {field.linkText || "Click here"}
                {field.showIcon && field.iconPosition === "right" && (
                  <span className="text-sm">{getIcon(field.iconType)}</span>
                )}
              </span>
            </div>
          );

        case "select":
          return (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <select
                disabled
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>Select an option</option>
                {field.options?.map((option, i) => (
                  <option key={i}>{option}</option>
                ))}
              </select>
            </div>
          );

        case "radio":
          return (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <div className="space-y-2">
                {field.options?.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input type="radio" disabled className="text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          );

        case "checkbox":
          return (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <div className="space-y-2">
                {field.options?.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input type="checkbox" disabled className="rounded border-gray-300 dark:border-gray-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          );

        case "textarea":
          return (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <textarea
                disabled
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          );



        case "rating":
          const renderRatingIcon = (index, filled) => {
            const iconProps = {
              className: `w-6 h-6 ${filled ? "fill-current text-yellow-500" : "text-gray-300"} transition-colors`,
              strokeWidth: filled ? 0 : 2
            };

            if (field.iconType === "faces") {
              const faces = [
                { icon: Frown, color: "text-red-500", label: "Angry" },
                { icon: Frown, color: "text-orange-500", label: "Sad" },
                { icon: Meh, color: "text-yellow-500", label: "Neutral" },
                { icon: Smile, color: "text-blue-500", label: "Good" },
                { icon: Smile, color: "text-green-500", label: "Happy" }
              ];
              // Map index to 5-step scale if maxRating is different, but for faces usually fixed to 5
              const faceIndex = Math.min(Math.floor((index / (field.maxRating || 5)) * 5), 4);
              const FaceIcon = faces[faceIndex].icon;

              return (
                <FaceIcon
                  className={`w-8 h-8 ${filled ? faces[faceIndex].color : "text-gray-300"} transition-colors`}
                />
              );
            }

            switch (field.iconType) {
              case "heart": return <Heart {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-red-500" : "text-gray-300"}`} />;
              case "thumbsUp": return <ThumbsUp {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-blue-500" : "text-gray-300"}`} />;
              case "sun": return <Sun {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-orange-400" : "text-gray-300"}`} />;
              case "moon": return <Moon {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-indigo-500" : "text-gray-300"}`} />;
              case "zap": return <Zap {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-yellow-500" : "text-gray-300"}`} />;
              case "award": return <Award {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-purple-500" : "text-gray-300"}`} />;
              case "crown": return <Crown {...iconProps} className={`w-6 h-6 ${filled ? "fill-current text-yellow-600" : "text-gray-300"}`} />;
              default: return <Star {...iconProps} />;
            }
          };

          return (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <div className="flex items-center space-x-2">
                {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
                  <div key={i} className="cursor-pointer">
                    {renderRatingIcon(i, i < 3)} {/* Showing example filled state */}
                  </div>
                ))}
              </div>
              {field.helpText && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );



        default:
          return (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <input
                type={field.type}
                disabled
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          );
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
      >
        {/* Field Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{fieldType?.icon}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {fieldType?.label}
              </span>
            </div>
            {field.required && (
              <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded">
                Required
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => moveField(field.id, "up")}
              disabled={fieldIndex === 0}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => moveField(field.id, "down")}
              disabled={fieldIndex === (section?.fields.length || 0) - 1}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => duplicateField(field)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingField(field);
                setEditingFieldDraft({ ...field });
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => deleteField(field.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Field Preview */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          {renderFieldPreview()}
        </div>

        {/* Quick Edit for Choice Fields */}
        {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {field.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(optionIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const FormPreview = ({ fields, isPaid = false, fee = '', paymentUrl = '', paymentInstructions = '' }) => {
    const hasPaymentFields = Array.isArray(fields) && fields.some(f => {
      const text = `${(f.id || '')} ${(f.label || '')}`.toLowerCase();
      // Only treat as payment info if it's not our explicit rating field (unlikely to have rating named payment, but safe check)
      if (f.type === "rating") return false;
      return /payment|upi|transaction|transactionid|paymentproof|payment_proof|payment_screenshot|waive|exempt/.test(text);
    });

    const [formData, setFormData] = useState({});

    const renderField = (field) => {
      // Debug logging for content fields
      if (["label", "image", "link", "rating"].includes(field.type)) {
        console.log(`Rendering ${field.type} field:`, field);
      }

      // Handle content fields
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
              <div className="relative">
                <img
                  src={field.imageUrl}
                  alt={field.altText || "Form image"}
                  className={`${getImageSizeClass(field.imageSize)} ${getBorderStyleClass(field.borderStyle)} ${getShadowClass(field.shadow)} border-2 border-gray-300 dark:border-gray-600 ${field.clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                  onError={(e) => {
                    e.target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400";
                  }}
                  onClick={() => {
                    if (field.clickable) {
                      const url = field.clickUrl || field.imageUrl;
                      if (url) window.open(url, '_blank');
                    }
                  }}
                />
                {field.clickable && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    🔗
                  </div>
                )}
              </div>
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
              className={`inline-block transition-colors ${getButtonStyleClass(field.buttonStyle)} ${getButtonSizeClass(field.buttonSize)} ${getButtonWidthClass(field.buttonWidth)} ${field.showIcon ? "inline-flex items-center gap-2" : ""}`}
            >
              {field.showIcon && field.iconPosition === "left" && (
                <span className="text-sm">{getIcon(field.iconType)}</span>
              )}
              {field.linkText || "Click here"}
              {field.showIcon && field.iconPosition === "right" && (
                <span className="text-sm">{getIcon(field.iconType)}</span>
              )}
            </a>
          </div>
        );
      }

      // Handle regular form fields
      const commonProps = {
        key: field.id,
        label: field.label + (field.required ? " *" : ""),
        value: formData[field.id] || "",
        onChange: (e) => setFormData({ ...formData, [field.id]: e.target.value }),
        placeholder: field.placeholder,
        required: field.required
      };

      switch (field.type) {
        case "textarea":
          return (
            <div key={field.id} className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <textarea
                value={formData[field.id] || ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );

        case "select":
          return (
            <div key={field.id} className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <select
                value={formData[field.id] || ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                required={field.required}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an option</option>
                {field.options?.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );

        case "radio":
          return (
            <div key={field.id} className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`${field.id}-${index}`}
                      name={field.id}
                      value={option}
                      checked={formData[field.id] === option}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      required={field.required}
                      className="text-blue-600"
                    />
                    <label htmlFor={`${field.id}-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );

        case "checkbox":
          return (
            <div key={field.id} className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`${field.id}-${index}`}
                      value={option}
                      checked={(formData[field.id] || []).includes(option)}
                      onChange={(e) => {
                        const currentValues = formData[field.id] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter(v => v !== option);
                        setFormData({ ...formData, [field.id]: newValues });
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor={`${field.id}-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );

        case "file":
          return (
            <div key={field.id} className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <input
                type="file"
                required={field.required}
                accept={field.acceptedFileTypes || "*"}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );

        case "rating":
          const renderRatingIcon = (index, filled, setHover) => {
            const iconProps = {
              className: `w-8 h-8 transition-transform cursor-pointer ${setHover ? "hover:scale-110" : ""} ${filled ? "fill-current" : "text-gray-300"}`,
              strokeWidth: filled ? 0 : 2
            };

            // Dynamic Colors based on fill for shapes
            const getShapeColor = () => {
              if (!filled) return "text-gray-300";
              switch (field.iconType) {
                case "heart": return "text-red-500";
                case "thumbsUp": return "text-blue-500";
                case "sun": return "text-orange-400";
                case "moon": return "text-indigo-500";
                case "zap": return "text-yellow-500";
                case "award": return "text-purple-500";
                case "crown": return "text-yellow-600";
                default: return "text-yellow-500"; // Star default
              }
            };

            if (field.iconType === "faces") {
              const faces = [
                { icon: Frown, color: "text-red-500", label: "Angry" },
                { icon: Frown, color: "text-orange-500", label: "Sad" },
                { icon: Meh, color: "text-yellow-500", label: "Neutral" },
                { icon: Smile, color: "text-blue-500", label: "Good" },
                { icon: Smile, color: "text-green-500", label: "Happy" }
              ];
              // For scale of 5
              const faceIndex = index;
              const FaceIcon = faces[faceIndex % 5].icon;
              const isActive = filled; // In faces, often we just highlight the selected one or up to selected
              // Implementation: Emotes usually single selection behavior visually, but rating logic implies scale.
              // Let's treat it as "highlight selected and ones before it" OR "highlight just selected"
              // Standard rating is cumulative. Let's do cumulative for now but maybe change style.

              // Better approach for faces: Highlight ONLY the selected one, and gray out others? 
              // OR Color them up to the point. 
              // Standard "Rate Experience" usually is "Select One Emotion". 
              // If it matches index, color it. 

              const isSelected = (formData[field.id] || 0) == index + 1;
              const isHovered = false; // We can't easily track hover state per icon in this map without more state. 
              // Simplified for preview: Check if value >= index + 1

              const isFilled = (formData[field.id] || 0) >= index + 1;

              return (
                <FaceIcon
                  className={`w-10 h-10 transition-transform hover:scale-110 cursor-pointer ${isFilled ? faces[faceIndex % 5].color : "text-gray-300"}`}
                  onClick={() => setFormData({ ...formData, [field.id]: index + 1 })}
                />
              );
            }

            return (
              <div
                onClick={() => setFormData({ ...formData, [field.id]: index + 1 })}
                className={getShapeColor()}
              >
                {(() => {
                  switch (field.iconType) {
                    case "heart": return <Heart {...iconProps} className={`${iconProps.className} ${filled ? "text-red-500" : "text-gray-300"}`} />;
                    case "thumbsUp": return <ThumbsUp {...iconProps} className={`${iconProps.className} ${filled ? "text-blue-500" : "text-gray-300"}`} />;
                    case "sun": return <Sun {...iconProps} className={`${iconProps.className} ${filled ? "text-orange-400" : "text-gray-300"}`} />;
                    case "moon": return <Moon {...iconProps} className={`${iconProps.className} ${filled ? "text-indigo-500" : "text-gray-300"}`} />;
                    case "zap": return <Zap {...iconProps} className={`${iconProps.className} ${filled ? "text-yellow-500" : "text-gray-300"}`} />;
                    case "award": return <Award {...iconProps} className={`${iconProps.className} ${filled ? "text-purple-500" : "text-gray-300"}`} />;
                    case "crown": return <Crown {...iconProps} className={`${iconProps.className} ${filled ? "text-yellow-600" : "text-gray-300"}`} />;
                    default: return <Star {...iconProps} className={`${iconProps.className} ${filled ? "text-yellow-500" : "text-gray-300"}`} />;
                  }
                })()}
              </div>
            );
          };

          return (
            <div key={field.id} className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <div className="flex items-center space-x-2">
                {Array.from({ length: field.maxRating || 5 }).map((_, i) => (
                  <div key={i}>
                    {renderRatingIcon(i, (formData[field.id] || 0) >= i + 1, true)}
                  </div>
                ))}
              </div>
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );



        default:
          return (
            <div key={field.id} className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && "*"}
              </label>
              <input
                type={field.type}
                value={formData[field.id] || ""}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.helpText && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
              )}
            </div>
          );
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Registration Form Preview
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              This is how your form will appear to users
            </p>
          </div>

          <form className="space-y-6">
            {fields.map(renderField)}

            {/* Payment Section at Bottom (only show if event is paid AND no payment fields exist in sections) */}
            {isPaid && !hasPaymentFields && (
              <div className="mt-6 pt-6 border-t-2 border-dashed border-yellow-300 dark:border-yellow-700">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💳</span>
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Payment Required: ₹{fee || 'Not set'}
                    </h4>
                  </div>

                  {paymentUrl && (
                    <div className="mb-3">
                      <a
                        href={paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Open Payment Link
                      </a>
                    </div>
                  )}

                  {paymentInstructions && (
                    <div className="mb-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                        <strong>Instructions:</strong>
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        {paymentInstructions}
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                        Payment Screenshot *
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        disabled
                        className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                        UPI Transaction ID *
                      </label>
                      <input
                        type="text"
                        disabled
                        placeholder="Enter UPI transaction ID"
                        className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="submit" className="w-full" disabled>
                Submit Registration (Preview Mode)
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Helper functions
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

  const getImageSizeClass = (size) => {
    switch (size) {
      case "auto": return "max-w-full h-auto";
      case "small": return "max-w-sm h-auto";
      case "medium": return "max-w-md h-auto";
      case "large": return "max-w-lg h-auto";
      case "full": return "max-w-full h-auto";
      default: return "max-w-full h-auto";
    }
  };

  const getBorderStyleClass = (style) => {
    switch (style) {
      case "rounded": return "rounded-md";
      case "rounded-lg": return "rounded-lg";
      case "rounded-full": return "rounded-full";
      case "square": return "rounded-none";
      default: return "rounded-md";
    }
  };

  const getShadowClass = (shadow) => {
    switch (shadow) {
      case "sm": return "shadow-sm";
      case "md": return "shadow-md";
      case "lg": return "shadow-lg";
      case "xl": return "shadow-xl";
      default: return "shadow-none";
    }
  };

  const getButtonStyleClass = (style) => {
    switch (style) {
      case "primary": return "bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg inline-block";
      case "secondary": return "bg-gray-500 text-white hover:bg-gray-600 px-4 py-2 rounded-lg inline-block";
      case "outline": return "border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg inline-block";
      case "link": return "text-blue-600 dark:text-blue-400 hover:underline inline-block";
      case "ghost": return "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg inline-block";
      case "danger": return "bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg inline-block";
      case "success": return "bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg inline-block";
      default: return "bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg inline-block";
    }
  };

  const getButtonSizeClass = (size) => {
    switch (size) {
      case "xs": return "text-xs px-2 py-1";
      case "sm": return "text-sm px-3 py-1";
      case "md": return "text-base px-4 py-2";
      case "lg": return "text-lg px-5 py-2";
      case "xl": return "text-xl px-6 py-3";
      default: return "text-base px-4 py-2";
    }
  };

  const getButtonWidthClass = (width) => {
    switch (width) {
      case "auto": return "";
      case "full": return "w-full";
      case "fit": return "w-fit";
      default: return "";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "arrow": return <ArrowRight className="w-4 h-4" />;
      case "external": return <Link className="w-4 h-4" />;
      case "download": return <Download className="w-4 h-4" />;
      case "play": return <Play className="w-4 h-4" />;
      case "plus": return <Plus className="w-4 h-4" />;
      case "check": return <CheckCircle className="w-4 h-4" />;
      case "info": return <Info className="w-4 h-4" />;
      default: return <ArrowRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Registration Form Builder
        </h3>
        <div className="flex items-center space-x-3">
          <Button

            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? "Edit Form" : "Preview Form"}
          </Button>
          {!previewMode && (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Add Field clicked, current state:", showAddField);
                setShowAddField(true);
                console.log("Add Field state set to true");
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          )}
        </div>
      </div>

      {previewMode ? (
        <FormPreview
          fields={sections.flatMap(s => s.fields || [])}
          isPaid={isPaid}
          fee={fee}
          paymentUrl={paymentUrl}
          paymentInstructions={paymentInstructions}
        />
      ) : (
        <div className="space-y-6">
          {/* Sections List */}
          <div className="space-y-3">
            {sections.map((section, sectionIndex) => (
              <div key={section.id}>
                <motion.div
                  ref={el => { sectionRefs.current[section.id] = el }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      {editingSection === section.id ? (
                        <div className="space-y-2">
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section Title"
                            className="font-semibold text-lg"
                          />
                          <Input
                            value={section.description}
                            onChange={(e) => updateSection(section.id, { description: e.target.value })}
                            placeholder="Section Description (optional)"
                            className="text-sm text-gray-600 dark:text-gray-400"
                          />
                          <Button
                            size="sm"
                            onClick={() => setEditingSection(null)}
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Section {sectionIndex + 1}{section.title ? `: ${section.title}` : ''}
                          </h4>
                          {section.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertSectionAfter(sectionIndex)}
                        title="Insert section after"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, "up")}
                        disabled={sectionIndex === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, "down")}
                        disabled={sectionIndex === sections.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSection(section.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Section Fields */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {section.fields?.map((field, fieldIndex) => (
                        <FieldEditor
                          key={field.id}
                          field={field}
                          index={fieldIndex}
                          sectionId={section.id}
                        />
                      ))}
                    </AnimatePresence>

                    {(!section.fields || section.fields.length === 0) && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          No fields in this section
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setCurrentSectionId(section.id);
                            setShowAddField(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Field to This Section
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Add Field Button */}
                  {section.fields && section.fields.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentSectionId(section.id);
                          setShowAddField(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  )}

                  {/* Section Navigation/Flow Control */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        After section {sectionIndex + 1}:
                      </label>
                    </div>
                    <select
                      value={section.navigation?.type === "section" ? section.navigation.sectionId : (section.navigation?.type || "next")}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "next" || value === "submit") {
                          updateSection(section.id, { navigation: { type: value } });
                        } else {
                          // It's a section ID
                          updateSection(section.id, { navigation: { type: "section", sectionId: value } });
                        }
                      }}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="next">Continue to next section</option>
                      {sections.map((s, idx) => {
                        if (s.id === section.id) return null; // Don't show current section
                        return (
                          <option key={s.id} value={s.id}>
                            Go to section {idx + 1} ({s.title || `Untitled Section`})
                          </option>
                        );
                      })}
                      <option value="submit">Submit form</option>
                    </select>
                    {sectionIndex === sections.length - 1 && section.navigation?.type !== "submit" && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ This is the last section. Consider setting to "Submit form"
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Insert Section Button - between sections */}
                {sectionIndex < sections.length - 1 && (
                  <div className="flex items-center justify-center py-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertSectionAfter(sectionIndex)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-400 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Section
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <Button
            variant="outline"
            onClick={addSection}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Section
          </Button>
        </div>
      )}

      {/* Add Field Modal */}
      <Modal
        isOpen={showAddField}
        onClose={() => {
          console.log("Closing Add Field modal");
          setShowAddField(false);
        }}
        title="Add Form Field"
        size="xl"
      >
        <div className="space-y-8">
          {/* Input Fields */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">📝</span>
              Input Fields
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fieldTypes.filter(f => f.category === "input").map((fieldType) => (
                <motion.button
                  key={fieldType.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Adding field type:", fieldType.type);
                    addField(fieldType.type);
                  }}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{fieldType.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {fieldType.label}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Choice Fields */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">☑️</span>
              Choice Fields
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fieldTypes.filter(f => f.category === "choice").map((fieldType) => (
                <motion.button
                  key={fieldType.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Adding choice field type:", fieldType.type);
                    addField(fieldType.type);
                  }}
                  className="p-4 border-2 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all text-center group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{fieldType.icon}</div>
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {fieldType.label}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content Elements */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-2xl mr-2">🎨</span>
              Content Elements
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fieldTypes.filter(f => f.category === "content").map((fieldType) => (
                <motion.button
                  key={fieldType.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Adding content field type:", fieldType.type);
                    addField(fieldType.type);
                  }}
                  className="p-4 border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-xl hover:border-green-300 dark:hover:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all text-center group"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{fieldType.icon}</div>
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">
                    {fieldType.label}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Field Settings Modal */}
      <Modal
        isOpen={!!editingField}
        onClose={() => {
          setEditingField(null);
          setEditingFieldDraft(null);
        }}
        title={`Edit ${fieldTypes.find(f => f.type === editingFieldDraft?.type)?.label || "Field"}`}
        size="lg"
      >
        {editingFieldDraft && (
          <div className="space-y-6">
            {/* Content Fields Settings */}
            {editingFieldDraft.type === "label" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content Type
                  </label>
                  <select
                    value={editingFieldDraft.contentType || "text"}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, contentType: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Plain Text</option>
                    <option value="markdown">Markdown (with links)</option>
                    <option value="html">HTML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content Text
                  </label>
                  <textarea
                    value={editingFieldDraft.content || ""}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, content: e.target.value })}
                    placeholder="Enter your content here. For markdown, you can use [link text](https://example.com)"
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editingFieldDraft.contentType === "markdown" && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Use [link text](https://example.com) to create clickable links
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Font Size
                    </label>
                    <select
                      value={editingFieldDraft.fontSize || "medium"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, fontSize: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="xs">Extra Small</option>
                      <option value="sm">Small</option>
                      <option value="medium">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                      <option value="2xl">2XL</option>
                      <option value="3xl">3XL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alignment
                    </label>
                    <select
                      value={editingFieldDraft.alignment || "left"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, alignment: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Text Color
                    </label>
                    <select
                      value={editingFieldDraft.textColor || "default"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, textColor: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="default">Default</option>
                      <option value="primary">Primary (Blue)</option>
                      <option value="secondary">Secondary (Gray)</option>
                      <option value="success">Success (Green)</option>
                      <option value="warning">Warning (Yellow)</option>
                      <option value="danger">Danger (Red)</option>
                      <option value="muted">Muted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={editingFieldDraft.fontWeight || "normal"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, fontWeight: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semi Bold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`italic-${editingFieldDraft.id}`}
                    checked={editingFieldDraft.italic || false}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, italic: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor={`italic-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                    Italic text
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`underline-${editingFieldDraft.id}`}
                    checked={editingFieldDraft.underline || false}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, underline: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor={`underline-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                    Underlined text
                  </label>
                </div>

                {/* Preview */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                  <div
                    className={`${getFontSizeClass(editingFieldDraft.fontSize || "medium")} ${getAlignmentClass(editingFieldDraft.alignment || "left")} ${getTextColorClass(editingFieldDraft.textColor || "default")} ${editingFieldDraft.fontWeight === "bold" ? "font-bold" : editingFieldDraft.fontWeight === "semibold" ? "font-semibold" : editingFieldDraft.fontWeight === "medium" ? "font-medium" : ""} ${editingFieldDraft.italic ? "italic" : ""} ${editingFieldDraft.underline ? "underline" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: editingFieldDraft.contentType === "markdown" ? renderMarkdownLinks(editingFieldDraft.content || "") : editingFieldDraft.content || "Preview text will appear here"
                    }}
                  />
                </div>
              </div>
            )}

            {editingFieldDraft.type === "image" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image Source
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`imageUrl-${editingFieldDraft.id}`}
                        name={`imageSource-${editingFieldDraft.id}`}
                        value="url"
                        checked={!editingFieldDraft.useFileUpload}
                        onChange={() => setEditingFieldDraft({ ...editingFieldDraft, useFileUpload: false })}
                        className="text-blue-600"
                      />
                      <label htmlFor={`imageUrl-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                        Use Image URL/Link
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`imageUpload-${editingFieldDraft.id}`}
                        name={`imageSource-${editingFieldDraft.id}`}
                        value="upload"
                        checked={editingFieldDraft.useFileUpload}
                        onChange={() => setEditingFieldDraft({ ...editingFieldDraft, useFileUpload: true })}
                        className="text-blue-600"
                      />
                      <label htmlFor={`imageUpload-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                        Upload Image File
                      </label>
                    </div>
                  </div>
                </div>

                {!editingFieldDraft.useFileUpload ? (
                  <Input
                    label="Image URL"
                    value={editingFieldDraft.imageUrl || ""}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            console.log("Uploading image file:", file.name, file.size, file.type);
                            // Use your Cloudinary upload utility
                            const uploadResult = await uploadFormBuilderImage(file); // This should return the Cloudinary URL
                            console.log("Upload result:", uploadResult);

                            if (uploadResult && uploadResult.url) {
                              setEditingFieldDraft({ ...editingFieldDraft, imageUrl: uploadResult.url });
                            } else if (typeof uploadResult === 'string') {
                              // Handle case where function returns just the URL string
                              setEditingFieldDraft({ ...editingFieldDraft, imageUrl: uploadResult });
                            } else {
                              throw new Error("Invalid upload result format");
                            }
                          } catch (error) {
                            console.error("Error uploading image:", error);
                            alert(`Failed to upload image: ${error.message}. Please try again.`);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>
                )}

                <Input
                  label="Alt Text (Accessibility)"
                  value={editingFieldDraft.altText || ""}
                  onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, altText: e.target.value })}
                  placeholder="Description of the image for screen readers"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image Size
                    </label>
                    <select
                      value={editingFieldDraft.imageSize || "auto"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, imageSize: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto (Original)</option>
                      <option value="small">Small (200px)</option>
                      <option value="medium">Medium (400px)</option>
                      <option value="large">Large (600px)</option>
                      <option value="full">Full Width</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alignment
                    </label>
                    <select
                      value={editingFieldDraft.alignment || "center"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, alignment: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Border Style
                    </label>
                    <select
                      value={editingFieldDraft.borderStyle || "rounded"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, borderStyle: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">No Border</option>
                      <option value="rounded">Rounded</option>
                      <option value="rounded-lg">Large Rounded</option>
                      <option value="rounded-full">Circular</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shadow Effect
                    </label>
                    <select
                      value={editingFieldDraft.shadow || "none"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, shadow: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">No Shadow</option>
                      <option value="sm">Small Shadow</option>
                      <option value="md">Medium Shadow</option>
                      <option value="lg">Large Shadow</option>
                      <option value="xl">Extra Large Shadow</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`clickable-${editingFieldDraft.id}`}
                    checked={editingFieldDraft.clickable || false}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, clickable: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor={`clickable-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                    Make image clickable (opens in new tab)
                  </label>
                </div>

                {editingFieldDraft.clickable && (
                  <Input
                    label="Click URL (Optional)"
                    value={editingFieldDraft.clickUrl || ""}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, clickUrl: e.target.value })}
                    placeholder="https://example.com (leave empty to use image URL)"
                  />
                )}

                {editingFieldDraft.imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                    <div className={`${getAlignmentClass(editingFieldDraft.alignment || "center")}`}>
                      <img
                        src={editingFieldDraft.imageUrl}
                        alt={editingFieldDraft.altText || "Preview"}
                        className={`${getImageSizeClass(editingFieldDraft.imageSize || "auto")} ${getBorderStyleClass(editingFieldDraft.borderStyle || "rounded")} ${getShadowClass(editingFieldDraft.shadow || "none")} border-2 border-gray-300 dark:border-gray-600 ${editingFieldDraft.clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                        onError={(e) => {
                          e.target.src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400";
                        }}
                        onClick={() => {
                          if (editingFieldDraft.clickable) {
                            const url = editingFieldDraft.clickUrl || editingFieldDraft.imageUrl;
                            if (url) window.open(url, '_blank');
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {editingFieldDraft.type === "rating" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Rating
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={editingFieldDraft.iconType === "faces" ? 5 : 10}
                    value={editingFieldDraft.maxRating || 5}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, maxRating: parseInt(e.target.value) })}
                    disabled={editingFieldDraft.iconType === "faces"}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editingFieldDraft.iconType === "faces" && (
                    <p className="text-xs text-gray-500 mt-1">Faces scale is fixed to 5 emotions.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: "star", label: "Star", icon: <Star className="w-6 h-6 text-yellow-500 fill-current" /> },
                      { type: "heart", label: "Heart", icon: <Heart className="w-6 h-6 text-red-500 fill-current" /> },
                      { type: "thumbsUp", label: "Thumbs Up", icon: <ThumbsUp className="w-6 h-6 text-blue-500 fill-current" /> },
                      { type: "faces", label: "Faces", icon: <Smile className="w-6 h-6 text-green-500" /> },
                      { type: "sun", label: "Sun", icon: <Sun className="w-6 h-6 text-orange-400 fill-current" /> },
                      { type: "moon", label: "Moon", icon: <Moon className="w-6 h-6 text-indigo-500 fill-current" /> },
                      { type: "zap", label: "Lightning", icon: <Zap className="w-6 h-6 text-yellow-500 fill-current" /> },
                      { type: "award", label: "Award", icon: <Award className="w-6 h-6 text-purple-500 fill-current" /> },
                      { type: "crown", label: "Crown", icon: <Crown className="w-6 h-6 text-yellow-600 fill-current" /> },
                    ].map((option) => (
                      <div
                        key={option.type}
                        onClick={() => setEditingFieldDraft({
                          ...editingFieldDraft,
                          iconType: option.type,
                          maxRating: option.type === "faces" ? 5 : (editingFieldDraft.maxRating || 5)
                        })}
                        className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${editingFieldDraft.iconType === option.type ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}
                      >
                        {option.icon}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {editingFieldDraft.type === "link" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Link URL"
                    value={editingFieldDraft.linkUrl || ""}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, linkUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                  <Input
                    label="Link Text"
                    value={editingFieldDraft.linkText || ""}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, linkText: e.target.value })}
                    placeholder="Click here"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Button Style
                    </label>
                    <select
                      value={editingFieldDraft.buttonStyle || "primary"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, buttonStyle: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="primary">Primary Button</option>
                      <option value="secondary">Secondary Button</option>
                      <option value="outline">Outline Button</option>
                      <option value="link">Text Link</option>
                      <option value="ghost">Ghost Button</option>
                      <option value="danger">Danger Button</option>
                      <option value="success">Success Button</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Button Size
                    </label>
                    <select
                      value={editingFieldDraft.buttonSize || "md"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, buttonSize: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="xs">Extra Small</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alignment
                    </label>
                    <select
                      value={editingFieldDraft.alignment || "left"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, alignment: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Width
                    </label>
                    <select
                      value={editingFieldDraft.buttonWidth || "auto"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, buttonWidth: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto Width</option>
                      <option value="full">Full Width</option>
                      <option value="fit">Fit Content</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`newTab-${editingFieldDraft.id}`}
                    checked={editingFieldDraft.openInNewTab || false}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, openInNewTab: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor={`newTab-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                    Open in new tab
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`icon-${editingFieldDraft.id}`}
                    checked={editingFieldDraft.showIcon || false}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, showIcon: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor={`icon-${editingFieldDraft.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                    Show icon
                  </label>
                </div>

                {editingFieldDraft.showIcon && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Icon Type
                      </label>
                      <select
                        value={editingFieldDraft.iconType || "arrow"}
                        onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, iconType: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="arrow">Arrow Right</option>
                        <option value="external">External Link</option>
                        <option value="download">Download</option>
                        <option value="play">Play</option>
                        <option value="plus">Plus</option>
                        <option value="check">Check</option>
                        <option value="info">Info</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Icon Position
                      </label>
                      <select
                        value={editingFieldDraft.iconPosition || "right"}
                        onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, iconPosition: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                  <div className={`${getAlignmentClass(editingFieldDraft.alignment || "left")}`}>
                    <button
                      className={`${getButtonStyleClass(editingFieldDraft.buttonStyle || "primary")} ${getButtonSizeClass(editingFieldDraft.buttonSize || "md")} ${getButtonWidthClass(editingFieldDraft.buttonWidth || "auto")} ${editingFieldDraft.showIcon ? "inline-flex items-center gap-2" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (editingFieldDraft.linkUrl) {
                          if (editingFieldDraft.openInNewTab) {
                            window.open(editingFieldDraft.linkUrl, '_blank');
                          } else {
                            window.location.href = editingFieldDraft.linkUrl;
                          }
                        }
                      }}
                    >
                      {editingFieldDraft.showIcon && editingFieldDraft.iconPosition === "left" && (
                        <span className="text-sm">{getIcon(editingFieldDraft.iconType || "arrow")}</span>
                      )}
                      {editingFieldDraft.linkText || "Preview Button"}
                      {editingFieldDraft.showIcon && editingFieldDraft.iconPosition === "right" && (
                        <span className="text-sm">{getIcon(editingFieldDraft.iconType || "arrow")}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Field Settings */}
            {!["label", "image", "link"].includes(editingFieldDraft.type) && (
              <div className="space-y-4">
                <Input
                  label="Field Label"
                  value={editingFieldDraft.label || ""}
                  onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, label: e.target.value })}
                  placeholder="Enter field label"
                />
                {!["rating", "file"].includes(editingFieldDraft.type) && (
                  <Input
                    label="Placeholder Text"
                    value={editingFieldDraft.placeholder || ""}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, placeholder: e.target.value })}
                    placeholder="Enter placeholder text"
                  />
                )}
                <Input
                  label="Help Text"
                  value={editingFieldDraft.helpText || ""}
                  onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, helpText: e.target.value })}
                  placeholder="Optional help text for users"
                />
                {editingFieldDraft.type === "file" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Accepted File Types
                    </label>
                    <select
                      value={editingFieldDraft.acceptedFileTypes || "*"}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, acceptedFileTypes: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="*">All Files</option>
                      <option value="image/*">Images Only</option>
                      <option value=".pdf">PDF Only</option>
                      <option value="image/*,.pdf">Images and PDF</option>
                      <option value=".doc,.docx">Word Documents</option>
                      <option value=".xls,.xlsx">Excel Files</option>
                    </select>
                  </div>
                )}

                {/* Email Validation Settings */}
                {editingFieldDraft.type === "email" && (
                  <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Email Validation</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Domain Restriction
                      </label>
                      <select
                        value={editingFieldDraft.emailDomain || "all"}
                        onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, emailDomain: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All emails allowed</option>
                        <option value="hitam">Only @hitam.org emails</option>
                      </select>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {editingFieldDraft.emailDomain === "hitam"
                          ? "✓ Only emails ending with @hitam.org will be accepted"
                          : "✓ Any email address format will be accepted"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Phone Validation Settings */}
                {editingFieldDraft.type === "phone" && (
                  <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Phone Validation</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number Format
                      </label>
                      <select
                        value={editingFieldDraft.phonePattern || "any"}
                        onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, phonePattern: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="any">Any format (10+ digits)</option>
                        <option value="india">Indian format (10 digits)</option>
                        <option value="international">International format (+country code)</option>
                      </select>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {editingFieldDraft.phonePattern === "india"
                          ? "✓ Must be exactly 10 digits"
                          : editingFieldDraft.phonePattern === "international"
                            ? "✓ Must start with + followed by country code"
                            : "✓ At least 10 digits required"}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required-setting"
                    checked={editingFieldDraft.required || false}
                    onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, required: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="required-setting" className="text-sm text-gray-700 dark:text-gray-300">
                    Required field
                  </label>
                </div>

                {/* Unique Value Setting - Only for specific field types */}
                {["text", "email", "number", "phone"].includes(editingFieldDraft.type) && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="unique-setting"
                      checked={editingFieldDraft.isUnique || false}
                      onChange={(e) => setEditingFieldDraft({ ...editingFieldDraft, isUnique: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="unique-setting" className="text-sm text-gray-700 dark:text-gray-300">
                      Unique Value (e.g., Roll No, Email)
                    </label>
                  </div>
                )}

                {/* Conditional Field Visibility */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="field-conditional"
                      checked={editingFieldDraft.conditional?.enabled || false}
                      onChange={(e) => setEditingFieldDraft({
                        ...editingFieldDraft,
                        conditional: { ...editingFieldDraft.conditional, enabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <label htmlFor="field-conditional" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show this field only when:
                    </label>
                  </div>

                  {editingFieldDraft.conditional?.enabled && (
                    <div className="space-y-3 ml-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Field
                        </label>
                        <select
                          value={editingFieldDraft.conditional?.fieldId || ""}
                          onChange={(e) => setEditingFieldDraft({
                            ...editingFieldDraft,
                            conditional: { ...editingFieldDraft.conditional, fieldId: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-sm border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="">Select a field</option>
                          {getCurrentSection()?.fields?.map(f => f.type !== editingFieldDraft.type && (
                            <option key={f.id} value={f.id}>
                              {f.label || f.type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Equals
                        </label>
                        <input
                          type="text"
                          value={editingFieldDraft.conditional?.value || ""}
                          onChange={(e) => setEditingFieldDraft({
                            ...editingFieldDraft,
                            conditional: { ...editingFieldDraft.conditional, value: e.target.value }
                          })}
                          placeholder="e.g., Student or Faculty"
                          className="w-full px-2 py-1 text-sm border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>

                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        💡 Example: Show "Payment Details" when "Role" = "Student"
                      </p>
                    </div>
                  )}
                </div>
                {/* Options for choice fields */}
                {(editingFieldDraft.type === "select" || editingFieldDraft.type === "radio" || editingFieldDraft.type === "checkbox") && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Options:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFieldDraft({ ...editingFieldDraft, options: [...(editingFieldDraft.options || []), `Option ${(editingFieldDraft.options?.length || 0) + 1}`] })}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {editingFieldDraft.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...editingFieldDraft.options];
                              newOptions[optionIndex] = e.target.value;
                              setEditingFieldDraft({ ...editingFieldDraft, options: newOptions });
                            }}
                            className="flex-1 px-2 py-1 text-sm border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newOptions = editingFieldDraft.options.filter((_, i) => i !== optionIndex);
                              setEditingFieldDraft({ ...editingFieldDraft, options: newOptions });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conditional Section Mapping - Only for choice fields */}
            {["select", "radio", "checkbox"].includes(editingFieldDraft?.type) && editingFieldDraft?.options && editingFieldDraft.options.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  🔀 Conditional Section Mapping
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  Map field options to show specific sections when selected, or submit the form. For example, if "Student" is selected, show Section 2.
                </p>
                <div className="space-y-3">
                  {editingFieldDraft.options.map((option, optionIndex) => {
                    const currentMapping = editingFieldDraft.conditionalMapping?.[option] || [];
                    return (
                      <div key={optionIndex} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            When "{option}" is selected:
                          </span>
                        </div>
                        <div className="space-y-2">
                          <select
                            multiple
                            value={currentMapping}
                            onChange={(e) => {
                              const selectedSections = Array.from(e.target.selectedOptions, option => option.value);
                              const newMapping = {
                                ...(editingFieldDraft.conditionalMapping || {}),
                                [option]: selectedSections
                              };
                              setEditingFieldDraft({
                                ...editingFieldDraft,
                                conditionalMapping: newMapping
                              });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            size={Math.min(sections.length + 1, 6)}
                          >
                            <option value="__submit__">
                              ✓ Submit Form
                            </option>
                            {sections.map((section, sectionIndex) => {
                              const currentSection = sections.find(s => s.fields?.some(f => f.id === editingFieldDraft.id));
                              const currentSectionIndex = sections.findIndex(s => s.id === currentSection?.id);
                              // Only show sections that come after the current section
                              if (sectionIndex <= currentSectionIndex) return null;
                              const targetSectionNumber = sectionIndex + 1; // Dynamic section number
                              return (
                                <option key={section.id} value={section.id}>
                                  Section {targetSectionNumber}: {section.title || `Untitled Section`}
                                </option>
                              );
                            })}
                          </select>
                          {currentMapping.length > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              ✓ Will {currentMapping.includes('__submit__') ? 'submit form' : `show ${currentMapping.length} section(s)`} when "{option}" is selected
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingField(null);
                  setEditingFieldDraft(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  updateField(editingFieldDraft.id, editingFieldDraft);
                  setEditingField(null);
                  setEditingFieldDraft(null);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FormBuilder;