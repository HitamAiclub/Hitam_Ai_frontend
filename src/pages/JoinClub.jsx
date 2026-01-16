import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Card from "../components/ui/Card";
import { Book, Users, Mail, Phone, ExternalLink, Globe, MessageCircle, Github, Linkedin, Twitter, Facebook, Instagram, Youtube } from "lucide-react";

// Helper to get icon based on platform name
const getPlatformIcon = (platform) => {
  const p = platform.toLowerCase();
  if (p.includes("github")) return <Github className="w-6 h-6" />;
  if (p.includes("linkedin")) return <Linkedin className="w-6 h-6" />;
  if (p.includes("twitter") || p.includes("x")) return <Twitter className="w-6 h-6" />;
  if (p.includes("facebook")) return <Facebook className="w-6 h-6" />;
  if (p.includes("instagram")) return <Instagram className="w-6 h-6" />;
  if (p.includes("youtube")) return <Youtube className="w-6 h-6" />;
  if (p.includes("whatsapp")) return <MessageCircle className="w-6 h-6" />;
  if (p.includes("discord")) return <MessageCircle className="w-6 h-6" />;
  if (p.includes("telegram")) return <MessageCircle className="w-6 h-6" />;
  return <Globe className="w-6 h-6" />;
};

const JoinClub = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "communityLinks"));
        const linksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLinks(linksData);
      } catch (error) {
        console.error("Error fetching links:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return (
    <div className="min-h-screen pt-16 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Community
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with us on our various platforms. Stay updated with the latest events,
            workshops, and discussions. Be a part of the HITAM AI revolution!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Why Join Us?
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      icon: <Book className="w-6 h-6" />,
                      title: "Learn AI/ML",
                      description: "Hands-on workshops and tutorials on cutting-edge AI technologies"
                    },
                    {
                      icon: <Users className="w-6 h-6" />,
                      title: "Network",
                      description: "Connect with like-minded students and industry professionals"
                    },
                    {
                      icon: <Mail className="w-6 h-6" />,
                      title: "Projects",
                      description: "Work on real-world AI projects and build your portfolio"
                    },
                    {
                      icon: <Phone className="w-6 h-6" />,
                      title: "Career Support",
                      description: "Get guidance for AI careers and internship opportunities"
                    }
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {benefit.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Links Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Connect With Us
                </h2>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : links.length > 0 ? (
                  <div className="space-y-4">
                    {links.map((link, index) => (
                      <motion.a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 rounded-xl transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          {getPlatformIcon(link.platform)}
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {link.platform}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to join
                          </p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </motion.a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Globe className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No social links available at the moment.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default JoinClub;