import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Calendar, Users, Trophy, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { organizeMembersByRole, groupCoreTeamByLevel, CORE_TEAM_ROLES, shouldUseLevelWiseDisplay } from "../utils/committeeRoles";
import HighlightsSection from "../components/home/HighlightsSection";

const HomePage = () => {
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      try {
        // Fetch committee members
        const committeeSnapshot = await getDocs(collection(db, "committeeMembers"));
        const members = committeeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCommitteeMembers(members);
      } catch (error) {
        console.warn("Could not fetch committee members:", error.message);
        setCommitteeMembers([]);
      }

      try {
        // Fetch featured event (latest event)
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (events.length > 0) {
          const sortedEvents = events.sort((a, b) =>
            new Date(b.meta?.startDate || 0) - new Date(a.meta?.startDate || 0)
          );
          setFeaturedEvent(sortedEvents[0]);
        }
      } catch (error) {
        console.warn("Could not fetch events:", error.message);
        setFeaturedEvent(null);
      }
    } catch (error) {
      console.warn("General data fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Direct Layout (No Card, No Container) */}
      <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
        {/* Animated Background Gradient */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-teal-900/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-teal-900/20 bg-[length:400%_400%]"
        />

        {/* Content Wrapper - No Container, No Card */}
        <div className="w-full px-4 md:px-12 relative z-10 pt-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-32 justify-center">

            {/* Left Side: Image + Title (Floating) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center lg:w-5/12 flex-shrink-0"
            >
              <div className="relative group mb-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                <img
                  src="/logo.jpg"
                  alt="Hitam AI Logo"
                  className="relative w-72 h-72 md:w-96 md:h-96 object-cover object-center rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
              </div>

              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent leading-tight pb-2 drop-shadow-sm">
                HITAM AI
              </h1>
            </motion.div>

            {/* Right Side: Content & Buttons (Floating) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-6/12 text-center lg:text-left space-y-10"
            >
              <div>
                <h2 className="text-3xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
                  Empowering the <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Future of AI</span>
                </h2>
                <p className="text-xl md:text-3xl text-gray-700 dark:text-gray-200 leading-relaxed font-light max-w-3xl mx-auto lg:mx-0">
                  Empowering the next generation of innovators at HITAM through collaboration, learning, and real-world projects.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-xl shadow-blue-500/20 flex items-center justify-center px-10 py-5 rounded-2xl transition-all hover:scale-105"
                  onClick={() => navigate("/events")}
                >
                  Explore Events
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-purple-600 text-purple-700 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-300 dark:hover:bg-purple-900/20 text-lg font-semibold flex items-center justify-center px-10 py-5 rounded-2xl transition-all hover:scale-105"
                  onClick={() => navigate("/join")}
                >
                  <Users className="mr-3 w-6 h-6" />
                  Join the Club
                </Button>
              </div>

              <div className="flex justify-center lg:justify-start">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-lg flex items-center justify-center transition"
                  onClick={() => navigate("/upcoming")}
                >
                  <Calendar className="mr-3 w-5 h-5" />
                  View Upcoming Activities
                </Button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Weekly Highlights Section */}
      <HighlightsSection />

      {/* About HITAM Section - Feature Layout (Image + Details) */}
      <section className="py-24 px-4 bg-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Image Side */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition duration-500 z-10"></div>
                {/* College Image */}
                <img
                  src="/MAIN-BLOCK.jpg"
                  alt="HITAM Campus - Main Block"
                  className="w-full h-auto object-cover transform group-hover:scale-110 transition duration-700 min-h-[400px]"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <p className="text-white font-medium text-lg">A Green Campus for Sustainable Learning</p>
                </div>
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  About <span className="text-blue-600 dark:text-blue-400">HITAM</span>
                </h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-6 relative"></div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                  Hyderabad Institute of Technology and Management (HITAM) is the first <strong className="font-semibold text-green-600 dark:text-green-400">Green Campus</strong> in India, dedicated to nurturing professionals who contribute to technological advancement and societal development.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light mt-4">
                  We emphasize <strong>"Doing Engineering"</strong> through our unique Project-Based Learning (PBL) approach, ensuring students gain hands-on experience and real-world skills.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Green Campus", desc: "Award-winning sustainable infrastructure" },
                  { title: "Project Based Learning", desc: "Hands-on practical engineering education" },
                  { title: "Autonomous Status", desc: "Academic freedom and updated curriculum" },
                  { title: "Industry Connect", desc: "Strong partnerships with top tech firms" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition duration-300">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => window.open("https://hitam.org", "_blank")}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold shadow-lg transition"
                >
                  Visit Main Website
                </Button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* About HITAM AI Club Section - Feature Layout (Details + Image) */}
      <section className="py-24 px-4 bg-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">

            {/* Image Side (Right) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-purple-900/20 group-hover:bg-transparent transition duration-500 z-10"></div>
                {/* AI / Tech Placeholder Image */}
                <img
                  src="https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=1000&auto=format&fit=crop"
                  alt="AI Club Innovation"
                  className="w-full h-auto object-cover transform group-hover:scale-110 transition duration-700 min-h-[400px]"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <p className="text-white font-medium text-lg">Leading the Way in Artificial Intelligence</p>
                </div>
              </div>
            </motion.div>

            {/* Text Side (Left) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 space-y-8"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  About <span className="text-purple-600 dark:text-purple-400">HITAM AI Club</span>
                </h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full mb-6 relative"></div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light">
                  The HITAM AI Club is a vibrant ecosystem where passion meets technology. We are a community of student innovators dedicated to exploring the limitless possibilities of <strong className="font-semibold text-purple-600 dark:text-purple-400">Artificial Intelligence</strong>.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-light mt-4">
                  Our mission is to foster a culture of research, collaboration, and continuous learning, preparing students to become leaders in the AI revolution.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Hands-on workshops on ML, DL, and NLP",
                  "Weekly interactive learning sessions",
                  "Expert sessions with industry leaders",
                  "Real-world AI application projects",
                  "Research and publication support"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                    </div>
                    <span className="text-lg">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate("/join")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-purple-500/30 transition flex items-center"
                >
                  Join the Club
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Committee Members Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Our Committee
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Meet the dedicated team behind HITAM AI Club
            </p>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-64"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {(() => {
                const facultyMembers = committeeMembers.filter(m => m.category === 'faculty').sort((a, b) => (a.priority || 99) - (b.priority || 99));
                const students = committeeMembers.filter(m => (m.category || 'student') === 'student');
                const { coreTeam, committeeMembers: nonCoreMembers } = organizeMembersByRole(students);
                const coreTeamByLevel = groupCoreTeamByLevel(coreTeam);
                const useLevelWise = shouldUseLevelWiseDisplay(coreTeam);

                return (
                  <>
                    {/* Faculty Section - NEW */}
                    {facultyMembers.length > 0 && (
                      <div className="mb-20">

                        <div className="flex flex-wrap justify-center gap-8">
                          {facultyMembers.map((member, index) => (
                            <div key={member.id} className="w-64">
                              <Card delay={index * 0.1}>
                                <div className="p-6 text-center">
                                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                    {member.photoUrl ? (
                                      <img
                                        src={member.photoUrl}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-white text-2xl font-bold">
                                        {member.name?.charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {member.name}
                                  </h3>
                                  <p className="text-purple-600 dark:text-purple-400 font-medium whitespace-pre-wrap">
                                    {member.role}
                                  </p>
                                  {member.designation && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                                      {member.designation}
                                    </p>
                                  )}
                                </div>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Core Team Section */}
                    {coreTeam.length > 0 && (
                      <div>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-8">
                          Core Team
                        </h3>

                        {/* Level-wise hierarchical, center aligned (Rule B) */}
                        {useLevelWise ? (
                          <div className="space-y-8">
                            {CORE_TEAM_ROLES.map((role) => {
                              const members = coreTeamByLevel[role] || [];
                              return members.length > 0 ? (
                                <div key={role}>
                                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
                                    {role}
                                  </h4>
                                  <div className="flex flex-wrap justify-center gap-8">
                                    {members.map((member, index) => (
                                      <div key={member.id} className="w-64">
                                        <Card delay={index * 0.05}>
                                          <div className="p-6 text-center">
                                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                              {member.photoUrl ? (
                                                <img
                                                  src={member.photoUrl}
                                                  alt={member.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <span className="text-white text-2xl font-bold">
                                                  {member.name?.charAt(0)}
                                                </span>
                                              )}
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                              {member.name}
                                            </h3>
                                            <p className="text-blue-600 dark:text-blue-400 font-medium">
                                              {member.role}
                                            </p>
                                          </div>
                                        </Card>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          /* Left-to-right display (Rule A) */
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {CORE_TEAM_ROLES.map((role) => {
                              const members = coreTeamByLevel[role] || [];
                              return (
                                <div key={role}>
                                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 ml-2">
                                    {role}
                                  </h4>
                                  <div className="space-y-6">
                                    {members.map((member, index) => (
                                      <Card key={member.id} delay={index * 0.05}>
                                        <div className="p-6 text-center">
                                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                            {member.photoUrl ? (
                                              <img
                                                src={member.photoUrl}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <span className="text-white text-2xl font-bold">
                                                {member.name?.charAt(0)}
                                              </span>
                                            )}
                                          </div>
                                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            {member.name}
                                          </h3>
                                          <p className="text-blue-600 dark:text-blue-400 font-medium">
                                            {member.role}
                                          </p>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Committee Members Section (always full-width below Core Team) */}
                    {nonCoreMembers.length > 0 && (
                      <div className="w-full mt-12 clear-both">
                        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-8">
                          Committee Members
                        </h3>
                        <div className="w-full">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {nonCoreMembers.map((member, index) => (
                              <Card key={member.id} delay={index * 0.1}>
                                <div className="p-6 text-center">
                                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                    {member.photoUrl ? (
                                      <img
                                        src={member.photoUrl}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-white text-2xl font-bold">
                                        {member.name?.charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {member.name}
                                  </h3>
                                  <p className="text-blue-600 dark:text-blue-400 font-medium">
                                    {member.role}
                                  </p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {coreTeam.length === 0 && nonCoreMembers.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No committee members found yet.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </section>

    </div >
  );
};

export default HomePage;