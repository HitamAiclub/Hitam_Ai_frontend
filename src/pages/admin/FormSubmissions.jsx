import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { Calendar, Users, BarChart3, Trash2, RefreshCw, Archive } from "lucide-react";

const FormSubmissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAllSubmissions();
    }
  }, [user]);

  const fetchAllSubmissions = async () => {
    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log("Fetching submissions for user:", user.uid);

      const activitiesSnapshot = await getDocs(collection(db, "upcomingActivities"));
      console.log("Activities found:", activitiesSnapshot.size);

      const activitiesData = await Promise.all(
        activitiesSnapshot.docs.map(async (doc) => {
          const activity = { id: doc.id, ...doc.data() };

          let registrations = [];
          try {
            const registrationsSnapshot = await getDocs(
              collection(db, "upcomingActivities", doc.id, "registrations")
            );
            registrations = registrationsSnapshot.docs.map(regDoc => ({
              id: regDoc.id,
              activityId: doc.id,
              ...regDoc.data()
            }));
          } catch (regError) {
            console.warn(`Error fetching registrations for ${activity.title}:`, regError);
            // Continue with empty registrations array
          }

          return { ...activity, registrations, type: "activity" };
        })
      );

      setActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setError(error.message);

      // Fallback: try to load from allRegistrations collection
      try {
        const allRegsSnapshot = await getDocs(collection(db, "allRegistrations"));
        const groupedRegistrations = {};

        allRegsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const activityId = data.activityId;
          if (!groupedRegistrations[activityId]) {
            groupedRegistrations[activityId] = {
              id: activityId,
              title: data.activityTitle || "Unknown Activity",
              registrations: [],
              type: "activity"
            };
          }
          groupedRegistrations[activityId].registrations.push({
            id: doc.id,
            ...data
          });
        });

        setActivities(Object.values(groupedRegistrations));
        setError(null);
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        setError("Unable to load submissions. Please check your permissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (activity) => {
    try {
      const activityRef = doc(db, "upcomingActivities", activity.id);
      const newStatus = !activity.isDeleted; // Toggle status (if isDeleted is true, we set to false to restore)

      // If we are restoring (making active), we set isDeleted to false
      // If we are archiving (making inactive), we set isDeleted to true
      await updateDoc(activityRef, {
        isDeleted: !activity.isDeleted,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setActivities(prev => prev.map(a =>
        a.id === activity.id
          ? { ...a, isDeleted: !a.isDeleted }
          : a
      ));

      alert(`Activity ${activity.isDeleted ? "restored" : "archived"} successfully`);
    } catch (error) {
      console.error("Error updating activity status:", error);
      alert("Failed to update activity status");
    }
  };

  const handlePermanentDelete = async () => {
    const activityId = deleteConfirm;
    if (!activityId) return;

    try {
      // 1. Delete all registrations in subcollection
      const registrationsRef = collection(db, "upcomingActivities", activityId, "registrations");
      const registrationsSnap = await getDocs(registrationsRef);
      const batchOps = [];
      registrationsSnap.forEach((docSnap) => {
        batchOps.push(deleteDoc(docSnap.ref));
      });
      await Promise.all(batchOps);

      // 2. Delete all documents in allRegistrations
      const allRegistrationsRef = collection(db, "allRegistrations");
      const allRegistrationsSnap = await getDocs(allRegistrationsRef);
      const deleteAllRegOps = [];
      allRegistrationsSnap.forEach((docSnap) => {
        if (docSnap.data().activityId === activityId) {
          deleteAllRegOps.push(deleteDoc(docSnap.ref));
        }
      });
      await Promise.all(deleteAllRegOps);

      // 3. Delete the activity document itself
      await deleteDoc(doc(db, "upcomingActivities", activityId));

      // 4. Update UI
      setActivities(prev => prev.filter(a => a.id !== activityId));
      setDeleteConfirm(null);
      alert("Activity and all data permanently deleted.");

    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Failed to delete activity. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && activities.length === 0) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Access Error
              </h3>
              <p className="text-red-600 dark:text-red-300 mb-4">
                {error}
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Form Submissions
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage all event and activity registrations
          </p>
        </motion.div>

        {error && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ Some data may be incomplete due to permission issues. Showing available data.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((item, index) => (
            <Card key={item.id} delay={index * 0.1}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {item.title}
                    {item.isDeleted && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        Archived
                      </span>
                    )}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isDeleted
                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }`}>
                    {item.isDeleted ? "Inactive" : "Active"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Submissions: {item.registrations?.length || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {item.eventDate
                        ? new Date(item.eventDate).toLocaleDateString()
                        : "Date not set"
                      }
                    </span>
                  </div>
                  {item.isPaid && (
                    <div className="flex items-center">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Fee: ₹{item.fee}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => navigate(`/admin/form-analytics/${item.id}`)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Data
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => setDeleteConfirm(item.id)}
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleStatus(item)}
                    title={item.isDeleted ? "Restore Activity" : "Archive Activity"}
                    className={item.isDeleted
                      ? "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 border-gray-200"
                    }
                  >
                    {item.isDeleted ? <RefreshCw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {activities.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No form submissions found. Create activities to start receiving submissions.
            </p>
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Permanently Delete Activity"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            <strong>Warning:</strong> This action cannot be undone.
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this activity? This will <strong>permanently remove</strong>:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>The activity and form configuration</li>
              <li>All registered user data and submissions</li>
              <li>All analytics data</li>
            </ul>
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handlePermanentDelete}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>

    </div>

  );
};

export default FormSubmissions;
