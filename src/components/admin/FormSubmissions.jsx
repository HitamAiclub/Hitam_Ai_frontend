import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { FiDownload, FiEye, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../ui/LoadingSpinner';
import * as XLSX from 'xlsx';

function FormSubmissions({ formId, onBack }) {
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchFormAndSubmissions();
  }, [formId]);

  const fetchFormAndSubmissions = async () => {
    try {
      // Fetch form details
      const formDoc = await getDoc(doc(db, 'forms', formId));
      if (formDoc.exists()) {
        setForm({ id: formDoc.id, ...formDoc.data() });
      }

      // Fetch submissions
      const q = query(
        collection(db, 'formSubmissions'),
        where('formId', '==', formId)
      );
      const snapshot = await getDocs(q);
      const submissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsData.sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      ));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Use field labels from sections (new format) or fields (old format)
    let fieldLabels = [];
    if (form?.sections && form.sections.length > 0) {
      fieldLabels = form.sections.flatMap(s => s.fields?.map(f => f.label) || []);
    } else {
      fieldLabels = form?.fields?.map(f => f.label) || [];
    }
    
    // Prepare CSV data
    const headers = ['#', 'Submitted At', ...fieldLabels];
    const rows = submissions.map((sub, idx) => [
      idx + 1,
      new Date(sub.submittedAt).toLocaleString(),
      ...fieldLabels.map(label => {
        const value = sub.data?.[label];
        if (Array.isArray(value)) {
          return value.join('; ');
        }
        return value || '';
      }),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row
          .map(cell => {
            // Escape cells with commas or quotes
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(',')
      ),
    ].join('\n');

    // Download CSV
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)
    );
    element.setAttribute('download', `${form?.title || 'form'}_submissions.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportToExcel = () => {
    if (submissions.length === 0) {
      alert('No submissions to export');
      return;
    }

    // Use field labels from sections (new format) or fields (old format)
    let fieldLabels = [];
    if (form?.sections && form.sections.length > 0) {
      fieldLabels = form.sections.flatMap(s => s.fields?.map(f => f.label) || []);
    } else {
      fieldLabels = form?.fields?.map(f => f.label) || [];
    }

    // Prepare Excel data
    const excelData = submissions.map((sub, index) => {
      const row = {
        '#': index + 1,
        'Submitted At': new Date(sub.submittedAt).toLocaleString(),
      };

      // Add field data using labels as keys
      fieldLabels.forEach(label => {
        const value = sub.data?.[label];
        if (Array.isArray(value)) {
          row[label] = value.join('; ');
        } else {
          row[label] = value || '';
        }
      });

      return row;
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

    // Auto-fit column widths
    const maxWidth = 50;
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.min(key.length + 2, maxWidth),
    }));
    worksheet['!cols'] = colWidths;

    // Download Excel
    XLSX.writeFile(workbook, `${form?.title || 'form'}_submissions.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedSubmission(null)}
          className="flex items-center gap-2 text-primary-500 hover:text-primary-600"
        >
          <FiArrowLeft size={20} />
          Back to Submissions
        </button>

        {/* Submission Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Submission Details</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-6">
            {form?.sections && form.sections.length > 0 ? (
              // Display sections with their fields
              form.sections.map(section => (
                <div key={section.id} className="border-b border-neutral-200 dark:border-neutral-700 pb-6">
                  <h3 className="text-lg font-semibold mb-4 p-3 bg-primary-50 dark:bg-primary-900/10 rounded">
                    {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.fields?.map(field => (
                      <div key={field.id}>
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          {field.label}
                        </p>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded">
                          <p className="text-neutral-900 dark:text-white break-words">
                            {Array.isArray(selectedSubmission.data?.[field.label])
                              ? selectedSubmission.data[field.label].join(', ')
                              : selectedSubmission.data?.[field.label] || 'No response'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Fallback for old format with just fields
              form?.fields?.map(field => (
                <div key={field.id} className="pb-6 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    {field.label}
                  </p>
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded">
                    <p className="text-neutral-900 dark:text-white break-words">
                      {Array.isArray(selectedSubmission.data?.[field.label])
                        ? selectedSubmission.data[field.label].join(', ')
                        : selectedSubmission.data?.[field.label] || 'No response'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-500 hover:text-primary-600 mb-4"
          >
            <FiArrowLeft size={20} />
            Back to Forms
          </button>
          <h2 className="text-2xl font-bold">{form?.title}</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {submissions.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="btn-outline flex items-center gap-2"
              title="Export as CSV"
            >
              <FiDownload size={18} />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              className="btn-primary flex items-center gap-2"
              title="Export as Excel"
            >
              <FiDownload size={18} />
              Excel
            </button>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            No submissions yet for this form
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Submitted At</th>
                  {form?.fields?.slice(0, 3).map(field => (
                    <th key={field.id} className="px-6 py-3 text-left font-semibold max-w-xs">
                      {field.label}
                    </th>
                  ))}
                  {form?.fields?.length > 3 && (
                    <th className="px-6 py-3 text-left font-semibold text-neutral-500">
                      +{form.fields.length - 3} more
                    </th>
                  )}
                  <th className="px-6 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission, index) => (
                  <motion.tr
                    key={submission.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    {form?.fields?.slice(0, 3).map(field => (
                      <td key={field.id} className="px-6 py-4 text-sm max-w-xs truncate">
                        {Array.isArray(submission.data?.[field.label])
                          ? submission.data[field.label].join(', ')
                          : submission.data?.[field.label] || '-'}
                      </td>
                    ))}
                    {form?.fields?.length > 3 && (
                      <td className="px-6 py-4 text-sm text-neutral-500">—</td>
                    )}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded inline-flex"
                        title="View details"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormSubmissions;
