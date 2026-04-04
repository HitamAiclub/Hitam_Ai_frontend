import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Card from "../components/ui/Card";
import { Globe, Linkedin, Users, Building2, ExternalLink } from "lucide-react";

const NetworkPage = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "networkPartners"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNetworks(data);
      } catch (error) {
        console.error("Error fetching network partners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNetworks();
  }, []);

  // Group by category to display distinct sections if needed
  const partners = networks.filter(n => n.category === 'Partner');
  const collaborations = networks.filter(n => n.category === 'Collaboration');
  const generalNetworks = networks.filter(n => n.category === 'Network');

  const renderSection = (title, description, items) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-16">
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Users className="text-blue-500 w-6 h-6" />
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((net, index) => (
            <motion.div
              key={net.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col p-6 hover:shadow-xl transition-shadow bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    {net.logoUrl ? (
                      net.entityType === 'person' ? (
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                          <img src={net.logoUrl} alt={net.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-transparent flex items-center justify-start overflow-hidden">
                          <img src={net.logoUrl} alt={net.name} className="w-auto h-full max-w-full object-contain" />
                        </div>
                      )
                    ) : (
                      net.entityType === 'person' ? (
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700">
                          <Building2 className="w-10 h-10 text-gray-400" />
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{net.name}</h3>
                    {net.entityType === 'person' && net.company && (
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-1">{net.company}</p>
                    )}
                    {net.title && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{net.title}</p>}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
                    {net.websiteUrl && (
                      <a href={net.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 font-medium transition-colors">
                        Visit Website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {net.linkedinUrl && (
                      <a href={net.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Network
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Meet the partners, associates, and collaborators who help us deliver excellence.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : networks.length > 0 ? (
          <div className="space-y-8">
            {renderSection("Partners", "Strategic partners we work closely with", partners)}
            {renderSection("Collaborations", "Entities and groups we actively collaborate with", collaborations)}
            {renderSection("Network Associates", "Members of our broader ecosystem", generalNetworks)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No network connections found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkPage;
