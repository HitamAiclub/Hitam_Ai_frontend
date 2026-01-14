import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import LoadingSpinner from '../ui/LoadingSpinner';

function EventOrganizers({ eventId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [eventId]);

  const fetchMembers = async () => {
    try {
      const membersSnapshot = await getDocs(collection(db, 'committeeMembers'));
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter to get organizers/committee members only
      const organizers = membersData.filter(m => 
        m.role && ['Club President', 'Vice President', 'Secretary', 'Event Coordinator'].includes(m.role)
      );
      
      setMembers(organizers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <h2 className="text-2xl font-bold mb-6">Event Organizers</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group"
          >
            <div className="relative overflow-hidden rounded-lg mb-3 bg-neutral-200 dark:bg-neutral-700">
              {member.imageUrl ? (
                <img 
                  src={member.imageUrl} 
                  alt={member.name}
                  className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-neutral-400">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            
            <h3 className="font-semibold text-center text-neutral-900 dark:text-white truncate">
              {member.name}
            </h3>
            <p className="text-sm text-center text-neutral-600 dark:text-neutral-400 truncate">
              {member.role}
            </p>
            
            {member.email && (
              <p className="text-xs text-center text-neutral-500 dark:text-neutral-500 truncate hover:underline cursor-pointer">
                <a href={`mailto:${member.email}`}>
                  {member.email}
                </a>
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default EventOrganizers;
