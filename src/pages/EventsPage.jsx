import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Calendar, Edit, Plus, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import EventEditModal from "../components/events/EventEditModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.meta?.startDate || 0) - new Date(a.meta?.startDate || 0));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "event", label: "Events" },
    { key: "workshop", label: "Workshops" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter uppercase">Events & Workshops</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium tracking-wide">Premium Club Activities & Technical Sessions</p>
        </motion.div>

        <div className="flex flex-wrap justify-between items-center gap-4 mb-12">
          <div className="flex gap-2">
            {filters.map((filter) => (
              <Button key={filter.key} variant={activeFilter === filter.key ? "primary" : "outline"} onClick={() => setActiveFilter(filter.key)} className="rounded-full px-6">
                {filter.label}
              </Button>
            ))}
          </div>
          {user && (
            <Button onClick={() => { setEditingEvent(null); setShowModal(true); }} className="rounded-full">
              <Plus className="w-4 h-4 mr-2" /> New Event
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {events.filter(event => activeFilter === "all" || event.meta?.type === activeFilter).map((event) => (
            <Card key={event.id} className="group relative flex flex-col h-full bg-white dark:bg-gray-800 border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] overflow-hidden">
               <Link to={`/events/${event.id}`} className="absolute inset-0 z-10" />
               <div className="relative h-64 overflow-hidden bg-gray-900">
                  <img src={event.meta?.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={event.meta?.title} />
                  <div className="absolute top-4 right-4 z-20">
                     <span className="px-4 py-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        {event.meta?.type}
                     </span>
                  </div>
               </div>
               <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-black mb-4 text-xs tracking-[0.2em] uppercase">
                    <Calendar className="w-4 h-4 mr-2" />
                    {event.meta?.startDate ? new Date(event.meta.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'DATE TBD'}
                  </div>
                  <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <ExternalLink className="w-3 h-3" /> Explore Details
                    </span>
                    {user && (
                      <div className="flex gap-2 z-20 relative">
                        <button onClick={(e) => { e.preventDefault(); handleEdit(event); }} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
               </div>
            </Card>
          ))}
        </div>
      </div>

      <EventEditModal
        isOpen={showModal}
        onClose={handleCloseModal}
        editingEvent={editingEvent}
      />
    </div>
  );
};

export default EventsPage;