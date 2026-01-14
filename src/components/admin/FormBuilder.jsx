import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import LoadingSpinner from '../ui/LoadingSpinner';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Button' },
  { value: 'file', label: 'File Upload' },
];

function FormBuilder({ form = null, onSave, onCancel }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold">Admin Only</h2>
        <p className="text-sm text-neutral-600 mt-2">You must be an administrator to edit form settings.</p>
        <div className="mt-4">
          <button onClick={onCancel} className="btn-outline">Close</button>
        </div>
      </div>
    );
  }
  const [formData, setFormData] = useState({
    title: form?.title || '',
    description: form?.description || '',
    sections: form?.sections || [],
  });
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const sectionRefs = useRef({});

  const handleAddSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: Date.now(),
          title: '',
          description: '',
          fields: [],
          conditional: {
            enabled: false,
            fieldId: null,
            condition: 'equals',
            value: '',
          },
        },
      ],
    }));
  };

  const handleInsertSection = (index) => {
    const newSection = {
      id: Date.now(),
      title: '',
      description: '',
      fields: [],
      conditional: {
        enabled: false,
        fieldId: null,
        condition: 'equals',
        value: '',
      },
    };

    setFormData(prev => {
      const sections = [...prev.sections];
      sections.splice(index + 1, 0, newSection);
      return { ...prev, sections };
    });

    // Expand the new section and scroll into view after render
    setExpandedSections(prev => {
      const ns = new Set(prev);
      ns.add(newSection.id);
      return ns;
    });

    setTimeout(() => {
      const el = sectionRefs.current?.[newSection.id];
      if (el && typeof el.scrollIntoView === 'function') {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
          // fallback
          el.scrollIntoView();
        }
      }
    }, 120);
  };

  // Expand and scroll into view when a section is inserted.
  useEffect(() => {
    // Find any section id that is present in refs but not expanded, and expand + scroll if flagged
    const ids = Object.keys(sectionRefs.current || {});
    // nothing to do here by default; insertion flow will trigger scroll via timeout in handler below
  }, [formData.sections]);

  const handleUpdateSection = (sectionId, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s => (s.id === sectionId ? { ...s, ...updates } : s)),
    }));
  };

  const handleRemoveSection = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const handleAddField = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  id: Date.now(),
                  label: '',
                  type: 'text',
                  required: false,
                  options: [],
                },
              ],
            }
          : s
      ),
    }));
  };

  const handleUpdateField = (sectionId, fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map(f => (f.id === fieldId ? { ...f, ...updates } : f)),
            }
          : s
      ),
    }));
  };

  const handleRemoveField = (sectionId, fieldId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.filter(f => f.id !== fieldId),
            }
          : s
      ),
    }));
  };

  const handleAddOption = (sectionId, fieldId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map(f =>
                f.id === fieldId
                  ? { ...f, options: [...(f.options || []), { id: Date.now(), label: '', value: '' }] }
                  : f
              ),
            }
          : s
      ),
    }));
  };

  const handleUpdateOption = (sectionId, fieldId, optionId, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map(f =>
                f.id === fieldId
                  ? {
                      ...f,
                      options: f.options.map(o => (o.id === optionId ? { ...o, ...updates } : o)),
                    }
                  : f
              ),
            }
          : s
      ),
    }));
  };

  const handleRemoveOption = (sectionId, fieldId, optionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map(f =>
                f.id === fieldId
                  ? {
                      ...f,
                      options: f.options.filter(o => o.id !== optionId),
                    }
                  : f
              ),
            }
          : s
      ),
    }));
  };

  const toggleSectionExpanded = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter form title');
      return;
    }

    if (formData.sections.length === 0) {
      alert('Please add at least one section');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
        >
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">
            {form ? 'Edit Form' : 'Create New Form'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Title & Description */}
          <div className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Form Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Workshop Registration"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this form is for..."
                rows="3"
                className="w-full"
              />
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Sections</h2>
              <button
                onClick={handleAddSection}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus size={16} />
                Add Section
              </button>
            </div>

            {formData.sections.length === 0 ? (
              <div className="card p-8 text-center text-neutral-500 dark:text-neutral-400">
                <p>No sections added yet. Click "Add Section" to get started.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {formData.sections.map((section, sectionIndex) => (
                  <div key={section.id}>
                    {/* Add Section Button Before First Section */}
                    {sectionIndex === 0 && (
                      <div className="flex justify-center py-2 mb-2">
                        <button
                          onClick={() => handleInsertSection(-1)}
                          className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800 rounded-full transition-all transform hover:scale-105"
                          title="Add section at the beginning"
                        >
                          <FiPlus size={16} className="inline mr-2" />
                          Add Section
                        </button>
                      </div>
                    )}
                    {/* Section Card */}
                    <motion.div
                      ref={el => { sectionRefs.current[section.id] = el }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative bg-white dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Section Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-neutral-700 dark:bg-neutral-600 text-white text-xs font-semibold rounded">
                        Section {sectionIndex + 1} of {formData.sections.length}
                      </div>

                      {/* Section Header */}
                      <div
                        className="p-6 pt-12 border-l-4 border-primary-500"
                        onClick={() => toggleSectionExpanded(section.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 cursor-pointer hover:opacity-80 transition-opacity">
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                              {section.title || 'Untitled Section'}
                            </h3>
                            {section.description && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {section.description}
                              </p>
                            )}
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                              {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleAddField(section.id);
                              }}
                              className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors flex items-center gap-1"
                              title="Add field to this section"
                            >
                              <FiPlus size={18} />
                              <span className="text-sm font-medium">Add Field</span>
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleRemoveSection(section.id);
                              }}
                              className="p-2 text-neutral-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded transition-colors"
                              title="Delete section"
                            >
                              <FiTrash2 size={18} />
                            </button>
                            {expandedSections.has(section.id) ? (
                              <FiChevronUp size={20} className="text-neutral-600 dark:text-neutral-400 cursor-pointer" />
                            ) : (
                              <FiChevronDown size={20} className="text-neutral-600 dark:text-neutral-400 cursor-pointer" />
                            )}
                          </div>
                        </div>
                      </div>

                  {/* Section Content */}
                  {expandedSections.has(section.id) && (
                    <div className="p-6 space-y-6 border-t border-neutral-200 dark:border-neutral-700">
                      {/* Section Info */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Section Title</label>
                          <input
                            type="text"
                            value={section.title}
                            onChange={e => handleUpdateSection(section.id, { title: e.target.value })}
                            placeholder="e.g., Student Information"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Section Description</label>
                          <textarea
                            value={section.description}
                            onChange={e => handleUpdateSection(section.id, { description: e.target.value })}
                            placeholder="Optional description for this section"
                            rows="2"
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Conditional Logic */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`conditional-${section.id}`}
                            checked={section.conditional.enabled}
                            onChange={e =>
                              handleUpdateSection(section.id, {
                                conditional: { ...section.conditional, enabled: e.target.checked },
                              })
                            }
                            className="w-4 h-4"
                          />
                          <label htmlFor={`conditional-${section.id}`} className="text-sm font-medium">
                            Show this section only when:
                          </label>
                        </div>

                        {section.conditional.enabled && (
                          <div className="grid grid-cols-3 gap-2 ml-6">
                            <select
                              value={section.conditional.fieldId || ''}
                              onChange={e =>
                                handleUpdateSection(section.id, {
                                  conditional: { ...section.conditional, fieldId: e.target.value },
                                })
                              }
                              className="text-sm"
                            >
                              <option value="">Select Field</option>
                              {formData.sections
                                .slice(0, sectionIndex)
                                .flatMap(s => s.fields)
                                .map(f => (
                                  <option key={f.id} value={f.id}>
                                    {f.label}
                                  </option>
                                ))}
                            </select>

                            <select
                              value={section.conditional.condition}
                              onChange={e =>
                                handleUpdateSection(section.id, {
                                  conditional: { ...section.conditional, condition: e.target.value },
                                })
                              }
                              className="text-sm"
                            >
                              <option value="equals">equals</option>
                              <option value="not_equals">not equals</option>
                              <option value="contains">contains</option>
                            </select>

                            <input
                              type="text"
                              value={section.conditional.value}
                              onChange={e =>
                                handleUpdateSection(section.id, {
                                  conditional: { ...section.conditional, value: e.target.value },
                                })
                              }
                              placeholder="Value"
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Section Fields */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Fields in this section</p>
                          <button
                            onClick={() => handleAddField(section.id)}
                            className="text-xs btn-outline"
                          >
                            <FiPlus size={14} className="inline mr-1" />
                            Add Field
                          </button>
                        </div>

                        {section.fields.length === 0 ? (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                            No fields in this section yet
                          </p>
                        ) : (
                          section.fields.map((field, fieldIndex) => (
                            <motion.div
                              key={field.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium">Field {fieldIndex + 1}</p>
                                <button
                                  onClick={() => handleRemoveField(section.id, field.id)}
                                  className="p-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={e =>
                                    handleUpdateField(section.id, field.id, { label: e.target.value })
                                  }
                                  placeholder="Field label"
                                  className="text-xs"
                                />
                                <select
                                  value={field.type}
                                  onChange={e =>
                                    handleUpdateField(section.id, field.id, { type: e.target.value })
                                  }
                                  className="text-xs"
                                >
                                  {FIELD_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onChange={e =>
                                    handleUpdateField(section.id, field.id, { required: e.target.checked })
                                  }
                                  className="w-3 h-3"
                                />
                                <label htmlFor={`required-${field.id}`} className="text-xs">
                                  Required
                                </label>
                              </div>

                              {['select', 'radio', 'checkbox'].includes(field.type) && (
                                <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs font-medium">Options</p>
                                    <button
                                      onClick={() => handleAddOption(section.id, field.id)}
                                      className="text-xs btn-outline py-1 px-2"
                                    >
                                      <FiPlus size={12} className="inline mr-1" />
                                      Add
                                    </button>
                                  </div>

                                  {field.options?.map(opt => (
                                    <div key={opt.id} className="flex gap-1">
                                      <input
                                        type="text"
                                        value={opt.label}
                                        onChange={e =>
                                          handleUpdateOption(section.id, field.id, opt.id, {
                                            label: e.target.value,
                                          })
                                        }
                                        placeholder="Option"
                                        className="flex-1 text-xs"
                                      />
                                      <button
                                        onClick={() => handleRemoveOption(section.id, field.id, opt.id)}
                                        className="p-1 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded"
                                      >
                                        <FiTrash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleInsertSection(sectionIndex);
                          }}
                          className="w-full px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800 rounded transition-all"
                        >
                          <FiPlus size={16} className="inline mr-2" />
                          Add Section
                        </button>
                      </div>
                    </div>
                  )}
                    </motion.div>
                  </div>
                ))}
                {/* Add Section Button After Last Section */}
                <div className="flex justify-center py-2 mt-2">
                  <button
                    onClick={() => handleInsertSection(formData.sections.length - 1)}
                    className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border border-primary-200 dark:border-primary-800 rounded-full transition-all transform hover:scale-105"
                    title="Add section at the end"
                  >
                    <FiPlus size={16} className="inline mr-2" />
                    Add Section
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card p-6 sticky top-24 space-y-4">
            <h3 className="font-semibold">Form Structure</h3>

            <div className="space-y-2 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg max-h-96 overflow-y-auto text-sm">
              {formData.title && (
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{formData.title}</p>
                  {formData.description && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      {formData.description}
                    </p>
                  )}
                </div>
              )}

              {formData.sections.map((section, idx) => (
                <div key={section.id} className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="font-medium text-neutral-900 dark:text-white">
                    Section {idx + 1}: {section.title || 'Untitled'}
                  </p>
                  {section.conditional.enabled && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 italic mt-1">
                      Shown conditionally
                    </p>
                  )}
                  <div className="mt-2 space-y-1">
                    {section.fields.map(f => (
                      <p key={f.id} className="text-xs text-neutral-600 dark:text-neutral-400">
                        • {f.label} {f.required ? '*' : ''}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save/Cancel Buttons */}
            <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="inline mr-2" />
                    Saving...
                  </>
                ) : (
                  form ? 'Update Form' : 'Create Form'
                )}
              </button>

              <button
                onClick={onCancel}
                disabled={saving}
                className="w-full btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormBuilder;
