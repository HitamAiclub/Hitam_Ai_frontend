import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, DownloadCloud, ArrowLeft, Filter } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';

function ActivityAnalyticsPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filterField, setFilterField] = useState('all');

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  useEffect(() => {
    fetchActivityAndSubmissions();
  }, [activityId]);

  const fetchActivityAndSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch activity details
      const activityDoc = await getDoc(doc(db, 'upcomingActivities', activityId));
      if (activityDoc.exists()) {
        setActivity({ id: activityDoc.id, ...activityDoc.data() });
      }

      // Fetch submissions
      const submissionsSnapshot = await getDocs(
        collection(db, 'upcomingActivities', activityId, 'registrations')
      );
      
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSubmissions(submissionsData);
      generateAnalytics(submissionsData, activityDoc.data()?.formSections);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (data, formSections) => {
    if (!data.length) {
      setAnalytics({
        totalSubmissions: 0,
        fieldStats: {},
        chartData: {}
      });
      return;
    }

    const fieldStats = {};
    const chartData = {};

    // Get all fields from form sections
    const allFields = [];
    if (formSections && Array.isArray(formSections)) {
      formSections.forEach(section => {
        if (section.fields) {
          allFields.push(...section.fields);
        }
      });
    }

    // Analyze each field
    allFields.forEach(field => {
      const fieldId = field.id;
      const fieldLabel = field.label;
      const fieldType = field.type;

      if (!fieldStats[fieldId]) {
        fieldStats[fieldId] = {
          label: fieldLabel,
          type: fieldType,
          responses: [],
          totalResponses: 0,
          filledResponses: 0,
          average: null,
          distribution: {}
        };
      }

      const stats = fieldStats[fieldId];

      data.forEach(submission => {
        const value = submission[fieldId];
        
        if (value) {
          stats.filledResponses++;
          stats.responses.push(value);

          if (fieldType === 'select' || fieldType === 'radio') {
            stats.distribution[value] = (stats.distribution[value] || 0) + 1;
          } else if (fieldType === 'rating' || fieldType === 'number') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              if (!stats.ratings) stats.ratings = [];
              stats.ratings.push(numValue);
            }
          } else if (fieldType === 'checkbox') {
            if (Array.isArray(value)) {
              value.forEach(v => {
                stats.distribution[v] = (stats.distribution[v] || 0) + 1;
              });
            }
          }
        }
        stats.totalResponses++;
      });

      // Calculate average for ratings/numbers
      if (stats.ratings && stats.ratings.length > 0) {
        stats.average = (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(2);
      }

      // Create chart data for select/radio/checkbox fields
      if ((fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && Object.keys(stats.distribution).length > 0) {
        chartData[fieldId] = Object.entries(stats.distribution).map(([key, count]) => ({
          name: key,
          value: count,
          percentage: ((count / stats.filledResponses) * 100).toFixed(1)
        }));
      }
    });

    setAnalytics({
      totalSubmissions: data.length,
      fieldStats,
      chartData,
      formFields: allFields
    });
  };

  const downloadCSV = () => {
    if (!submissions.length || !analytics) return;

    const fields = analytics.formFields || [];
    
    // Create header
    const headers = ['Submission Date', 'Registration ID', ...fields.map(f => f.label)];
    
    // Create rows
    const rows = submissions.map(submission => {
      const row = [
        submission.timestamp ? new Date(submission.timestamp.toDate()).toLocaleString() : 'N/A',
        submission.id
      ];
      
      fields.forEach(field => {
        const value = submission[field.id];
        if (Array.isArray(value)) {
          row.push(value.join(', '));
        } else {
          row.push(value || '');
        }
      });
      
      return row;
    });

    // Combine and create CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `${activity?.title || 'activity'}-responses.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadExcel = () => {
    if (!submissions.length || !analytics) return;

    // For this, you'd typically use a library like xlsx
    // For now, we'll create a CSV as Excel can import CSV
    alert('Excel export coming soon! Use CSV download for now.');
  };

  if (loading) return <LoadingSpinner />;

  if (!activity || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No data found</p>
          <Button onClick={() => navigate('/admin/form-submissions')} className="mt-4">
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/form-submissions')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{activity.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">Form Analytics & Responses</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={downloadCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <Button onClick={downloadExcel} className="flex items-center gap-2">
              <DownloadCloud className="w-4 h-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            whileHover={{ translateY: -5 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Submissions</p>
            <p className="text-4xl font-bold text-blue-600">{analytics.totalSubmissions}</p>
          </motion.div>
          
          <motion.div
            whileHover={{ translateY: -5 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Form Fields</p>
            <p className="text-4xl font-bold text-green-600">{analytics.formFields?.length || 0}</p>
          </motion.div>
          
          <motion.div
            whileHover={{ translateY: -5 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Completion Rate</p>
            <p className="text-4xl font-bold text-purple-600">100%</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {Object.entries(analytics.chartData).map(([fieldId, data]) => {
            const field = analytics.formFields?.find(f => f.id === fieldId);
            if (!data || data.length === 0) return null;

            return (
              <motion.div
                key={fieldId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
              >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  {field?.label}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} responses`} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            );
          })}
        </div>

        {/* Statistics Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Field Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.formFields?.map(field => {
              const stats = analytics.fieldStats[field.id];
              if (!stats) return null;

              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">{field.label}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Responses:</span>
                      <span className="font-semibold">{stats.filledResponses}/{stats.totalResponses}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Response Rate:</span>
                      <span className="font-semibold">{((stats.filledResponses / stats.totalResponses) * 100).toFixed(1)}%</span>
                    </div>
                    
                    {stats.average && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Average Rating:</span>
                        <span className="font-semibold text-yellow-600">{stats.average} ⭐</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Responses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md overflow-x-auto">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">All Responses</h3>
          
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">ID</th>
                {analytics.formFields?.slice(0, 5).map(field => (
                  <th key={field.id} className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                    {field.label}
                  </th>
                ))}
                {analytics.formFields?.length > 5 && (
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                    +{analytics.formFields.length - 5} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission, idx) => (
                <tr key={submission.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-300">
                    {submission.timestamp ? new Date(submission.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-300 text-xs font-mono">{submission.id.slice(0, 8)}</td>
                  {analytics.formFields?.slice(0, 5).map(field => (
                    <td key={field.id} className="py-3 px-4 text-gray-700 dark:text-gray-400 max-w-xs truncate">
                      {Array.isArray(submission[field.id]) 
                        ? submission[field.id].join(', ') 
                        : submission[field.id] || '-'}
                    </td>
                  ))}
                  {analytics.formFields?.length > 5 && (
                    <td className="py-3 px-4 text-gray-500">View Full</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default ActivityAnalyticsPage;
