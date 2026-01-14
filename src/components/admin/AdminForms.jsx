import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiLink, FiCopy, FiEye, FiBarChart2 } from 'react-icons/fi';
import LoadingSpinner from '../ui/LoadingSpinner';

function AdminForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'forms'));
      const formsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFormUrl = (formId) => {
    return `${window.location.origin}/upcoming/form/${formId}`;
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await deleteDoc(doc(db, 'forms', formId));
        fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Error deleting form');
      }
    }
  };

  const handleEditForm = (form) => {
    navigate(`/upcoming/forms/${form.id}`);
  };

  const handleCreateForm = () => {
    navigate('/upcoming/forms/new');
  };
  
  const handleViewSubmissions = (formId) => {
    navigate(`/admin/submissions?formId=${formId}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Forms Management</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Create and manage forms for activities, registrations, and surveys
          </p>
        </div>
        <button
          onClick={handleCreateForm}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={20} />
          Create Form
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">No forms created yet</p>
            <button
              onClick={handleCreateForm}
              className="btn-primary"
            >
              Create Your First Form
            </button>
          </div>
        ) : (
          forms.map((form, index) => {
            const formUrl = generateFormUrl(form.id);
            return (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6 flex flex-col h-full"
              >
                {/* Form Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    {form.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {form.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Fields</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {form.fields?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Submissions</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {form.submissionsCount || 0}
                    </p>
                  </div>
                </div>

                {/* Form URL */}
                <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2 flex items-center gap-1">
                    <FiLink size={12} />
                    Public Link
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formUrl}
                      readOnly
                      className="text-xs bg-transparent text-blue-600 dark:text-blue-400 underline truncate flex-1"
                    />
                    <button
                      onClick={() => copyToClipboard(formUrl)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                      title="Copy URL"
                    >
                      <FiCopy size={14} className={copiedId === formUrl ? 'text-green-500' : ''} />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 space-y-1">
                  <p>Created: {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}</p>
                  {form.updatedAt && (
                    <p>Updated: {new Date(form.updatedAt).toLocaleDateString()}</p>
                  )}
                </div>


                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-2">
                  <a
                    href={generateFormUrl(form.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                    title="Preview form"
                  >
                    <FiEye size={16} />
                    <span className="text-sm">Preview</span>
                  </a>
                  <button
                    onClick={() => handleViewSubmissions(form.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="View submissions"
                  >
                    <FiBarChart2 size={16} />
                    <span className="text-sm">Submissions</span>
                  </button>
                  <button
                    onClick={() => handleEditForm(form)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 rounded transition-colors"
                    title="Edit form"
                  >
                    <FiEdit size={16} />
                    <span className="text-sm">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded transition-colors"
                    title="Delete form"
                  >
                    <FiTrash2 size={16} />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminForms;
